// 每个步骤中的 follow、fly_to 等调用会使用刚刚算出的数据。
export const waypoints = {
  "WP-01": [-20, -12], "WP-02": [2, -19], "WP-03": [20, -9],
  "WP-04": [20, 12], "WP-05": [2, 19], "WP-06": [-17, 15],
  "WP-B1": [-22, 1], "WP-B2": [11, 7], "PAD": [0, 0],
};

const step = (title, kind, hint, code, value, check) => ({
  title, kind, hint, code, value, check,
});

export const lessons = [
  {
    name: "运算符",
    title: "接上备用航线",
    goal: "把两份航点表接起来。罗盘检查清单有几项就自旋几圈，相机是否在清单里决定 8 字扫描的圈数。",
    scenarios: [
      ["广场巡检 · 有相机", { main: ["WP-01", "WP-02"], backup: ["WP-B2"], checks: 2, tasks: ["GPS", "Camera"] }],
      ["北侧巡检 · 无相机", { main: ["WP-06", "WP-05"], backup: ["WP-04", "WP-B1"], checks: 1, tasks: ["GPS", "IMU"] }],
    ],
    setup: `# 航点和载荷数据随情境变化。
main = @main
backup = @backup
count = @checks
payload = @tasks`,
    steps: [
      step("拼接航点", "operator", "想一想哪个运算符可以把两张清单首尾接起来。", `# 主航点飞完后，接着飞备用航点。
route = main [[blank]] backup
follow(route)`, "route", "route == [*main, *backup]"),
      step("倍增检查项", "operator", "这里要重复清单整体，检查次数由 count 给出。", `# 每条罗盘检查指令对应原地自旋一圈。
checks = ["Compass"] [[blank]] count
spin(len(checks))`, "checks", "checks == ['Compass'] * count"),
      step("核对载荷", "member", "判断相机这个值是否是载荷列表的成员。", `# 有相机飞整圈，无相机先飞半圈试航。
camera_ready = "Camera" [[blank]] payload
scan(1 if camera_ready else 0.5)`, "camera_ready", "camera_ready == ('Camera' in payload)"),
    ],
  },
  {
    name: "索引与替换",
    title: "绕开临时封闭航点",
    goal: "先飞到清单中的第二个点，再换掉一个点、换掉一整段。观察代码改动前后的航点顺序。",
    scenarios: [
      ["东侧施工", { route: ["WP-01", "WP-02", "WP-03", "WP-04"], change: "WP-B2", bypass: ["WP-06"] }],
      ["西侧施工", { route: ["WP-05", "WP-06", "WP-B1", "WP-01"], change: "WP-02", bypass: ["WP-03", "WP-04", "WP-B2"] }],
    ],
    setup: `# 预备一份原始航线，下面会直接编辑 route。
route = @route
replacement = @change
bypass = @bypass
original = list(route)`,
    steps: [
      step("读取第二个航点", "index", "Python 列表的第一个位置从 0 开始编号。", `# 先飞到清单里的第二个点。
target = route[[[blank]]]
follow([target])`, "target", "target == original[1]"),
      step("替换一个航点", "index", "想想要修改清单里第三个位置，该写哪个下标。", `# 把第三个点换成新的检查点，飞去核对。
route[[[blank]]] = replacement
follow([route[2]])`, "route", "route == [*original[:2], replacement, *original[3:]]"),
      step("整段替换", "slice", "换掉中间两个位置。切片的右边界指向保留的下一项。", `# 中间两个点整体换成绕行段，清单长度也可以变化。
route[[[blank]]] = bypass
follow(route)`, "route", "route == [original[0], *bypass, original[-1]]"),
      step("读取末段", "slice", "用负数从末尾数，保留倒数两个航点。", `# 把最后两个点单独取出来，作为复查路线。
tail = route[[[blank]]]
follow(tail)`, "tail", "tail == route[-2:]"),
    ],
  },
  {
    name: "删除与清空",
    title: "撤销航点，回收任务",
    goal: "按位置、按值和弹出返回值依次改清单。清单清空后，飞回起降台并降到地面。",
    scenarios: [
      ["撤离东区", { route: ["WP-01", "WP-02", "WP-B2", "WP-04", "WP-B2"], blocked: "WP-B2" }],
      ["撤离北区", { route: ["WP-03", "WP-B1", "WP-05", "WP-06", "WP-B1"], blocked: "WP-B1" }],
    ],
    setup: `route = @route
blocked_point = @blocked
original = list(route)`,
    steps: [
      step("按下标删除", "delete", "找一条按下标删除元素的语句，此处空格在列表名前面。", `# 首点临时封闭，删掉第一项再飞。
[[blank]] route[0]
follow(route)`, "route", "route == original[1:]"),
      step("只删除首次匹配", "method", "按航点名称删除，清单里第二次出现的同名点应当保留。", `# 删除第一次出现的封闭点，再按新顺序飞。
route.[[blank]](blocked_point)
follow(route)`, "route", "route.count(blocked_point) == 1 and len(route) == 3"),
      step("飞往弹出的航点", "method", "需要一个既能从列表取走某项，又把这项交给变量的方法。", `# 把倒数第二个点交给急件任务，立即飞向它。
priority = route.[[blank]](-2)
follow([priority])`, "(priority, route)", "priority == original[3] and len(route) == 2"),
      step("清空并降落", "method", "清空现有列表，源代码会检查清单是否已经没有航点。", `# 收工：清单为空就返回起降台，在 0 米落地。
route.[[blank]]()
if not route:
    follow(["PAD"])
    climb(0)`, "route", "route == []"),
    ],
  },
  {
    name: "添加与排序",
    title: "编排临时配送路线",
    goal: "把单点追加、途中插入、批量接收。比较编号排序和原地反转后，第一站和最后一站的变化。",
    scenarios: [
      ["下午配送", { route: ["WP-03", "WP-01"], add: "WP-05", insert: "WP-B1", extra: ["WP-06", "WP-02"] }],
      ["傍晚配送", { route: ["WP-04", "WP-06"], add: "WP-02", insert: "WP-B2", extra: ["WP-05", "WP-01"] }],
    ],
    setup: `route = @route
original = list(route)
last_stop = @add
quick_stop = @insert
new_stops = @extra`,
    steps: [
      step("末尾追加", "method", "只有一个新航点，要把它放在清单末尾。", `# 飞到新增的终点，确认它已纳入路线。
route.[[blank]](last_stop)
follow([route[-1]])`, "route", "route == [*original, last_stop]"),
      step("途中插入", "method", "要指定新航点的位置，同时保留原来该位置的航点。", `# 在原路线第二个位置插入急件点。
route.[[blank]](1, quick_stop)
follow([route[1]])`, "route", "route == [original[0], quick_stop, *original[1:], last_stop]"),
      step("接上多站", "method", "展开新清单里的各个航点，逐个加入原清单。", `# 批量接收任务，按顺序飞过新增的两个点。
route.[[blank]](new_stops)
follow(route[-len(new_stops):])`, "route", "route[-len(new_stops):] == new_stops"),
      step("按航点编号排序", "method", "找一个会直接修改列表、按编号从小到大排的方法。", `# 整理航线后，按新顺序飞行。
route.[[blank]]()
outbound = list(route)
follow(route)`, "route", "route == sorted([*original, last_stop, quick_stop, *new_stops])"),
      step("反向巡航", "method", "把刚才的顺序整个倒过来，首尾对调。", `# 上升到复查高度，依照反转后的顺序飞。
route.[[blank]]()
climb(22)
follow(route)`, "route", "route == outbound[::-1]"),
    ],
  },
  {
    name: "复制与引用",
    title: "分清备用航线和共享清单",
    goal: "对比修改副本与修改共享列表。飞原航线终点、备用终点，再观察共享修改如何改变原线第一站。",
    scenarios: [
      ["双机交接", { route: ["WP-01", "WP-03"], detour: "WP-05", update: "WP-04" }],
      ["临时备降", { route: ["WP-04", "WP-06"], detour: "WP-B2", update: "WP-02" }],
    ],
    setup: `route = @route
detour = @detour
new_first = @update
old_first = route[0]`,
    steps: [
      step("复制航线", "method", "要得到内容相同、可以独立修改的一份列表。", `# 把路线交给备用机试飞，原清单仍在控制台。
reserve = route.[[blank]]()
follow(reserve)`, "(route, reserve)", "reserve == route and reserve is not route"),
      step("只改备用机终点", "index", "从末尾数的第一个位置可以用负数表示。", `# 改备用列表的最后一项，飞到新终点。
reserve[[[blank]]] = detour
follow([reserve[-1]])`, "(route, reserve)", "reserve == [*route[:-1], detour] and route[-1] != detour"),
      step("引用同一张清单", "name", "直接使用主路线的变量名，观察共享修改影响的对象。", `# 让另一块调度面板引用主路线，并在面板里改首站。
dispatch = [[blank]]
dispatch[0] = new_first
follow([route[0]])`, "(route, dispatch, reserve)", "route is dispatch and route[0] == new_first and reserve[0] == old_first"),
    ],
  },
  {
    name: "元组与返航",
    title: "锁定返航坐标",
    goal: "把东、北、高度写在同一条固定记录里。读取元组让模型飞行，最后观察 Python 拒绝改写坐标后，无人机如何返回原定位置。",
    scenarios: [
      ["西南平台 · 12 m", { x: -12, y: -9, z: 12 }],
      ["东北平台 · 24 m", { x: 13, y: 11, z: 24 }],
    ],
    setup: `# 模拟坐标单位为米，x 向东，y 向北。
home_x, home_y, home_z = @x, @y, @z`,
    steps: [
      step("把三个值打包", "comma", "思考用什么标点把元组中的相邻元素隔开。", `# 把坐标打包成一条元组记录，飞到平台上方。
home_point = (home_x [[blank]] home_y, home_z)
fly_to(home_point[0], home_point[1])`, "home_point", "home_point == (home_x, home_y, home_z)"),
      step("解包北向坐标", "name", "解包后的三个变量按位置对应。看下一行试飞代码需要哪个名字。", `# 解包后按东向坐标的相反值飞，模拟从对面进场。
east, [[blank]], height = home_point
fly_to(-east, north)`, "(east, north, height)", "(east, north, height) == home_point"),
      step("读取高度值", "index", "高度是坐标记录的第三项，注意从 0 编号。", `# 读取元组里的返航高度，调整到对应的米数。
approach = home_point[[[blank]]]
climb(approach)`, "approach", "approach == home_z"),
      step("创建单元素元组", "comma", "单元素元组需要一个记号，帮助 Python 区分元组和普通括号。", `# 每个进场高度对应半圈 8 字校验。
heights = (approach[[blank]])
scan(len(heights) / 2)`, "heights", "type(heights) is tuple and heights == (approach,)"),
      step("识别不可修改", "exception", "提示来自 Python 的赋值失败。可以结合真实报错判断是哪种异常。", `# 故意写一次元组元素，捕获异常后返回原定平台。
try:
    home_point[0] = 0
except [[blank]] as error:
    caught = type(error).__name__
    fly_to(home_point[0], home_point[1])
    climb(0)`, "(caught, home_point)", "caught == TypeError.__name__ and home_point == (home_x, home_y, home_z)"),
    ],
  },
  {
    name: "综合试飞",
    title: "夜间巡检与回收",
    goal: "用本课知识完成整条任务。备用航点进入巡检路线，载荷清单决定扫描圈数，最后按反向航线返回并落地。",
    scenarios: [
      ["河岸 · 双镜头", { route: ["WP-01", "WP-02", "WP-03"], backup: ["WP-04"], heights: [7, 24], cameras: ["Camera", "Camera"] }],
      ["训练场 · 单镜头", { route: ["WP-06", "WP-05"], backup: ["WP-B2"], heights: [6, 16], cameras: ["Camera"] }],
      ["仓库 · 双镜头", { route: ["WP-05", "WP-04", "WP-03"], backup: ["WP-02", "WP-01"], heights: [4, 20], cameras: ["Camera", "Camera"] }],
    ],
    setup: `# 高度记录按低到高排列。原路线的顺序需要保留。
route = @route
backup_stops = @backup
low, high = @heights
payload = @cameras`,
    steps: [
      step("合并巡检航线", "operator", "把备选航点接在原路线末尾，形成新列表。", `# 先飞低空，依次走完合并后的路线。
patrol = route [[blank]] backup_stops
climb(low)
follow(patrol)`, "patrol", "patrol == [*route, *backup_stops]"),
      step("高空扫描与下降", "method", "载荷可能有同名值，这里要取得出现的次数。", `# 每台相机对应半圈扫描，扫描后下降到低空。
camera_count = payload.[[blank]]("Camera")
climb(high)
scan(camera_count / 2)
climb(low)`, "camera_count", "camera_count == len(payload)"),
      step("保留正向清单", "method", "准备一份独立的回程清单，再让它去做反转。", `# 建立副本后，飞到倒数第二站检查返程入口。
return_route = patrol.[[blank]]()
follow([return_route[-2]])`, "(patrol, return_route)", "return_route == patrol and return_route is not patrol"),
      step("逆序返航并落地", "method", "就地颠倒回程清单，再按新的次序逐点飞回。", `# 回到反向清单的末站，然后降落。
return_route.[[blank]]()
follow(return_route)
climb(0)`, "(patrol, return_route)", "return_route == patrol[::-1] and return_route != patrol"),
    ],
  },
];
