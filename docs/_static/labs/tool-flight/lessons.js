// Each step lists its input kind, clue, observed Python value, and result check.
export const lessons = [
  {
    name: "清点设备",
    title: "清点传感器与采样，决定能否起飞",
    goal: "分别统计传感器、采样和航点。只有至少 3 个传感器、5 条采样且航线有航点，才执行巡检。",
    scenarios: [
      ["数据齐全", { sensors: "GPS,IMU,Camera", samples: "21,22,23,24,25", route: "P1,P3" }],
      ["传感器不足", { sensors: "GPS,IMU", samples: "21,22,23,24,25", route: "P1,P3" }],
      ["采样不足", { sensors: "GPS,IMU,Camera", samples: "21,22", route: "P2,P4" }],
    ],
    labels: { sensors: "传感器（逗号分隔）", samples: "高度采样（逗号分隔）", route: "航点 P1～P4（逗号分隔）" },
    steps: {
      sensors: ["builtin", "用内置函数数出列表有多少个元素。", "sensor_count", "核对设备数量", "sensor_count == len(sensors)"],
      samples: ["builtin", "数的是采样条数，先别把数据加起来。", "sample_count", "核对采样数量", "sample_count == len(samples)"],
      route: ["builtin", "检查航点列表有几个位置。", "route_count", "核对航线是否为空", "route_count == len(route)"],
    },
    code: `# 把逗号分隔的文本变成列表，忽略空项。
sensors = [s.strip() for s in params["sensors"].split(",") if s.strip()]
samples = [float(s) for s in params["samples"].split(",") if s.strip()]
route = [p.strip().upper() for p in params["route"].split(",") if p.strip()]
if any(p not in ("P1", "P2", "P3", "P4") for p in route):
    raise ValueError("航点只接受 P1 到 P4")

# 先点数。设备够用就转向检查位，否则悬停。
sensor_count = [[sensors]](sensors)
print("传感器数量：", sensor_count)
flight.append(("spin", 0.25, "right") if sensor_count >= 3 else ("hold", 2, "设备不足"))

# 至少五条采样才能进入校准高度。
sample_count = [[samples]](samples)
print("采样条数：", sample_count)
ready = sensor_count >= 3 and sample_count >= 5
flight.append(("altitude", 18) if ready else ("hold", 2, "尚未满足起飞条件"))

# 最后检查路线里有没有目的地。
route_count = [[route]](route)
print("航点数量：", route_count)
if ready and route_count:
    flight.extend(("move", point) for point in route)
else:
    flight.append(("hold", 2, "没有获准的航线"))`,
  },
  {
    name: "算式阈值",
    title: "读懂预设算式，判断电量是否达标",
    goal: "先把预设算式求值，再比较电量和阈值。选相同电量的两个情境，观察放行与返航。",
    scenarios: [
      ["电量 28 · 阈值方案 A", { battery: "28", profile: "A" }],
      ["电量 28 · 阈值方案 B", { battery: "28", profile: "B" }],
      ["恰好达到阈值", { battery: "30", profile: "A" }],
    ],
    labels: { battery: "电量（0～100）" },
    steps: {
      evaluate: ["fixed", "哪个内置函数能把字符串形式的预设算式求成数值？", "threshold", "计算安全电量阈值", 'threshold == {"A": 30, "B": 24}[params["profile"]]'],
      compare: ["compare", "电量等于门槛时也算达标。选一个比较运算符。", "can_fly", "比较电量与阈值", "can_fly is (battery >= threshold)"],
    },
    code: `# 只从两条固定算式中选择，电量表单不参与求值。
formula = {"A": "20 + 5 * 2", "B": "60 - 12 * 3"}[params["profile"]]
battery = int(params["battery"])
if not 0 <= battery <= 100:
    raise ValueError("电量应在 0 到 100 之间")

# 把可信算式交给 Python，得到可以比较的整数。
threshold = [[evaluate]](formula, {"__builtins__": {}}, {})
print("预设算式：", formula, "阈值：", threshold)

# 电量达到门槛就飞往 P2，否则返航。
can_fly = battery [[compare]] threshold
print("电量：", battery, "是否放行：", can_fly)
if can_fly:
    flight.extend([("altitude", 24), ("move", "P2")])
else:
    flight.append(("return", 12))`,
  },
  {
    name: "对象身份",
    title: "分辨共享路线与独立副本",
    goal: "两份列表看起来一样，身份却可能不同。改原路线的最后一站，观察这架无人机实际会飞向哪里。",
    scenarios: [["共用同一条路线", { linked: "yes" }], ["保留独立副本", { linked: "no" }]],
    steps: {
      first: ["builtin", "找出返回对象身份标识的内置函数。", "original_id", "查看原路线的身份", "original_id == id(original)"],
      second: ["builtin", "用同一个工具检查这架飞机拿到的路线。", "active_id", "查看飞机路线的身份", "active_id == id(active)"],
      identity: ["identity", "比较是否为同一个对象，回想与值比较的区别。", "shared", "核对两条路线是否共享", "shared is (original is active)"],
    },
    code: `# 路线副本最初和原路线有相同内容。
original = ["P1", "P2"]
copy = original.copy()
active = original if params["linked"] == "yes" else copy
print("修改前两条路线的内容相同：", original == active)

# 身份标识只用于本次运行中的比较。
original_id = [[first]](original)
print("原路线标识：", original_id)
active_id = [[second]](active)
print("飞机路线标识：", active_id)

# 改原路线的最后一站，再看飞机手里的路线。
shared = original [[identity]] active
original[-1] = "P3"
print("是否同一对象：", shared, "飞机当前路线：", active)
flight.append(("move", active[-1]))`,
  },
  {
    name: "核对类型",
    title: "检查高度数据的类型，避免拿文字飞行",
    goal: "先查看原始高度的数据类型，再转换并核对。初始数据是文字时，模型会等到数值校验通过。",
    scenarios: [
      ["文字高度", { raw: "26.5", kind: "text" }],
      ["整数高度", { raw: "30", kind: "whole" }],
      ["带小数的高度", { raw: "18.5", kind: "decimal" }],
    ],
    labels: { raw: "高度值（12～60）" },
    steps: {
      raw: ["builtin", "用内置函数看一眼对象的类型标签。", "raw_type", "查看原始高度类型", "raw_type is type(raw)"],
      convert: ["builtin", "高度可能有小数，要保留小数精度。", "height", "把高度转为可计算数值", "type(height) is float and height == float(raw) and 12 <= height <= 60"],
      result: ["builtin", "再查看一次转换后的数据类型。", "result_type", "核对转换结果类型", "result_type is type(height)"],
    },
    code: `# 三个情境模拟设备送来不同类型的高度。
raw = params["raw"]
if params["kind"] == "whole":
    raw = int(raw)
elif params["kind"] == "decimal":
    raw = float(raw)

# 字符串先悬停等待，已有数字可以先做转向校准。
raw_type = [[raw]](raw)
print("原始值：", repr(raw), "类型：", raw_type)
flight.append(("hold", 2, "高度还是文本") if raw_type is str else ("spin", 0.25, "left"))

# 转换成功后，实际数值就是目标高度。
height = [[convert]](raw)
print("目标高度：", height)
flight.append(("altitude", height))

# 最后核对类型，通过后飞往观测点。
result_type = [[result]](height)
print("转换后类型：", result_type)
flight.append(("move", "P1"))`,
  },
  {
    name: "转换指令",
    title: "把文字电量、高度和字符航点变成控制数据",
    goal: "练习整数、小数、字符串、十六进制和字符转换。电量低时保持在原位，最后按安全高度返航。",
    scenarios: [
      ["正常电量 · 北区", { battery: "78", height: "31.5", pilot: "3", station: "C" }],
      ["低电量 · 东区", { battery: "18", height: "22.5", pilot: "7", station: "B" }],
    ],
    labels: { battery: "电量（0～100）", height: "高度（12～60）", pilot: "飞手编号", station: "航点字母 A～D" },
    steps: {
      battery: ["builtin", "先把电量文字转换成十进制整数。", "battery", "计算是否达到安全电量", "type(battery) is int and battery == int(params['battery']) and 0 <= battery <= 100"],
      height: ["builtin", "把高度文字转成能保留小数的数值。", "height", "读出实际高度", "type(height) is float and height == float(params['height']) and 12 <= height <= 60"],
      pilot: ["builtin", "编号拼接前，先把整数变成文字。", "callsign", "生成飞手呼号", "callsign == 'PILOT-' + str(int(params['pilot']))"],
      hex: ["builtin", "把整数显示成以 0x 开头的十六进制文本。", "diagnostic", "生成电量调试码", "diagnostic == hex(battery)"],
      ordinal: ["builtin", "输入一个字符，取出它的 Unicode 码点。", "number", "读取航点字符码点", "number == ord(letter)"],
      char: ["builtin", "反向转换，给码点还原成一个字符。", "recovered", "解码并选择目的地", "recovered == letter"],
    },
    code: `# 这些参数来自表单。先校验字母，防止定位到不存在的航点。
letter = params["station"].strip().upper()
points = {"A": "P1", "B": "P2", "C": "P3", "D": "P4"}
if letter not in points:
    raise ValueError("航点字母应是 A、B、C 或 D")

battery = [[battery]](params["battery"])
ready = battery >= 30
print("电量：", battery)
flight.append(("spin", 0.25, "right") if ready else ("hold", 2, "电量低"))

# 用实际高度下指令，低电量则继续等待。
height = [[height]](params["height"])
print("计划高度：", height)
flight.append(("altitude", height) if ready else ("hold", 2, "等待返航"))

# 下面三步确认呼号、调试码和航点编码。
callsign = "PILOT-" + [[pilot]](int(params["pilot"]))
print("飞手：", callsign)
if not ready:
    flight.append(("hold", 2, "低电量，只记录呼号"))
diagnostic = [[hex]](battery)
print("电量调试码：", diagnostic)
if not ready:
    flight.append(("hold", 2, "低电量，只记录调试码"))
number = [[ordinal]](letter)
print("航点码点：", number)
if not ready:
    flight.append(("hold", 2, "低电量，只记录码点"))

# 解码结果决定目的地；低电量直接返航。
recovered = [[char]](number)
print("解码航点：", recovered)
flight.append(("move", points[recovered]) if ready else ("return", 12))`,
  },
  {
    name: "数学测高",
    title: "从采样计算高度，做一轮升降校准",
    goal: "实际的最大值、最小值和平均值会控制升降。再比较向下、向上取整，最后用平方根恢复水平距离。",
    scenarios: [
      ["开阔区测高", { samples: "18.6,25.4,31.2", error: "-4.5", squared: "144" }],
      ["低空测高", { samples: "9.5,12.2,14.8", error: "2.5", squared: "64" }],
    ],
    labels: { samples: "高度采样（逗号分隔）", error: "校准偏差（±10 m）", squared: "水平距离的平方" },
    steps: {
      abs: ["builtin", "偏差有正有负，取它的大小。", "magnitude", "计算校准偏差", "magnitude == abs(error)"],
      max: ["builtin", "从这组高度中取最大值。", "highest", "按最高采样爬升", "highest == max(samples)"],
      min: ["builtin", "从这组高度中取最小值。", "lowest", "按最低采样下降", "lowest == min(samples)"],
      sum: ["builtin", "把采样相加，再除以条数。", "average", "按平均高度飞行", "abs(average - sum(samples)/len(samples)) < 1e-8"],
      round: ["builtin", "只把简报显示保留一位小数。", "reported", "核对简报的显示精度", "reported == round(average, 1)"],
      floor: ["method", "在 math 模块中找到向下取整的方法。", "down", "向下取整后下降", "down == math.floor(average)"],
      ceil: ["method", "在 math 模块中找到向上取整的方法。", "up", "向上取整后爬升", "up == math.ceil(average)"],
      root: ["method", "已知距离的平方，求回原来的距离。", "distance", "按计算距离向东平移", "distance == math.sqrt(squared)"],
    },
    code: `import math
samples = [float(x) for x in params["samples"].split(",")]
error = float(params["error"])
squared = float(params["squared"])
if not 2 <= len(samples) <= 8 or not all(6 <= x <= 60 for x in samples):
    raise ValueError("请输入 2 到 8 个采样，每个在 6 到 60 米之间")
if not -10 <= error <= 10 or not 1 <= squared <= 400:
    raise ValueError("偏差或平方值超出训练范围")

# 偏差的大小决定从基础高度再抬升多少。
magnitude = [[abs]](error)
flight.append(("altitude", 12 + magnitude))

# 按实际采样的高点、低点和平均高度依次飞。
highest = [[max]](samples)
flight.append(("altitude", highest))
lowest = [[min]](samples)
flight.append(("altitude", lowest))
average = [[sum]](samples) / len(samples)
print("最高、最低、平均：", highest, lowest, average)
flight.append(("altitude", average))

# 简报可以保留小数；整米控制量则比较两个取整方向。
reported = [[round]](average, 1)
print("平均高度简报：", reported)
down = math.[[floor]](average)
flight.append(("altitude", down))
up = math.[[ceil]](average)
flight.append(("altitude", up))

# 求回真实水平距离，作为向东移动的目标坐标。
distance = math.[[root]](squared)
print("水平距离：", distance)
flight.append(("xy", distance, 0))`,
  },
  {
    name: "随机抽检",
    title: "用随机种子抽航点，重排巡检路线",
    goal: "同一种子能重现抽签与路线。改种子后，观察第一个航点、目标高度、自旋和搜索圈数。",
    scenarios: [["固定种子 7", { seed: "7" }], ["固定种子 10", { seed: "10" }]],
    labels: { seed: "随机种子（0～99999）" },
    steps: {
      seed: ["method", "给随机生成器设置起点，让结果可复现。", "seed", "核对随机起点", "seeded_state == reference.getstate()"],
      pick: ["method", "从航点列表中随机选一个。", "picked", "执行抽中的航点", "picked == reference.choice(points)"],
      noise: ["method", "在两个高度之间抽一个浮点数。", "height", "按随机高度升降", "height == reference.uniform(18, 34)"],
      shuffle: ["method", "在原列表上改变顺序。留意它不会返回新列表。", "route", "飞行顺序跟随打乱结果", "reference.shuffle(expected_route) is None and route == expected_route and returned is None"],
      turns: ["method", "从 1 到 3 的整数范围内抽圈数。注意右端不包含。", "turns", "按抽中的圈数自旋", "turns == reference.randrange(1, 4)"],
      search: ["method", "生成一个大于等于 0、小于 1 的小数。", "score", "按抽样结果决定搜索范围", "score == reference.random()"],
    },
    code: `import random
seed = int(params["seed"])
if not 0 <= seed <= 99999:
    raise ValueError("种子范围是 0 到 99999")
points = ["P1", "P2", "P3", "P4"]

# 课堂随机只使用这个独立生成器。
rng = random.Random()
rng.[[seed]](seed)
seeded_state = rng.getstate()
reference = random.Random(seed)
expected_route = points.copy()
print("固定种子：", seed)

# 抽到哪个航点就飞到哪里，再抽一个巡检高度。
picked = rng.[[pick]](points)
print("抽中航点：", picked)
flight.append(("move", picked))
height = rng.[[noise]](18, 34)
flight.append(("altitude", round(height, 2)))

# 先复制原路线，再改变副本的顺序。
route = points.copy()
returned = rng.[[shuffle]](route)
print("巡检顺序：", route)
flight.extend(("move", point) for point in route)

# 用最后两次抽样决定自旋圈数和搜索范围。
turns = rng.[[turns]](1, 4)
flight.append(("spin", turns, "right"))
score = rng.[[search]]()
print("搜索抽样值：", score)
flight.append(("figure8", 1 if score >= 0.5 else 0.5))`,
  },
  {
    name: "三角导航",
    title: "从方向角和距离算出目标坐标",
    goal: "X 向东，Y 向北。先算距离和角度，再用余弦、正弦分解位移，观察模型向哪个象限飞。",
    scenarios: [
      ["东北目标", { dx: "12", dy: "9" }],
      ["西北目标", { dx: "-12", dy: "9" }],
      ["正南目标", { dx: "0", dy: "-14" }],
    ],
    labels: { dx: "东西偏移 X（米）", dy: "南北偏移 Y（米）" },
    steps: {
      hypot: ["method", "给出直角三角形的两条直角边，求斜边。", "distance", "计算水平距离", "abs(distance - math.hypot(dx, dy)) < 1e-8"],
      atan: ["method", "根据 y 和 x 求出带象限的角，参数顺序先 y 后 x。", "angle", "按计算方向试飞 8 米", "abs(angle - math.atan2(dy, dx)) < 1e-8"],
      degrees: ["method", "把弧度转换为人熟悉的角度数。", "degrees", "换成可读的方向角", "abs(degrees - math.degrees(angle)) < 1e-8"],
      radians: ["method", "三角函数使用弧度，先把角度数转回去。", "rad", "换回可计算的弧度", "abs(rad - angle) < 1e-8"],
      cos: ["method", "用三角函数取得水平 X 分量对应的比例。", "east", "按余弦恢复 X 坐标", "abs(east - dx) < 1e-7"],
      sin: ["method", "用三角函数取得 Y 分量对应的比例。", "north", "按正弦恢复完整坐标", "abs(north - dy) < 1e-7"],
    },
    code: `import math
dx = float(params["dx"])
dy = float(params["dy"])
if not (-20 <= dx <= 20 and -20 <= dy <= 20 and (dx or dy)):
    raise ValueError("偏移须在 ±20 米内，且不能同时为零")

# 用水平距离校准起飞高度，底座是 10 米。
distance = math.[[hypot]](dx, dy)
print("水平距离：", distance)
flight.append(("altitude", 10 + distance))

# 保留象限信息。模型先沿计算出的方向试飞 8 米。
angle = math.[[atan]](dy, dx)
flight.append(("bearing", angle))

# 报告显示角度，计算时再用弧度。
degrees = math.[[degrees]](angle)
print("数学方向角（度）：", degrees)
rad = math.[[radians]](degrees)

# 距离乘比例得到分量。先核对 X，再合并 X、Y。
east = distance * math.[[cos]](rad)
flight.append(("xy", round(east, 6), 0))
north = distance * math.[[sin]](rad)
print("最终目标 X、Y：", round(east, 6), round(north, 6))
flight.append(("xy", round(east, 6), round(north, 6)))`,
  },
  {
    name: "综合自检",
    title: "检查数据、抽签、定位，再执行搜索返航",
    goal: "数据合格才执行巡检。短距离任务飞半圈 8 字，水平距离至少 16 米时飞整圈。",
    scenarios: [
      ["短距离巡检", { sensors: "GPS,IMU,Camera", height: "24.5", seed: "7", dx: "8", dy: "6" }],
      ["长距离巡检", { sensors: "GPS,IMU,Camera", height: "30.5", seed: "10", dx: "15", dy: "12" }],
      ["缺少传感器", { sensors: "GPS,IMU", height: "26", seed: "7", dx: "8", dy: "6" }],
    ],
    labels: { sensors: "传感器（逗号分隔）", height: "巡检高度", seed: "随机种子", dx: "目标 X", dy: "目标 Y" },
    steps: {
      count: ["builtin", "统计清单里的传感器数量。", "count", "判断自检是否达标", "count == len(sensors)"],
      height: ["builtin", "高度字符串可能带小数。", "height", "确认高度参数", "type(height) is float and height == float(params['height']) and 12 <= height <= 60"],
      pick: ["method", "用固定种子的生成器从航点中随机抽一个。", "selected", "读取抽中的航点", "selected == random.Random(seed).choice(points)"],
      distance: ["method", "从两条直角边求目标的水平距离。", "distance", "按目标坐标定位", "distance == math.hypot(dx, dy)"],
      angle: ["method", "由 y、x 两个分量获得带象限的方向。", "angle", "复核目标方向", "angle == math.atan2(dy, dx)"],
      summary: ["builtin", "把报告距离显示到一位小数，原始距离仍用于分支。", "shown", "决定搜索范围并返航", "shown == round(distance, 1)"],
    },
    code: `import math
import random
sensors = [s.strip() for s in params["sensors"].split(",") if s.strip()]
seed = int(params["seed"])
dx = float(params["dx"])
dy = float(params["dy"])
if not (-20 <= dx <= 20 and -20 <= dy <= 20 and (dx or dy)):
    raise ValueError("目标偏移须在 ±20 米内，且不能同时为零")
points = ["P1", "P2", "P3", "P4"]

# 自检是后续动作的总开关。
count = [[count]](sensors)
ready = count >= 3
flight.append(("spin", 0.25, "right") if ready else ("hold", 2, "传感器不足"))

# 读高度，再按种子抽巡检起点。
height = [[height]](params["height"])
flight.append(("altitude", height) if ready else ("hold", 2, "未获起飞许可"))
rng = random.Random(seed)
selected = rng.[[pick]](points)
print("巡检起点：", selected)
flight.append(("move", selected) if ready else ("hold", 2, "仅记录抽签结果"))

# 目标坐标和方向由输入计算。
distance = math.[[distance]](dx, dy)
flight.append(("xy", dx, dy) if ready else ("hold", 2, "仅记录目标"))
angle = math.[[angle]](dy, dx)
print("数学方向角（度）：", math.degrees(angle))
if not ready:
    flight.append(("hold", 2, "未获航向执行许可"))
else:
    flight.append(("bearing", angle))

# 先核对报告，再按原始距离选搜索范围并返航。
shown = [[summary]](distance, 1)
print("报告距离：", shown, "m")
if ready:
    flight.extend([("figure8", 1 if distance >= 16 else 0.5), ("return", 14)])
else:
    flight.append(("hold", 2, "自检未通过"))`,
  },
];
