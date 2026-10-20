// 模块三 · 项目二「无人机指令下发器」：参数按真实 Python 调用绑定。
// @event 注释仅供网页观察实际执行；编辑器与导出的 Python 会隐藏这些注释。
// 场景数据只提供编号、方向和航点，不在后台注入飞行动作。

export const lessons = [
  {
    id: '01', shortTitle: '坐标快递', title: '把坐标按顺序交给无人机',
    kicker: '3.2.1 · 位置参数',
    description: '先飞到你填写的坐标，再飞向场景中的第二个目标。交换 x、y 的位置，比较两段航线。',
    objective: '补全两个形参和一次位置参数调用；让实参依次对应 uav_id、x、y。',
    concept: '位置参数从左到右传递。send_move(uav_id, 10, 20) 中，10 交给 x，20 交给 y；交换两个数，目标点也会改变。',
    traceHint: '橙色航迹记录已经飞过的位置，蓝色虚线预览计划航线。第二个目标由场景数据提供，可切换“交换坐标”或“镜像目标”比较。',
    expectedActions: ['move', 'move'],
    blanks: [
      { id: 'p01_x_name', answer: 'x', hint: '无人机编号之后，第一个坐标形参叫什么？', explanation: '第 2 个位置的实参交给 x。' },
      { id: 'p01_y_name', answer: 'y', hint: '第二个坐标形参接收纵向坐标。', explanation: '第 3 个位置的实参交给 y。' },
      { id: 'p01_call', answer: 'send_move', hint: '调用上面定义的移动函数。', explanation: '函数名加括号发起一次调用，实参按定义顺序绑定。' },
      { id: 'p01_x_value', answer: '10', hint: '参考横坐标为 10，可探索 -30～30 米。', explanation: '该实参直接传给 x，改变无人机的横向目标。', numberRange: [-30, 30] },
      { id: 'p01_y_value', answer: '20', hint: '参考纵坐标为 20，可探索 -30～30 米。', explanation: '该实参直接传给 y，改变无人机的纵向目标。', numberRange: [-30, 30] },
    ],
    code: `# 教材迁移：位置参数决定目标坐标，单位为米
def send_move(uav_id, {{p01_x_name}}, {{p01_y_name}}):
    action = "move"
    print("[MOVE]", uav_id, "x =", x, "y =", y)
    # @event command

{{p01_call}}(uav_id, {{p01_x_value}}, {{p01_y_value}})
send_move(uav_id, target_x, target_y)`,
    scenarios: [
      { id: 'swapped', label: '交换坐标', description: '第二次调用传入 (20, 10)。与参考第一次的 (10, 20) 比较位置顺序。', prelude: 'uav_id = "UAV-07"\ntarget_x = 20\ntarget_y = 10' },
      { id: 'mirror', label: '镜像目标', description: '同一个函数第二次接收 (-20, -10)，无人机飞向另一侧目标。', prelude: 'uav_id = "UAV-07"\ntarget_x = -20\ntarget_y = -10' },
    ], defaultScenario: 'swapped',
  },
  {
    id: '02', shortTitle: '高低穿梭', title: '飞到指定高度，再下降到下一层',
    kicker: '3.2.1 · 位置参数的顺序',
    description: '两次调用同一个函数：先升高，再下降。高度和速度都有数值，但位置不同，含义就不同。',
    objective: '按 uav_id、height、speed 的顺序传值，让两次调用分别收到不同的高度。',
    concept: '形参名说明数据的含义，调用位置决定实参交给谁。这里 height 是绝对目标高度，speed 是升降速度，而不是“再上升多少米”。',
    traceHint: '观察高度仪到达你填写的两个绝对高度。把第一处调低、第二处调高，也能把动作顺序改成先降后升。',
    expectedActions: ['altitude', 'altitude'],
    blanks: [
      { id: 'p02_height', answer: 'height', hint: '接收目标高度的形参名。', explanation: '第二个实参交给 height，单位为米。' },
      { id: 'p02_speed', answer: 'speed', hint: '接收升降速度的形参名。', explanation: '第三个实参交给 speed，单位为米/秒。' },
      { id: 'p02_call', answer: 'set_height', hint: '第一次调用刚定义的高度函数。', explanation: '两次调用共用同一个定义，各自绑定本次传入的数据。' },
      { id: 'p02_high', answer: '40', hint: '参考先升到 40 米，可填 2～60。', explanation: '无人机飞到这个绝对高度，允许自行设计高低顺序。', numberRange: [2, 60] },
      { id: 'p02_low', answer: '12', hint: '参考再降到 12 米，可填 2～60。', explanation: '第二次调用重新把这个数值传给 height。', numberRange: [2, 60] },
    ],
    code: `# 位置顺序：无人机编号、目标高度、升降速度
def set_height(uav_id, {{p02_height}}, {{p02_speed}}):
    action = "altitude"
    print("[HEIGHT]", uav_id, "到", height, "m，速度", speed, "m/s")
    # @event command

{{p02_call}}(uav_id, {{p02_high}}, vertical_speed)
set_height(uav_id, {{p02_low}}, vertical_speed)`,
    scenarios: [
      { id: 'steady', label: '平稳升降 · 4 m/s', description: '两次调用都把 vertical_speed 的值 4 传给 speed。', prelude: 'uav_id = "UAV-07"\nvertical_speed = 4' },
      { id: 'slow', label: '慢速观察 · 2 m/s', description: '仍是相同高度，速度实参改为 2，观察动作持续时间的变化。', prelude: 'uav_id = "UAV-07"\nvertical_speed = 2' },
    ], defaultScenario: 'steady',
  },
  {
    id: '03', shortTitle: '旋转舞台', title: '调换关键字顺序，仍然准确自旋',
    kicker: '3.2.2 · 关键字参数',
    description: '把 speed 写在前面，turns 和 direction 写在后面。按名字传值，让无人机原地自旋指定圈数。',
    objective: '使用 形参名=值 的调用形式，辨认圈数、方向、角速度三个参数。',
    concept: '关键字实参通过名称绑定，不靠书写先后。函数头是 turns、direction、speed，调用却可以写成 speed=...、turns=...、direction=...。',
    traceHint: 'yaw 会连续累积，360° 的整圈也能看见真实旋转。切换左旋、右旋，或把圈数改为 0.5、1、2。',
    expectedActions: ['spin'],
    blanks: [
      { id: 'p03_turns_name', answer: 'turns', hint: '接收自旋圈数的形参。', explanation: 'turns 决定总转角：圈数乘以 360°。' },
      { id: 'p03_speed_kw', answer: 'speed', hint: '90 是角速度，应写哪个形参名？', explanation: 'speed=90 明确把 90 绑定给 speed，不受位置变化影响。' },
      { id: 'p03_turns_kw', answer: 'turns', hint: '圈数实参前面写它对应的形参名。', explanation: 'turns=... 按名称传递圈数。' },
      { id: 'p03_turns_value', answer: '1', hint: '参考旋转 1 圈，可填 0.25～3 圈。', explanation: '小数圈数也有效；0.5 是半圈，2 是两圈。', numberRange: [0.25, 3] },
      { id: 'p03_direction_kw', answer: 'direction', hint: 'left / right 应交给哪个形参？', explanation: 'direction 接收当前场景的方向字符串。' },
    ],
    code: `# 定义顺序与关键字调用顺序可以不同
def spin(uav_id, {{p03_turns_name}}, direction, speed):
    action = "spin"
    print("[SPIN]", uav_id, turns, "圈", direction, speed, "度/秒")
    # @event command

spin(uav_id, {{p03_speed_kw}}=90,
     {{p03_turns_kw}}={{p03_turns_value}}, {{p03_direction_kw}}=spin_direction)`,
    scenarios: [
      { id: 'right', label: '右旋', description: 'direction="right"；按俯视方向向右旋转。', prelude: 'uav_id = "UAV-07"\nspin_direction = "right"' },
      { id: 'left', label: '左旋', description: 'direction="left"；同样的圈数和速度，旋转方向相反。', prelude: 'uav_id = "UAV-07"\nspin_direction = "left"' },
    ], defaultScenario: 'right',
  },
  {
    id: '04', shortTitle: '命名返航', title: '把自然语言指令变成关键字调用',
    kicker: '3.2.2 · 教材 set_rth()',
    description: '任务：“UAV-07 以 6 m/s、80 米高度返航。”先飞出一段距离，再按名称下发返航参数。',
    objective: '在教材 set_rth() 的基础上，补全 altitude_m 与 speed_mps 的关键字调用。',
    concept: 'speed_mps 写在 altitude_m 前面也不会弄混。教材中的函数打印返航设置；本实验把实际收到的设置用于模拟返航：调整高度、返回原点、降落。',
    traceHint: '先移动到 (24, 16)，再飞到指定返航高度，返回起降点并降落。改变高度或速度，比较返航路径和时间。',
    expectedActions: ['move', 'return'],
    blanks: [
      { id: 'p04_altitude_name', answer: 'altitude_m', hint: '教材中接收返航高度的形参名。', explanation: 'altitude_m 的默认值是 30.0；这里会由关键字实参覆盖。' },
      { id: 'p04_speed_kw', answer: 'speed_mps', hint: '给返航速度写明对应的形参名。', explanation: 'speed_mps=6 表示本次返航使用 6 米/秒。' },
      { id: 'p04_speed_value', answer: '6', hint: '参考速度 6 m/s，可探索 1～12。', explanation: '实际 speed_mps 决定模拟返航的移动速度。', numberRange: [1, 12] },
      { id: 'p04_altitude_kw', answer: 'altitude_m', hint: '给返航高度写明对应的形参名。', explanation: 'altitude_m=80 明确设置目标返航高度。' },
      { id: 'p04_altitude_value', answer: '80', hint: '参考返航高度 80 米，可探索 10～80。', explanation: '无人机先调整到这个绝对高度，再飞回原点降落。', numberRange: [10, 80] },
    ],
    code: `# 教材函数：按名称设置返航高度与速度
def send_move(uav_id, x, y):
    action = "move"
    print("[MOVE]", uav_id, x, y)
    # @event command

def set_rth(uav_id, {{p04_altitude_name}}=30.0, speed_mps=8.0):
    action = "return"
    height = altitude_m
    speed = speed_mps
    print("[RTH]", uav_id, "高度", altitude_m, "速度", speed_mps)
    # @event command

send_move(uav_id, 24, 16)
set_rth(uav_id, {{p04_speed_kw}}={{p04_speed_value}},
        {{p04_altitude_kw}}={{p04_altitude_value}})`,
    scenarios: [
      { id: 'rth', label: 'UAV-07 返航任务', description: '把“80 米高度、6 m/s 速度”写进调用；数值探索空也允许设计自己的返航方案。', prelude: 'uav_id = "UAV-07"' },
    ], defaultScenario: 'rth',
  },
  {
    id: '05', shortTitle: '默认巡航', title: '省略参数和覆盖默认值，有什么不同？',
    kicker: '3.2.3 · 默认参数',
    description: '第一次只传无人机编号，第二次明确填写高度和速度。看两次函数体实际接收到什么。',
    objective: '在定义中设置默认值，在调用中省略或覆盖参数，比较最终绑定表。',
    concept: '默认值写在函数定义中。调用时没有传 height、speed，使用定义中的值；显式传入后，只对本次调用使用新值。',
    traceHint: '第一次飞到默认高度，第二次飞到你指定的高度。修改默认高度，只会改变没有传 height 的那一次调用。',
    expectedActions: ['altitude', 'altitude'],
    blanks: [
      { id: 'p05_default_height', answer: '30', hint: '参考默认高度 30 米，可填 5～60。', explanation: '第一次调用省略 height，所以会采用这里的定义值。', numberRange: [5, 60] },
      { id: 'p05_default_speed', answer: '4', hint: '参考默认速度 4 m/s，可填 1～10。', explanation: '没有传 speed 时，Python 使用这个默认值。', numberRange: [1, 10] },
      { id: 'p05_call', answer: 'set_height', hint: '只传编号，调用上面的高度函数。', explanation: '其余参数省略，height、speed 都从函数默认值获得。' },
      { id: 'p05_override_height', answer: '12', hint: '第二次指定 12 米，可填 2～60。', explanation: '本次显式传入 height，覆盖函数定义中的默认高度。', numberRange: [2, 60] },
      { id: 'p05_override_speed', answer: '2', hint: '第二次指定速度 2 m/s，可填 1～10。', explanation: '这个实参只覆盖第二次调用的 speed。', numberRange: [1, 10] },
    ],
    code: `# 默认值属于函数定义，显式实参用于本次调用
def set_height(uav_id, height={{p05_default_height}}, speed={{p05_default_speed}}):
    action = "altitude"
    print("[HEIGHT]", uav_id, "height =", height, "speed =", speed)
    # @event command

# 没传 height 和 speed：使用默认值
{{p05_call}}(uav_id)
# 这一次按名称覆盖默认值
set_height(uav_id, height={{p05_override_height}}, speed={{p05_override_speed}})`,
    scenarios: [
      { id: 'defaults', label: '默认值与覆盖值对照', description: '第一条动作的参数来自定义；第二条来自明确写出的关键字实参。', prelude: 'uav_id = "UAV-07"' },
    ], defaultScenario: 'defaults',
  },
  {
    id: '06', shortTitle: '8 字画家', title: '一整圈 8 字，还是半圈单瓣？',
    kicker: '3.2.3 · 默认参数与关键字覆盖',
    description: '让 fly_eight() 默认画一个完整的 8 字，再给第二次调用传入 loops=0.5，观察半圈的不同路径。',
    objective: '补全默认参数语法与关键字覆盖，使用圈数和尺度设计自己的 8 字航线。',
    concept: 'loops=1 表示默认飞完两瓣的完整 8 字；调用时 loops=0.5 覆盖它，只飞一瓣后回到交叉点。scale 控制航线大小。',
    traceHint: '每次从当前位置的交叉点出发。第一条动作飞完整 8 字；第二条按填写的 loops 飞行，0.5 为半圈、1 为一整圈。',
    expectedActions: ['figure8', 'figure8'],
    blanks: [
      { id: 'p06_loops_name', answer: 'loops', hint: '接收 8 字圈数的形参名。', explanation: 'loops 是圈数；默认 1，代表完整的两瓣。' },
      { id: 'p06_equal', answer: '=', hint: '定义默认参数时，名字和值之间用哪个符号？', explanation: '形参名=默认值，例如 loops=1。' },
      { id: 'p06_scale', answer: '16', hint: '参考航线尺度 16 米，可填 8～24。', explanation: 'scale 是 8 字的横向半宽，改变它会改变航迹大小。', numberRange: [8, 24] },
      { id: 'p06_call', answer: 'fly_eight', hint: '第一次调用时省略可选参数。', explanation: '省略 loops、scale、speed，使用函数定义中的默认值。' },
      { id: 'p06_loops_kw', answer: 'loops', hint: '第二次调用要覆盖圈数，应写哪个参数名？', explanation: '用 loops=... 指定本次飞行的圈数。' },
      { id: 'p06_half', answer: '0.5', hint: '半圈填 0.5，也可探索 0.5～2 圈。', explanation: '0.5 飞一瓣；1 飞两瓣；更大的数值会继续沿 8 字飞行。', numberRange: [0.5, 2] },
    ],
    code: `# loops 是圈数；scale 是横向半宽；speed 是飞行速度
def fly_eight(uav_id, {{p06_loops_name}}{{p06_equal}}1, scale={{p06_scale}}, speed=6):
    action = "figure8"
    print("[EIGHT]", uav_id, "圈数", loops, "尺度", scale)
    # @event command

{{p06_call}}(uav_id)
fly_eight(uav_id, {{p06_loops_kw}}={{p06_half}})`,
    scenarios: [
      { id: 'eight', label: '整圈 → 半圈', description: '默认第一条完整画出 8 字；第二条参考值只飞一瓣。两次调用共用默认尺度和速度。', prelude: 'uav_id = "UAV-07"' },
    ], defaultScenario: 'eight',
  },
  {
    id: '07', shortTitle: '航点接力', title: '一个航点、三个航点，都用同一个函数',
    kicker: '3.2.4 · *args 收集位置实参',
    description: '先发一个航点，再发三个航点。观察 points 的类型和内容，以及无人机逐点飞行的顺序。',
    objective: '使用 *points 接收不定数量的位置实参，认识 Python 把这些数据打包成元组。',
    concept: '*points 写在形参位置，收集 uav_id 之后多余的位置实参。传一个点得到含一个元素的元组，传三个点就得到含三个元素的元组。',
    traceHint: '第一条路线只有 p1；第二条依次经过 p1、p2、p3。切换三角形或折线场景，比较相同函数的复用。',
    expectedActions: ['route', 'route'],
    blanks: [
      { id: 'p07_star', answer: '*', hint: '接收多余位置实参时，参数名前放几个星号？', explanation: '一个星号 * 把多余的位置实参收集成 tuple。' },
      { id: 'p07_len', answer: 'len', hint: '输出收到多少个航点，用哪个内置函数？', explanation: 'len(points) 返回元组中的元素数量。' },
      { id: 'p07_call', answer: 'batch_upload_waypoints', hint: '第一次只上传 p1，也调用同一个函数。', explanation: '*points 允许不同数量的位置实参，所以只传一个航点也可以。' },
      { id: 'p07_second', answer: 'p2', hint: '第二次调用的第二个航点变量。', explanation: 'p2 成为 points 元组中的第二个坐标点。' },
      { id: 'p07_third', answer: 'p3', hint: '第二次调用的第三个航点变量。', explanation: 'p3 成为 points 元组中的第三个坐标点。' },
    ],
    code: `# 教材函数：航点数量不固定
def batch_upload_waypoints(uav_id, {{p07_star}}points):
    action = "route"
    print("[WPTS]", uav_id, "数量", {{p07_len}}(points))
    print("打包类型：", type(points), "内容：", points)
    for pt in points:
        print("waypoint:", pt)
    # @event command

{{p07_call}}(uav_id, p1)
batch_upload_waypoints(uav_id, p1, {{p07_second}}, {{p07_third}})`,
    scenarios: [
      { id: 'triangle', label: '三角航线', description: 'p1=(-20,-12)，p2=(20,-12)，p3=(0,20)。路线按实际参数顺序连接。', prelude: 'uav_id = "UAV-07"\np1 = (-20, -12)\np2 = (20, -12)\np3 = (0, 20)' },
      { id: 'zigzag', label: '折线巡检', description: '换一组三个元组坐标，函数与调用方式不变，实际飞行路径随数据改变。', prelude: 'uav_id = "UAV-07"\np1 = (-24, 15)\np2 = (0, -15)\np3 = (24, 15)' },
    ], defaultScenario: 'triangle',
  },
  {
    id: '08', shortTitle: '空中阶梯', title: '*args 还能打包一串高度',
    kicker: '3.2.4 · *args 与逐项处理',
    description: '把三个高度交给同一个函数，在函数内逐个处理。无人机按元组中的顺序完成高低穿梭。',
    objective: '把多个高度位置实参收集成 heights 元组，用已有的 for 循环逐项读取。',
    concept: '*args 中的名字可以自定，*heights 与 *points 使用相同语法。这里每个元素是一个高度数值，循环中逐个绑定给 height。',
    traceHint: '观察 heights 整包数据，以及每一条动作当前拿到的 height。把两个探索值调换，动作顺序会随实参顺序改变。',
    expectedActions: ['altitude', 'altitude', 'altitude'],
    blanks: [
      { id: 'p08_star', answer: '*', hint: '把额外位置实参打包为元组，需要哪个符号？', explanation: '*heights 把传来的多个高度收集到同一个元组。' },
      { id: 'p08_pack', answer: 'heights', hint: '循环要遍历哪一个打包后的元组？', explanation: 'for height in heights 逐个读取传入的高度。' },
      { id: 'p08_call', answer: 'fly_levels', hint: '调用刚定义的多高度函数。', explanation: '这里在编号后面连续传入三个位置实参。' },
      { id: 'p08_high', answer: '45', hint: '参考中间一层为 45 米，可填 2～60。', explanation: '这是 heights 中的第二个元素，对应第二条升降动作。', numberRange: [2, 60] },
      { id: 'p08_low', answer: '8', hint: '参考最后一层为 8 米，可填 2～60。', explanation: '这是 heights 中的第三个元素，决定最后停留高度。', numberRange: [2, 60] },
    ],
    code: `# 星号收集的是额外位置实参，名字可以叫 heights
def fly_levels(uav_id, {{p08_star}}heights):
    action = "altitude"
    speed = 4
    print("高度包：", type(heights), heights)
    for height in {{p08_pack}}:
        print("[LEVEL]", uav_id, "到", height, "m")
        # @event command

{{p08_call}}(uav_id, first_height, {{p08_high}}, {{p08_low}})`,
    scenarios: [
      { id: 'low-first', label: '低层出发 · 12 m', description: '三个实参依次为 12、你填写的中间高度、最后高度。', prelude: 'uav_id = "UAV-07"\nfirst_height = 12' },
      { id: 'high-first', label: '高层出发 · 50 m', description: '只改变第一个实参为 50；仍会按传入顺序处理全部三层。', prelude: 'uav_id = "UAV-07"\nfirst_height = 50' },
    ], defaultScenario: 'low-first',
  },
  {
    id: '09', shortTitle: '灯光调参', title: '用 **kwargs 送来一张配置表',
    kicker: '3.2.4 · **kwargs 收集关键字实参',
    description: '一次设置速度、高度、灯光和航迹，再飞一段折线。修改字典里的配置效果，比较亮灯、留痕与飞行速度。',
    objective: '用 **params 接收不定数量的关键字实参，观察它们被打包成字典。',
    concept: '**params 收集 uav_id 之后额外的 key=value，得到 dict。speed、height、led、trail 都成为字符串键，对应的实参成为值。',
    traceHint: '先应用实际收到的配置字典，再移动。led=True/False 改变机身灯，trail=True/False 控制此后的飞行留痕。',
    expectedActions: ['configure', 'move', 'move'],
    blanks: [
      { id: 'p09_stars', answer: '**', hint: '接收额外关键字实参，参数名前要几个星号？', explanation: '两个星号 ** 把多余的关键字实参收集为字典。' },
      { id: 'p09_call', answer: 'set_params', hint: '调用教材中的配置函数。', explanation: '这次传入四对关键字实参，都会进入 params 字典。' },
      { id: 'p09_height_kw', answer: 'height', hint: '想设置飞行高度，应使用哪个配置键？', explanation: '关键字 height 进入 params 后成为字符串键 "height"。' },
      { id: 'p09_height_value', answer: '24', hint: '参考高度 24 米，可探索 5～60。', explanation: '配置动作把无人机平稳调整到这个高度。', numberRange: [5, 60] },
      { id: 'p09_speed', answer: '6', hint: '参考飞行速度 6 m/s，可探索 1～12。', explanation: '后面没有单独写 speed 的移动动作采用这个配置速度。', numberRange: [1, 12] },
      { id: 'p09_led', answer: 'True', accepted: ['False'], hint: '灯光使用 Python 布尔值 True 或 False。', explanation: 'True 点亮机身灯，False 关闭机身灯；两种布尔值都可以探索。' },
      { id: 'p09_trail', answer: 'True', accepted: ['False'], hint: '航迹留痕使用 True 或 False。', explanation: 'True 显示之后的飞行轨迹，False 停止绘制之后的轨迹。' },
    ],
    code: `# 教材函数：params 是一个字典
def set_params(uav_id, {{p09_stars}}params):
    action = "configure"
    print("[PARM]", uav_id, type(params), params)
    for k in params:
        print(k, "=", params[k])
    # @event command

def send_move(uav_id, x, y):
    action = "move"
    print("[MOVE]", uav_id, x, y)
    # @event command

{{p09_call}}(uav_id, {{p09_height_kw}}={{p09_height_value}}, speed={{p09_speed}},
           led={{p09_led}}, trail={{p09_trail}})
send_move(uav_id, -20, 14)
send_move(uav_id, 20, 14)`,
    scenarios: [
      { id: 'light', label: '灯光与轨迹实验', description: '两种布尔值都有效。分别试试关闭灯光、关闭轨迹，再改变速度和高度。', prelude: 'uav_id = "UAV-07"' },
    ], defaultScenario: 'light',
  },
  {
    id: '10', shortTitle: '巡航空中秀', title: '设计一场自己的巡航空中秀',
    kicker: '3.2 综合任务 · 位置 / 关键字 / 默认 / *args / **kwargs',
    description: '给无人机配置高度和灯光，依次经过航点，在终点绕圆一圈，再返航降落。把几类参数组合成一份完整指令单。',
    objective: '在同一段真实 Python 中，正确使用普通参数、关键字参数、默认参数、*points 和 **params。',
    concept: '普通形参 uav_id 接收编号；*points 把额外位置实参打包成元组；**params 把额外关键字实参打包成字典；orbit 的默认值可被本次调用覆盖。',
    traceHint: '航点按元组顺序连接；绕圆动作从当前点开始并回到起点；最后调整返航高度、返回原点、降落。可修改半径和圈数编排空中秀。',
    expectedActions: ['configure', 'route', 'orbit', 'return'],
    blanks: [
      { id: 'p10_kwargs', answer: '**', hint: '配置函数需要打包额外的关键字实参。', explanation: '**params 收集关键字实参，得到 dict。' },
      { id: 'p10_args', answer: '*', hint: '航点函数需要打包额外的位置实参。', explanation: '*points 收集位置实参，得到 tuple。' },
      { id: 'p10_default', answer: '=', hint: '为 radius 指定默认值 8 的符号。', explanation: 'radius=8 是默认参数；调用时也可以明确覆盖。' },
      { id: 'p10_config', answer: 'set_params', hint: '先调用配置函数，传入四对关键字实参。', explanation: '这些设置会先被收集为字典，再用于模拟配置。' },
      { id: 'p10_point', answer: 'p2', hint: '在 p1 后面传入第二个航点。', explanation: '位置顺序决定 route 的访问顺序。' },
      { id: 'p10_radius_kw', answer: 'radius', hint: '给绕圆半径指定关键字名称。', explanation: 'radius=... 覆盖函数定义中的默认半径。' },
      { id: 'p10_radius', answer: '10', hint: '参考绕圆半径 10 米，可探索 4～16。', explanation: '半径越大，绕圆航线越大，飞行距离也更长。', numberRange: [4, 16] },
      { id: 'p10_laps', answer: '1', hint: '参考绕圆 1 圈，可探索 0.5～2。', explanation: 'laps 决定实际绕圆圈数；半圈结束位置与整圈不同。', numberRange: [0.5, 2] },
      { id: 'p10_return_height', answer: '30', hint: '参考返航高度 30 米，可探索 10～60。', explanation: '最后以这个高度飞回起降点，再降落到 0 米。', numberRange: [10, 60] },
    ],
    code: `# 一份完整指令单：先配置，再巡航、绕圆、返航
def set_params(uav_id, {{p10_kwargs}}params):
    action = "configure"
    print("[PARM]", uav_id, params)
    # @event command

def batch_upload_waypoints(uav_id, {{p10_args}}points):
    action = "route"
    print("[WPTS]", uav_id, type(points), points)
    # @event command

def orbit(uav_id, radius{{p10_default}}8, laps=1, direction="right", speed=6):
    action = "orbit"
    print("[ORBIT]", uav_id, "半径", radius, "圈数", laps)
    # @event command

def set_rth(uav_id, altitude_m=30, speed_mps=8):
    action = "return"
    height = altitude_m
    speed = speed_mps
    print("[RTH]", uav_id, altitude_m, speed_mps)
    # @event command

{{p10_config}}(uav_id, height=24, speed=6, led=True, trail=True)
batch_upload_waypoints(uav_id, p1, {{p10_point}}, p3)
orbit(uav_id, {{p10_radius_kw}}={{p10_radius}}, laps={{p10_laps}}, direction=orbit_direction)
set_rth(uav_id, altitude_m={{p10_return_height}})`,
    scenarios: [
      { id: 'show-right', label: '右绕圆 · 三点巡航', description: '经过 (-18,-12)、(0,16)、(18,-6)，然后右绕圆，最后返航。', prelude: 'uav_id = "UAV-07"\np1 = (-18, -12)\np2 = (0, 16)\np3 = (18, -6)\norbit_direction = "right"' },
      { id: 'show-left', label: '左绕圆 · 镜像巡航', description: '改为镜像航点与左绕圆。同一份函数定义，接收新数据后形成另一场空中秀。', prelude: 'uav_id = "UAV-07"\np1 = (18, -12)\np2 = (0, 16)\np3 = (-18, -6)\norbit_direction = "left"' },
    ], defaultScenario: 'show-right',
  },
];
