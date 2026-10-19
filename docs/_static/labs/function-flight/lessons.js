// 课程依据：模块三，3.1 项目一「无人机任务工具箱」。
// 观察点只记录实际执行；界面隐藏这些注释，导出时删除。
// 第 9 关是普通参数与元组返回值的课内迁移，不引入后续项目内容。

export const lessons = [
  {
    id: "01",
    title: "定义好了，为什么还没有执行？",
    shortTitle: "定义与调用",
    kicker: "3.1.1 · 函数的定义",
    description: "补全教材中的起飞通知练习。在“只定义”和“定义后调用”之间切换，观察执行路径与控制台。",
    objective: "认识 def、冒号、缩进和函数名(...)；分清创建函数与执行函数体。",
    concept: "运行到 def 时只创建函数。只有执行调用语句，函数体里的 print 才运行；打印起飞通知并不等于允许起飞。",
    traceHint: "只定义时无人机静止；调用时通知灯响应，但飞机仍在地面等待真正的起飞判定。",
    blanks: [
      { id: "l01_def", answer: "def", hint: "声明函数使用哪个关键字？", explanation: "def 创建一个函数，后面写函数名和参数列表。" },
      { id: "l01_colon", answer: ":", hint: "函数头末尾需要一个半角标点。", explanation: "冒号表示函数体开始；函数体还必须缩进。" },
      { id: "l01_print", answer: "print", hint: "把通知文字输出到控制台。", explanation: "print 在函数体中，调用发生时才会执行。" },
      { id: "l01_call", answer: "print_takeoff_notice", hint: "调用刚刚定义的函数，名称必须一致。", explanation: "函数名加括号及实参，才是一次函数调用。" },
    ],
    code: `# 教材练习：封装一条起飞检查通知
{{l01_def}} print_takeoff_notice(uav_id){{l01_colon}}
    # 函数体缩进 4 个空格
    # @event enter
    {{l01_print}}(uav_id, "起飞检查开始")
    # @event notice

# @event define
if run_call:
    # @event call
    {{l01_call}}("UAV-07")
# @event finish`,
    scenarios: [
      { id: "define", label: "只定义", description: "跳过调用。观察函数体没有输出，也没有通知事件。", prelude: "run_call = False" },
      { id: "call", label: "定义后调用", description: "执行一次调用，函数体这时才运行。", prelude: "run_call = True" },
    ],
    defaultScenario: "call",
  },
  {
    id: "02",
    title: "把三份数据交给任务抬头函数",
    shortTitle: "形参与实参",
    kicker: "3.1.1 → 3.1.2 · 定义后调用",
    description: "用 print_header() 封装重复的抬头输出。调用时的三个实参，按顺序交给函数头中的三个形参。",
    objective: "补全形参、函数体取值和普通调用，理解一次调用的数据传递。",
    concept: "形参写在定义里，实参写在调用里。这里的 print_header 只负责打印任务信息，没有控制飞行的返回值。",
    traceHint: "先创建函数，再调用进入函数体。更换任务数据会改变抬头，模型保持地面待命。",
    blanks: [
      { id: "l02_mission", answer: "mission_id", hint: "第一个形参接收任务编号。", explanation: "调用时的第一个实参交给 mission_id。" },
      { id: "l02_pilot", answer: "pilot", hint: "第三个形参接收飞手姓名。", explanation: "第三个位置的实参交给 pilot。" },
      { id: "l02_uav", answer: "uav_id", hint: "这里应打印无人机编号这个形参。", explanation: "函数体读取本次调用收到的 uav_id。" },
      { id: "l02_call", answer: "print_header", hint: "调用前面定义的抬头函数。", explanation: "名称和括号组成调用，函数体随后执行。" },
      { id: "l02_arg", answer: "pilot", hint: "第三个实参应传入已准备好的飞手变量。", explanation: "pilot 的值传给函数定义里的第三个形参。" },
    ],
    code: `# 教材示例：抬头函数只负责打印
def print_header({{l02_mission}}, uav_id, {{l02_pilot}}):
    # @event enter
    print("任务编号：", mission_id)
    print("无人机：", {{l02_uav}})
    print("飞手：", pilot)
    # @event notice

# @event define
# @event call
{{l02_call}}(mission_id, uav_id, {{l02_arg}})
# @event finish`,
    scenarios: [
      { id: "a01", label: "A01 巡检任务", description: "传入教材原始任务编号和飞手信息。", prelude: 'mission_id = "MIS-20251223-A01"\nuav_id = "UAV-07"\npilot = "Li Ming"' },
      { id: "b02", label: "B02 训练任务", description: "同一个函数，换一组实参即可复用。", prelude: 'mission_id = "MIS-20261019-B02"\nuav_id = "UAV-02"\npilot = "Wang Lin"' },
    ],
    defaultScenario: "a01",
  },
  {
    id: "03",
    title: "定义一次，给两架无人机重复调用",
    shortTitle: "重复调用",
    kicker: "3.1.2 · 函数调用练习",
    description: "完成教材要求的两次 show_status() 调用。也可以修改两个电量数字，观察每次调用收到的数据。",
    objective: "把不同实参交给同一个函数，观察每次函数体都重新执行。",
    concept: "两次调用使用同一份函数定义，但各自接收不同数据。show_status 仅打印状态，电量高也不会自动触发起飞。",
    traceHint: "观察两次进入函数体、两次状态输出，以及 UAV-01 / UAV-02 的电量变化。模型保持在地面。",
    blanks: [
      { id: "l03_battery", answer: "battery_percent", hint: "打印本次调用收到的电量形参。", explanation: "第一次收到 90，第二次收到 25；两个调用互相独立。" },
      { id: "l03_call", answer: "show_status", hint: "第一次调用状态函数。", explanation: "一次定义可以被多次调用。" },
      { id: "l03_90", answer: "90", hint: "教材第一次传入 90；可尝试 0～100 的数值。", explanation: "这是第一个调用的实际电量值；它会传给 battery_percent。", numberRange: [0, 100] },
      { id: "l03_uav", answer: '"UAV-02"', accepted: ["'UAV-02'"], hint: "第二次调用的无人机编号，记得加引号。", explanation: "字符串实参需要引号；该值传给 uav_id。" },
      { id: "l03_25", answer: "25", hint: "教材第二次传入 25；可尝试 0～100 的数值。", explanation: "第二次调用把这份数据交给同一个函数体。", numberRange: [0, 100] },
    ],
    code: `# 教材练习：同一个函数调用两次
def show_status(uav_id, battery_percent):
    # @event enter
    print(uav_id, "当前电量：", {{l03_battery}}, "%")
    # @event status

# @event define
# @event call
{{l03_call}}("UAV-01", {{l03_90}})
# @event call
show_status({{l03_uav}}, {{l03_25}})
# @event finish`,
    scenarios: [
      { id: "twice", label: "两次调用", description: "同一份函数定义，依次显示两架无人机的编号和电量。", prelude: "" },
    ],
    defaultScenario: "twice",
  },
  {
    id: "04",
    title: "起飞检查：return 会立即结束函数",
    shortTitle: "布尔与早返回",
    kicker: "3.1.2 · can_takeoff()",
    description: "补全教材的三个起飞检查。切换四种状态与边界值，找到函数在哪一个 return 处结束。",
    objective: "用返回的 True / False 表达判定；观察前一个条件失败后，后面的检查不再执行。",
    concept: "电量至少 30%、GPS 卫星至少 6 颗且已解锁才返回 True。任何失败条件都会 return False，立即交回调用位置。",
    traceHint: "只有 result 为 True，主流程才进入 takeoff 路径；False 保持在地面并显示失败条件。",
    blanks: [
      { id: "l04_def", answer: "def", hint: "声明起飞判定函数。", explanation: "def 定义函数，本身不会运行检查。" },
      { id: "l04_lt", answer: "<", hint: "电量低于 30 时拒绝。", explanation: "30 是允许的边界，因此失败条件是小于 30。" },
      { id: "l04_return", answer: "return", hint: "把结果交给调用者，并立即结束函数。", explanation: "return 后本次函数调用结束，后续语句不再执行。" },
      { id: "l04_false_bat", answer: "False", hint: "电量不足时应返回哪个布尔值？", explanation: "False 表示检查不通过。注意首字母大写。" },
      { id: "l04_not", answer: "not", hint: "解锁状态为 False 时，需要把它取反。", explanation: "not is_armed 在尚未解锁时为 True。" },
      { id: "l04_false_arm", answer: "False", hint: "没有解锁，应拒绝起飞。", explanation: "这条 return 让函数以 False 结束。" },
      { id: "l04_true", answer: "True", hint: "前面的失败条件都未触发，返回通过。", explanation: "True 表示全部条件通过，主流程可根据它决定下一步。" },
    ],
    code: `# 教材原始检查顺序：电量 → GPS → 解锁
{{l04_def}} can_takeoff(battery_percent, gps_satellites, is_armed):
    # @event enter
    if battery_percent {{l04_lt}} 30:
        # @event blocked
        # @event return
        {{l04_return}} {{l04_false_bat}}
    if gps_satellites < 6:
        # @event blocked
        # @event return
        return False
    if {{l04_not}} is_armed:
        # @event blocked
        # @event return
        return {{l04_false_arm}}
    # @event return
    return {{l04_true}}

# @event define
# @event call
result = can_takeoff(battery_percent, gps_satellites, is_armed)
# @event result
print("起飞判定：", "允许起飞" if result else "禁止起飞")
if result:
    # @event takeoff
    print("演示：执行起飞")
else:
    # @event blocked
    print("演示：保持地面待命")`,
    scenarios: [
      { id: "ready", label: "全部通过", description: "72% 电量、10 颗卫星、已解锁，返回 True。", prelude: "battery_percent = 72\ngps_satellites = 10\nis_armed = True" },
      { id: "battery", label: "电量不足", description: "25% 电量在第一个 return 结束；GPS 和解锁检查不再执行。", prelude: "battery_percent = 25\ngps_satellites = 10\nis_armed = True" },
      { id: "gps", label: "GPS 不足", description: "电量通过，4 颗卫星在第二个 return 被拒绝。", prelude: "battery_percent = 72\ngps_satellites = 4\nis_armed = True" },
      { id: "locked", label: "未解锁", description: "前两项通过，但 is_armed 为 False。", prelude: "battery_percent = 72\ngps_satellites = 10\nis_armed = False" },
      { id: "boundary", label: "边界 30% / 6 颗", description: "正好 30% 电量和 6 颗卫星属于允许边界。", prelude: "battery_percent = 30\ngps_satellites = 6\nis_armed = True" },
    ],
    defaultScenario: "ready",
  },
  {
    id: "05",
    title: "控制台有文字，返回值为什么是 None？",
    shortTitle: "默认 None",
    kicker: "3.1.3 · 默认返回值",
    description: "运行教材的 print_done()。它打印“任务完成”，但没有写 return；观察变量 x 实际拿到什么。",
    objective: "区分 print 输出和 return 返回；认识无 return 函数默认返回 None。",
    concept: "print 把文字送到控制台，return 把对象交给调用者。这个函数没有 return，所以 x 是 None，不能据此当作飞行高度。",
    traceHint: "先输出“任务完成”，再在主流程看到返回值 None。模型不会因为一行打印文字而改变飞行状态。",
    blanks: [
      { id: "l05_def", answer: "def", hint: "定义一个没有参数的函数。", explanation: "无参数也必须保留括号。" },
      { id: "l05_call", answer: "print_done", hint: "调用教材中的完成提示函数。", explanation: "调用先执行 print，然后在函数末尾隐式返回 None。" },
      { id: "l05_x", answer: "x", hint: "打印接收了函数返回值的变量。", explanation: "x 接收到的是 None，而不是“任务完成”这个字符串。" },
      { id: "l05_none", answer: "None", hint: "Python 用什么值表示这里没有返回具体结果？", explanation: "None 是默认返回值，首字母大写；它不是字符串。" },
    ],
    code: `# 教材示例：函数只打印，不写 return
{{l05_def}} print_done():
    # @event enter
    print("任务完成")
    # @event return

# @event define
# @event call
x = {{l05_call}}()
# @event result
print("返回值：", {{l05_x}})
print("x 是否为 None：", x is {{l05_none}})
# @event finish`,
    scenarios: [
      { id: "none", label: "只打印，没有 return", description: "函数体输出文字，调用处接收到 None。", prelude: "" },
    ],
    defaultScenario: "none",
  },
  {
    id: "06",
    title: "把数值返回来，再用于姿态演示",
    shortTitle: "返回数值",
    kicker: "3.1.3 · calc_flight_cost() 练习",
    description: "完成教材的耗电计算。修改结束电量，返回的消耗值进入后续计算：演示俯仰角 = 消耗电量 ÷ 2。",
    objective: "用 return 返回计算结果，在调用处保存，并参与后续数值计算。",
    concept: "函数只计算 battery_start - battery_end。右侧把 cost/2 映射为俯仰角，帮助看清数据流；这个映射是课堂可视化规则。",
    traceHint: "90 → 72 得到 cost=18，俯仰角 9°；结束电量改成 90 时 cost=0，模型恢复水平。",
    blanks: [
      { id: "l06_return", answer: "return", hint: "把计算结果交回调用处。", explanation: "写 print 只能输出；这里需要 return 让调用者得到数字。" },
      { id: "l06_start", answer: "battery_start", hint: "被减数是起始电量。", explanation: "消耗电量等于起始电量减去结束电量。" },
      { id: "l06_minus", answer: "-", hint: "两个电量之间要做哪种运算？", explanation: "例如 90 - 72 得到 18。" },
      { id: "l06_call", answer: "calc_flight_cost", hint: "调用定义好的耗电计算函数。", explanation: "返回的数字被变量 cost 接收。" },
      { id: "l06_end", answer: "72", hint: "教材传 72；可输入 30～90，观察返回值和俯仰角。", explanation: "改变实参会改变函数计算结果，并影响后续姿态。", numberRange: [30, 90] },
      { id: "l06_cost", answer: "cost", hint: "把函数实际返回的数值用于后续计算。", explanation: "pitch 由 cost 计算，姿态随实际执行结果变化。" },
    ],
    code: `# 教材练习：计算消耗电量
def calc_flight_cost(battery_start, battery_end):
    # @event enter
    # @event return
    {{l06_return}} {{l06_start}} {{l06_minus}} battery_end

# @event define
# @event call
cost = {{l06_call}}(90, {{l06_end}})
# @event result
print("消耗电量：", cost)

# 课堂演示映射：数值返回结果用于后续计算
pitch = {{l06_cost}} / 2
roll = 0
yaw = 0
height = 18
print("演示俯仰角：", pitch, "度")
# @event attitude`,
    scenarios: [
      { id: "cost", label: "修改结束电量", description: "试试 72、90、30，分别观察 9°、0°、30° 的俯仰姿态。", prelude: "" },
    ],
    defaultScenario: "cost",
  },
  {
    id: "07",
    title: "返回一行简报，回放这一条飞行日志",
    shortTitle: "返回字符串",
    kicker: "3.1.3 · make_log_brief()",
    description: "用教材中的字典字段生成字符串并返回。切换不同高度的记录，观察返回文字与日志回放高度。",
    objective: "从字典取值，使用 .format() 整理文本，用 return 返回字符串，并在调用处打印。",
    concept: "make_log_brief 不直接打印，而是 return brief。调用者接收 text 后再打印；右侧回放当前这条日志记录，不表示打印字符串能控制实体飞机。",
    traceHint: "先执行函数取值与格式化，再在调用处取得 text；日志事件读取这次实际处理的 log。",
    blanks: [
      { id: "l07_name", answer: "make_log_brief", hint: "教材中生成日志简报的函数名。", explanation: "统一的名字让主流程重复使用同一项工具。" },
      { id: "l07_format", answer: "format", hint: "把后面四个值按顺序填入字符串中的 {}。", explanation: ".format() 返回已经替换好占位符的新字符串。" },
      { id: "l07_key", answer: '"battery_percent"', accepted: ["'battery_percent'"], hint: "读取电量字段，键名需要引号。", explanation: "字典键名必须与数据中的 battery_percent 一致。" },
      { id: "l07_return", answer: "return", hint: "把拼好的字符串交回调用处。", explanation: "这里返回字符串，后续由调用方决定怎样使用。" },
      { id: "l07_brief", answer: "brief", hint: "要返回的是前面生成的简报变量。", explanation: "返回变量的值，不要把变量名写成带引号的字符串。" },
      { id: "l07_call", answer: "make_log_brief", hint: "将当前 log 传入简报函数。", explanation: "函数返回的文本保存到 text。" },
      { id: "l07_text", answer: "text", hint: "打印接收到的返回值。", explanation: "调用者打印 text，函数内部只负责生成它。" },
    ],
    code: `# 教材示例：一条日志 → 一行文本
def {{l07_name}}(log):
    # @event enter
    brief = "UAV:{} 时长{}min 高度{}m 电量{}%".{{l07_format}}(
        log["uav_id"], log["flight_min"],
        log["altitude_m"], log[{{l07_key}}]
    )
    # @event return
    {{l07_return}} {{l07_brief}}

# @event define
# @event call
text = {{l07_call}}(log)
# @event result
print({{l07_text}})
# 课堂可视化：回放当前日志的记录高度
# @event log`,
    scenarios: [
      { id: "low", label: "18 m 日志", description: "回放低空记录，返回字符串应包含高度 18.0m。", prelude: 'log = {"uav_id": "UAV-07", "flight_min": 3, "altitude_m": 18.0, "battery_percent": 90}' },
      { id: "mid", label: "40 m 日志", description: "同一函数处理教材的第二条日志。", prelude: 'log = {"uav_id": "UAV-07", "flight_min": 8, "altitude_m": 40.0, "battery_percent": 78}' },
      { id: "high", label: "52.5 m 日志", description: "教材原始示例，返回文本和模型都对应这一条记录。", prelude: 'log = {"uav_id": "UAV-07", "flight_min": 12, "altitude_m": 52.5, "battery_percent": 86}' },
    ],
    defaultScenario: "high",
  },
  {
    id: "08",
    title: "返回三个结果，调用处一次接收",
    shortTitle: "元组与接收",
    kicker: "3.1.3 · parse_mission_id()",
    description: "按教材把任务编号切成前缀、日期、区域。用多重赋值一次接收三个结果，再验证返回对象的类型。",
    objective: "理解 return a, b, c 实际返回一个元组；在调用处按顺序接收。",
    concept: "返回多个值时，Python 把这些值组成一个元组。p、d、a 分别接收第 1、2、3 项；任务编号解析本身不改变飞行姿态。",
    traceHint: "观察函数内 prefix / date_part / area，以及调用后 p / d / a 的对应关系。",
    blanks: [
      { id: "l08_return", answer: "return", hint: "把三个片段交回调用处。", explanation: "后面用逗号分隔的值组成一个元组。" },
      { id: "l08_prefix", answer: "prefix", hint: "第一个返回值是任务编号的前缀。", explanation: "prefix 对应切片 mission_id[0:3]。" },
      { id: "l08_area", answer: "area", hint: "第三个返回值是末尾的区域代码。", explanation: "area 对应 mission_id[-3:]。" },
      { id: "l08_d", answer: "d", hint: "教材用 p、d、a 按顺序接收。这里是第二项。", explanation: "d 接收到 date_part，顺序必须与返回值一致。" },
      { id: "l08_call", answer: "parse_mission_id", hint: "调用任务编号解析函数。", explanation: "一次调用返回一个包含三项的元组。" },
    ],
    code: `# 教材示例：多值返回，实际是元组
def parse_mission_id(mission_id):
    # @event enter
    prefix = mission_id[0:3]
    date_part = mission_id[4:12]
    area = mission_id[-3:]
    # @event return
    {{l08_return}} {{l08_prefix}}, date_part, {{l08_area}}

# @event define
# @event call
p, {{l08_d}}, a = {{l08_call}}(mission_id)
# @event result
print("前缀：", p)
print("日期：", d)
print("区域：", a)
# 教材验证：再次调用，检查实际返回对象的类型
# @event call
print("返回对象类型：", type(parse_mission_id(mission_id)))
# @event finish`,
    scenarios: [
      { id: "a01", label: "MIS-20251223-A01", description: "应分别接收到 MIS、20251223、A01。", prelude: 'mission_id = "MIS-20251223-A01"' },
      { id: "b02", label: "MIS-20261019-B02", description: "函数保持相同，替换输入后得到另一组片段。", prelude: 'mission_id = "MIS-20261019-B02"' },
    ],
    defaultScenario: "a01",
  },
  {
    id: "09",
    title: "课内迁移：把姿态作为四个返回值",
    shortTitle: "姿态实验",
    kicker: "课内迁移 · 普通调用与元组返回",
    description: "把刚学的多值返回迁移到姿态数据。填写俯仰、横滚、航向、高度；每次修改都由 Python 重新调用、返回并接收。",
    objective: "用普通位置实参和元组返回传递四个数值，观察返回结果驱动模型姿态。",
    concept: "make_attitude 接收四个普通参数，return 一个四项元组。主流程按相同顺序接收；右侧严格使用这次执行得到的 pitch、roll、yaw、height。",
    traceHint: "俯仰/横滚可填 -30～30，航向 -180～180，高度 5～60。先单独改一个数，再组合观察。",
    blanks: [
      { id: "l09_return", answer: "return", hint: "把四个姿态值组成元组交回调用者。", explanation: "用逗号分隔四项返回值，不需要引入新的参数语法。" },
      { id: "l09_height_name", answer: "height", hint: "第 4 项要返回传入的高度形参。", explanation: "返回顺序与调用处四个接收变量保持一致。" },
      { id: "l09_call", answer: "make_attitude", hint: "调用上面定义的姿态数据函数。", explanation: "后面的四个数依次交给 pitch、roll、yaw、height。" },
      { id: "l09_pitch", answer: "12", hint: "俯仰角：可填 -30～30 的数值。", explanation: "改变第一个实参，返回元组的第一项随之改变。", numberRange: [-30, 30] },
      { id: "l09_roll", answer: "-10", hint: "横滚角：可填 -30～30 的数值。", explanation: "第二项被调用处的 roll 接收，控制左右倾斜。", numberRange: [-30, 30] },
      { id: "l09_yaw", answer: "45", hint: "航向角：可填 -180～180 的数值。", explanation: "第三项被 yaw 接收，控制水平朝向。", numberRange: [-180, 180] },
      { id: "l09_height", answer: "25", hint: "演示高度：可填 5～60 的数值。", explanation: "第四项被 height 接收，控制悬停高度。", numberRange: [5, 60] },
    ],
    code: `# 课内迁移：仍然只有函数定义、普通调用与多值返回
def make_attitude(pitch, roll, yaw, height):
    # @event enter
    # @event return
    {{l09_return}} pitch, roll, yaw, {{l09_height_name}}

# @event define
# @event call
pitch, roll, yaw, height = {{l09_call}}(
    {{l09_pitch}}, {{l09_roll}}, {{l09_yaw}}, {{l09_height}}
)
# @event result
print("俯仰：", pitch, "横滚：", roll)
print("航向：", yaw, "高度：", height)
# 右侧读取真实返回并接收的这四个变量
# @event attitude`,
    scenarios: [
      { id: "attitude", label: "自由姿态实验", description: "试试 0 / 0 / 0 / 15，再改为 20 / -15 / 90 / 40；观察每一项的作用。", prelude: "" },
    ],
    defaultScenario: "attitude",
  },
  {
    id: "10",
    title: "组装教材的无人机任务工具箱",
    shortTitle: "完整工具箱",
    kicker: "项目一综合 · 三个函数协作",
    description: "把教材的三个最小可用函数串起来：抬头输出、起飞判定、逐条日志简报。观察控制流如何在主程序与函数之间往返。",
    objective: "综合完成定义、调用、布尔返回、字符串返回；让主流程使用返回结果。",
    concept: "print_header 只打印；can_takeoff 返回布尔值；make_log_brief 返回字符串。主流程负责组合工具。历史日志仍可打印；起飞演示只由本次 ok 的值决定。",
    traceHint: "正常场景允许起飞并回放日志；禁止起飞场景仍输出历史简报，但飞机保持在地面。",
    blanks: [
      { id: "l10_def", answer: "def", hint: "创建教材中的抬头输出函数。", explanation: "函数区先定义工具，主流程随后调用。" },
      { id: "l10_false", answer: "False", hint: "电量不足时返回拒绝。", explanation: "False 交回主流程，ok 为 False 时不启动起飞演示。" },
      { id: "l10_return", answer: "return", hint: "简报函数需要把字符串交回主流程。", explanation: "返回值随后作为 print 的参数被打印。" },
      { id: "l10_takeoff", answer: "can_takeoff", hint: "调用负责起飞判定的函数。", explanation: "其布尔返回值被 ok 接收并用于判断。" },
      { id: "l10_brief", answer: "make_log_brief", hint: "为每一条 log 调用生成简报的工具。", explanation: "先生成并返回字符串，再由外层 print 打印。" },
    ],
    code: `# 项目一：三项工具由主流程组合
{{l10_def}} print_header(mission_id, uav_id, pilot):
    # 核心：封装重复的抬头输出
    # @event enter
    print("=== 无人机任务执行 ===")
    print("任务编号：", mission_id)
    print("无人机：", uav_id)
    print("飞手：", pilot)
    # @event notice

def can_takeoff(battery_percent, gps_satellites, is_armed):
    # 核心：只返回起飞判断结果
    # @event enter
    if battery_percent < 30:
        # @event blocked
        # @event return
        return {{l10_false}}
    if gps_satellites < 6:
        # @event blocked
        # @event return
        return False
    if not is_armed:
        # @event blocked
        # @event return
        return False
    # @event return
    return True

def make_log_brief(log):
    # 核心：把一条日志整理成简报字符串
    # @event enter
    uav = log["uav_id"]
    mins = log["flight_min"]
    alt = log["altitude_m"]
    bat = log["battery_percent"]
    brief = "日志：{} | 时长{}min | 高度{}m | 电量{}%".format(uav, mins, alt, bat)
    # @event return
    {{l10_return}} brief

# @event define
# 主流程：调用三项工具
# @event call
print_header(mission_id, uav_id, pilot)
# @event call
ok = {{l10_takeoff}}(battery_percent, gps_satellites, is_armed)
# @event result
print("起飞判定：", "允许起飞" if ok else "禁止起飞")
if ok:
    # @event takeoff
    print("演示：执行起飞")
else:
    # @event blocked
    print("演示：保持地面待命")
print("日志简报：")
for log in logs:
    # @event call
    print({{l10_brief}}(log))
    # @event log
print("=== 任务结束 ===")
# @event finish`,
    scenarios: [
      { id: "ready", label: "正常任务", description: "教材的原始状态：72% 电量、10 颗卫星、已解锁。", prelude: toolboxPrelude(72, 10, true) },
      { id: "battery", label: "电量不足", description: "25% 电量，拒绝起飞；历史日志依然可以生成简报。", prelude: toolboxPrelude(25, 10, true) },
      { id: "gps", label: "GPS 不足", description: "4 颗卫星，拒绝起飞；观察 can_takeoff 提前返回。", prelude: toolboxPrelude(72, 4, true) },
      { id: "locked", label: "未解锁", description: "解锁状态为 False，第三个检查拒绝起飞。", prelude: toolboxPrelude(72, 10, false) },
    ],
    defaultScenario: "ready",
  },
];

function toolboxPrelude(battery, satellites, armed) {
  return `mission_id = "MIS-20251223-A01"
uav_id = "UAV-07"
pilot = "Li Ming"
battery_percent = ${battery}
gps_satellites = ${satellites}
is_armed = ${armed ? "True" : "False"}
logs = [
    {"uav_id": "UAV-07", "flight_min": 12, "altitude_m": 52.5, "battery_percent": 86},
    {"uav_id": "UAV-07", "flight_min": 8, "altitude_m": 40.0, "battery_percent": 78},
]`;
}
