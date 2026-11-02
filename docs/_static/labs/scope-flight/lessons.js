// 模块三 · 项目三：局部 / 全局 / 内嵌作用域、lambda 与递归。
// 代码中的动作数据均由实际 Python 计算产生；@event 注释只观察执行。
// 飞行是计分与变量数据的教学映射，转换公式直接写在学生可见代码中。
export const lessons = [
  {
    id: '01', shortTitle: '局部能量站', title: '局部变量算出能量，返回值决定高度',
    kicker: '3.3.1 · 局部变量与返回值',
    description: '在函数内部计算“分钟数 × 局部倍率”，把计算结果作为目标高度。再试着从函数外读取 rate，观察真实的 NameError。',
    objective: '认识局部变量的可见范围，通过 return 将计算结果交给调用方。',
    concept: 'rate 属于 calc_energy_cost() 的局部作用域，主流程不能直接读取它。cost 是接收返回值的新变量；此处明确把 cost 的数值映射为演示高度。',
    traceHint: '函数内部能看到 flight_min、rate、cost。回到主流程后，返回值仍可使用，而直接读取 rate 会被 NameError 捕获。',
    expectedActions: ['altitude'],
    blanks: [
      { id: 's01_rate', answer: '3', hint: '局部倍率参考为 3，可探索 1～5。', explanation: 'rate 只在本次函数调用内部创建。', numberRange: [1, 5] },
      { id: 's01_return', answer: 'return', hint: '把局部计算的 cost 交回调用方。', explanation: 'return 将数值交出，不会把局部变量 rate 变成全局变量。' },
      { id: 's01_call', answer: 'calc_energy_cost', hint: '调用刚定义的能量计算函数。', explanation: '本次调用创建自己的 flight_min、rate 和 cost。' },
      { id: 's01_minutes', answer: '5', hint: '参考飞行 5 分钟，可探索 2～10。', explanation: '这个实参和局部 rate 相乘，实际返回值决定高度。', numberRange: [2, 10] },
      { id: 's01_local', answer: 'rate', hint: '尝试在函数外读取哪个局部变量？', explanation: 'rate 没有在脚本顶层定义，直接读取会产生 NameError。' },
      { id: 's01_error', answer: 'NameError', hint: '变量名在当前作用域不可见，会出现什么错误？', explanation: '用 except NameError 展示局部变量在函数外不可见。' },
    ],
    code: `# 教材练习：局部变量 rate，数值返回给主流程
def calc_energy_cost(flight_min):
    rate = {{s01_rate}}
    cost = flight_min * rate
    # @event scope
    {{s01_return}} cost

cost = {{s01_call}}({{s01_minutes}})
print("能量计算结果：", cost)
# 教学映射：返回多少，就飞到多少米
action = "altitude"
height = cost
speed = 4
# @event command

try:
    print({{s01_local}})
except {{s01_error}}:
    print("局部 rate 在函数外不可见，返回的 cost 可以使用。")
# @event scope`,
    scenarios: [
      { id: 'energy', label: '局部能量 → 目标高度', description: '参考值 5 × 3 = 15，飞机调整到 15 m。改变分钟数或局部倍率，观察实际返回值与高度。', prelude: '' },
    ], defaultScenario: 'energy',
  },
  {
    id: '02', shortTitle: '同名双世界', title: '两个 height 同名，为什么互不覆盖？',
    kicker: '3.3.1 · 局部变量遮蔽全局变量',
    description: '先飞到函数返回的局部高度，再飞到脚本中的全局高度。同样叫 height，却属于两个不同的作用域。',
    objective: '比较局部 height 与全局 height，验证函数内赋值没有修改外部同名变量。',
    concept: 'choose_height() 中的 height 是局部变量，会遮蔽同名全局变量。返回局部数值并不会覆盖全局 height；主流程可以分别使用两个值。',
    traceHint: '在 choose_height() 内对照局部 height 与被遮蔽的全局 height。函数返回后，全局高度仍是原来的值。两条高度指令分别使用 inside 和全局 height。',
    expectedActions: ['altitude', 'altitude'],
    blanks: [
      { id: 's02_global_height', answer: '35', hint: '全局 height 参考为 35，可探索 5～60 m。', explanation: '脚本顶层定义的 height 属于全局作用域。', numberRange: [5, 60] },
      { id: 's02_local_height', answer: '12', hint: '局部 height 参考为 12，可探索 2～60 m。', explanation: '这个同名赋值只创建函数内部的局部变量。', numberRange: [2, 60] },
      { id: 's02_return', answer: 'return', hint: '把局部 height 的数值交回主流程。', explanation: 'inside 接收的是返回数值，全局 height 不受影响。' },
      { id: 's02_call', answer: 'choose_height', hint: '调用生成局部高度的函数。', explanation: '本次调用中的局部变量在函数结束后不能从外部直接访问。' },
      { id: 's02_global_ref', answer: 'height', hint: '第二次飞行要使用哪个全局变量？', explanation: '主流程的 height 仍然指向脚本顶层定义的值。' },
    ],
    code: `height = {{s02_global_height}}  # 全局变量

def choose_height():
    height = {{s02_local_height}}  # 同名局部变量
    # @event scope
    {{s02_return}} height

def fly_to_height(height):
    action = "altitude"
    speed = 4
    # @event command

inside = {{s02_call}}()
print("局部返回值：", inside, "全局 height：", height)
# @event scope
fly_to_height(inside)
fly_to_height({{s02_global_ref}})`,
    scenarios: [
      { id: 'shadow', label: '局部 12 m → 全局 35 m', description: '参考两次高度为 12、35；也可以修改两处数字，把顺序设计成先升后降。', prelude: '' },
    ], defaultScenario: 'shadow',
  },
  {
    id: '03', shortTitle: '共享计分牌', title: 'global 让两次加分接力到更高处',
    kicker: '3.3.2 · global 与累计总分',
    description: '两次调用共用一块 total_score 计分牌。每次加分后飞到当前总分对应的高度，看局部 points 如何改变全局状态。',
    objective: '用 global 声明修改全局变量，理解多次调用之间保留的累计状态。',
    concept: 'points 每次调用重新绑定，total_score 则由多次调用共享。global 指定本函数修改脚本顶层的 total_score；这里总分直接映射为演示高度。',
    traceHint: '同一轮的两次调用共享总分，参考依次为 12、30；重新运行脚本会从 0 开始。没有 global 时，total_score += points 会先读一个未赋值的局部变量，产生 UnboundLocalError。',
    expectedActions: ['altitude', 'altitude'],
    blanks: [
      { id: 's03_global', answer: 'global', hint: '在函数中修改脚本顶层变量，需要哪个关键字？', explanation: 'global 声明后，赋值作用于外部共享计分牌。' },
      { id: 's03_name', answer: 'total_score', hint: '声明要修改的全局计分变量。', explanation: '名称必须与脚本顶层的 total_score 一致。' },
      { id: 's03_add', answer: '+=', hint: '把本次 points 累加到现有总分，用哪个运算符？', explanation: '+= 保留此前得分，再加上这一次 points。' },
      { id: 's03_first', answer: '12', hint: '第一次参考加 12 分，可探索 5～25。', explanation: '第一次调用结束后，总分等于本次加分。', numberRange: [5, 25] },
      { id: 's03_second', answer: '18', hint: '第二次参考加 18 分，可探索 5～25。', explanation: '第二次加分接在第一次结果之后，最高演示总分为 50。', numberRange: [5, 25] },
    ],
    code: `total_score = 0

def add_to_total(points):
    {{s03_global}} {{s03_name}}
    total_score {{s03_add}} points
    # @event scope
    print("本次加分：", points, "累计：", total_score)
    action = "altitude"
    height = total_score
    speed = 4
    # @event command

add_to_total({{s03_first}})
add_to_total({{s03_second}})
print("最后的全局总分：", total_score)
# @event scope`,
    scenarios: [
      { id: 'score', label: '两次调用，共享计分', description: '参考高度依次为 12 m、30 m。改动第二次得分，只改变第二个累计结果。', prelude: '' },
    ], defaultScenario: 'score',
  },
  {
    id: '04', shortTitle: '告警旋转秀', title: '每次调用累加一次，旋转也逐次增加',
    kicker: '3.3.2 · 全局计数器与重复调用',
    description: '把教材的 alarm_count 计数器变成旋转挑战：第 1 次半圈，第 2 次一圈，第 3 次一圈半。切换方向，观察相同计数如何驱动不同旋转。',
    objective: '通过三次调用观察同一个全局计数器的连续变化。',
    concept: 'alarm_count 在主流程中只初始化一次；每次 add_alarm() 都修改同一份全局数据。课堂映射 turns = alarm_count / 2，因此计数 1、2、3 对应 0.5、1、1.5 圈。',
    traceHint: '注意每次指令中的 alarm_count 和 turns。同一轮的函数调用结束后计数不会清零，三个实际命令按顺序旋转；重新运行脚本时会再次初始化为 0。',
    expectedActions: ['spin', 'spin', 'spin'],
    blanks: [
      { id: 's04_global', answer: 'global', hint: '修改外部计数器时先声明什么？', explanation: 'global 让函数体中的 alarm_count 指向共享变量。' },
      { id: 's04_count', answer: 'alarm_count', hint: '教材中的全局告警计数器叫什么？', explanation: '三个函数调用都访问同一个 alarm_count。' },
      { id: 's04_add', answer: '+=', hint: '每次在已有计数上加 1。', explanation: 'alarm_count += 1 让计数保留并累加。' },
      { id: 's04_turns', answer: 'alarm_count', hint: '旋转圈数由哪个累计计数计算？', explanation: '当前全局告警次数除以 2，得到真实旋转圈数。' },
      { id: 's04_call', answer: 'add_alarm', hint: '第三次继续调用同一个计数函数。', explanation: '第三次调用从已经累积的 2 开始，变成 3。' },
    ],
    code: `alarm_count = 0

def add_alarm():
    {{s04_global}} {{s04_count}}
    alarm_count {{s04_add}} 1
    # @event scope
    action = "spin"
    turns = {{s04_turns}} / 2
    direction = spin_direction
    speed = 90
    print("累计告警：", alarm_count, "演示旋转：", turns, "圈")
    # @event command

add_alarm()
add_alarm()
{{s04_call}}()
print("主流程看到的计数：", alarm_count)
# @event scope`,
    scenarios: [
      { id: 'right', label: '向右旋转接力', description: '三条指令分别右旋半圈、一圈、一圈半；圈数来自实际全局计数。', prelude: 'spin_direction = "right"' },
      { id: 'left', label: '向左旋转接力', description: '计数过程相同，方向数据改为 left；比较累计航向与机头方向。', prelude: 'spin_direction = "left"' },
    ], defaultScenario: 'right',
  },
  {
    id: '05', shortTitle: '嵌套航点厂', title: '内层函数借用外层 weight，制造整条航线',
    kicker: '3.3.3 · 内嵌作用域',
    description: '外层设定一个缩放倍率，内层小工具把三个坐标逐个放大。只改 weight，就能让同一个三角航线变大、变小。',
    objective: '在内层函数中读取外层局部变量，分清局部参数与内嵌变量。',
    concept: 'scale_point() 的 x、y、point 是自己的局部变量；weight 来自外层 make_route()，属于内嵌作用域。外层工作区结束后，主流程使用返回的航点元组。',
    traceHint: '在 scale_point() 中查看 weight 的来源：它属于外层函数，不是脚本全局。三个 point 都按同一个 weight 计算，再组成一条 route 指令。',
    expectedActions: ['route'],
    blanks: [
      { id: 's05_weight', answer: '2', hint: '外层缩放倍率参考为 2，可探索 0.5～3。', explanation: '三处坐标都会读取这一个外层 weight。', numberRange: [0.5, 3] },
      { id: 's05_def', answer: 'def', hint: '在函数内部继续定义函数，仍用哪个关键字？', explanation: '缩进中的 def 创建内层函数 scale_point。' },
      { id: 's05_enclosing', answer: 'weight', hint: '内层函数从外层借用哪个倍率变量？', explanation: '内层没有同名局部赋值，因此从内嵌作用域找到 weight。' },
      { id: 's05_return', answer: 'return', hint: '把内层算出的坐标元组交还外层。', explanation: '外层分别把三次返回值保存到 p1、p2、p3。' },
      { id: 's05_call', answer: 'make_route', hint: '从主流程调用外层航线工厂。', explanation: '调用外层后，才会创建并使用它内部的小工具。' },
    ],
    code: `def make_route():
    weight = {{s05_weight}}

    {{s05_def}} scale_point(x, y):
        point = (x * {{s05_enclosing}}, y * weight)
        # @event scope
        {{s05_return}} point

    p1 = scale_point(left_x, -5)
    p2 = scale_point(right_x, -5)
    p3 = scale_point(0, 8)
    points = (p1, p2, p3)
    action = "route"
    speed = 6
    # @event command
    return points

route = {{s05_call}}()
print("外层交回的航线：", route)
# @event scope`,
    scenarios: [
      { id: 'triangle', label: '三角形航线', description: '基础点 (-8,-5)、(8,-5)、(0,8) 经 weight 缩放；参考倍率 2 生成 (-16,-10)、(16,-10)、(0,16)。', prelude: 'left_x = -8\nright_x = 8' },
      { id: 'mirror', label: '反向访问航点', description: '交换前两个基础点，缩放逻辑保持一致，飞机按返回元组的实际顺序飞行。', prelude: 'left_x = 8\nright_x = -8' },
    ], defaultScenario: 'triangle',
  },
  {
    id: '06', shortTitle: '8字缩放器', title: '借用外层 k，让完整或半个 8 字改变大小',
    kicker: '3.3.3 · make_multiplier() 内嵌变量练习',
    description: '按教材练习在外层定义 k、内层计算 x × k。把返回结果用作 8 字尺度，再选择整圈或半圈。',
    objective: '让内层函数访问外层参数，返回实际计算结果；比较不同倍率生成的飞行轨迹。',
    concept: 'k 是 make_multiplier() 的局部参数，对 mul() 来说属于内嵌作用域；x、result 是 mul() 自己的局部变量。外层返回的是计算数值，没有返回函数对象。',
    traceHint: '参考 x=10、k=2，返回 scale=20。loops=1 飞完整两瓣，loops=0.5 只飞一瓣；尺度始终来自实际的乘法返回值。',
    expectedActions: ['figure8'],
    blanks: [
      { id: 's06_k_ref', answer: 'k', hint: '内层乘法借用哪个外层参数？', explanation: 'mul() 在自己的局部作用域中找不到 k，会读取外层参数。' },
      { id: 's06_inner_return', answer: 'return', hint: '内层把 result 交回外层。', explanation: 'result 是内层函数的局部计算结果。' },
      { id: 's06_outer_return', answer: 'return', hint: '外层把 mul() 的计算结果交给主流程。', explanation: '外层返回一个数值，主流程保存为 scale。' },
      { id: 's06_x', answer: '10', hint: '参考 x=10，可探索 6～12。', explanation: '内层实参 x 乘以外层 k，决定 8 字轨迹大小。', numberRange: [6, 12] },
      { id: 's06_call', answer: 'make_multiplier', hint: '调用最外层的倍率函数。', explanation: '外层调用中会定义并执行内层 mul。' },
      { id: 's06_k', answer: '2', hint: '参考外层倍率 k=2，可探索 1～3。', explanation: '改变这个值，会改变内层借用的倍率。', numberRange: [1, 3] },
      { id: 's06_loops', answer: '1', hint: '整圈填 1，半圈填 0.5，可探索 0.5～2。', explanation: '圈数单独控制路径进度，计算返回的 scale 控制路径大小。', numberRange: [0.5, 2] },
    ],
    code: `def make_multiplier(k):
    def mul(x):
        result = x * {{s06_k_ref}}
        # @event scope
        {{s06_inner_return}} result
    {{s06_outer_return}} mul({{s06_x}})

scale = {{s06_call}}({{s06_k}})
print("实际返回的尺度：", scale)
action = "figure8"
loops = {{s06_loops}}
speed = 6
# @event command`,
    scenarios: [
      { id: 'eight', label: '倍率控制 8 字轨迹', description: '先只改 k，再只改 loops；区分轨迹大小与飞行圈数两个维度。', prelude: '' },
    ], defaultScenario: 'eight',
  },
  {
    id: '07', shortTitle: '匿名奖励圈', title: '一行 lambda，决定环绕奖励还是悬停',
    kicker: '3.3.4 · lambda 与条件表达式',
    description: '把教材的电量奖励规则写成匿名函数。奖励 2 分就绕一圈，奖励 1 分绕半圈，没有奖励则保持悬停。',
    objective: '补全 lambda 参数、冒号与表达式，并实际调用得到返回值。',
    concept: 'lambda b: 表达式 会返回表达式的计算结果。这里 bonus 决定 laps=bonus/2、radius=6+bonus*4；调用后主流程按实际 bonus 选择飞行或悬停。',
    traceHint: 'b 只在匿名函数表达式内部有效；主流程得到的是返回数值 bonus。切换电量情境，比较同一行规则产生的实际结果。',
    expectedActions: ['orbit'],
    blanks: [
      { id: 's07_lambda', answer: 'lambda', hint: '一行定义匿名函数使用哪个关键字？', explanation: 'lambda 不需要 def 和单独的 return 语句。' },
      { id: 's07_param', answer: 'b', hint: '电量实参在匿名函数内部用哪个参数名？', explanation: 'b 是本次匿名函数调用的局部参数。' },
      { id: 's07_colon', answer: ':', hint: '参数与表达式之间需要哪个半角标点？', explanation: 'lambda 参数: 表达式 是完整语法。' },
      { id: 's07_threshold', answer: '80', hint: '获得 2 分的电量阈值参考为 80，可探索 70～90。', explanation: '阈值会实际参与匿名函数表达式的比较。', numberRange: [70, 90] },
      { id: 's07_call', answer: 'battery_bonus', hint: '调用刚赋给变量的匿名函数。', explanation: '匿名函数赋给名字后，仍用 名字(实参) 调用。' },
      { id: 's07_bonus', answer: 'bonus', hint: '环绕圈数要读取哪个实际返回值？', explanation: 'bonus 为 2 时一圈，为 1 时半圈；0 分进入悬停分支。' },
    ],
    code: `battery_bonus = {{s07_lambda}} {{s07_param}}{{s07_colon}} 2 if b >= {{s07_threshold}} else 1 if b >= 50 else 0
bonus = {{s07_call}}(battery_percent)
print("电量：", battery_percent, "匿名函数返回：", bonus)
# @event scope

if bonus > 0:
    action = "orbit"
    radius = 6 + bonus * 4
    laps = {{s07_bonus}} / 2
    direction = "right"
    speed = 6
    # @event command
else:
    action = "hold"
    duration = 2
    message = "奖励为 0，保持安全悬停，不执行奖励环绕。"
    # @event command`,
    scenarios: [
      { id: 'high', label: '电量 90% · 一圈奖励', description: '参考阈值下返回 2，环绕半径 14 m、圈数 1。', prelude: 'battery_percent = 90' },
      { id: 'medium', label: '电量 60% · 半圈奖励', description: '返回 1，环绕半径 10 m、圈数 0.5。', prelude: 'battery_percent = 60' },
      { id: 'low', label: '电量 20% · 悬停等待', description: '返回 0，主流程选择保持悬停，不会伪造一个零圈飞行动作。', prelude: 'battery_percent = 20', expectedActions: ['hold'] },
    ], defaultScenario: 'high',
  },
  {
    id: '08', shortTitle: '高度通行证', title: 'lambda 返回 True，才前往目标高度',
    kicker: '3.3.4 · 匿名函数的布尔返回值',
    description: '用一行 lambda 判断高度是否达到门槛。条件通过就飞到指定高度，未通过就保持原有安全悬停。',
    objective: '定义并调用布尔规则，用实际返回值选择后续动作分支。',
    concept: 'is_safe_alt() 返回的是 True 或 False。改变阈值会改变比较结果，主流程的 if safe 决定是否下发高度指令；lambda 本身只计算结果。',
    traceHint: '默认阈值 10 m：目标 5 m 被拒绝、15 m 通过。把阈值改成 20，再测试 15 m，观察同一实参在不同规则下的结果。',
    expectedActions: ['altitude'],
    blanks: [
      { id: 's08_lambda', answer: 'lambda', hint: '使用哪个关键字编写匿名高度判定？', explanation: '一行表达式即可产生布尔返回值。' },
      { id: 's08_param', answer: 'alt', hint: '表达式中的 alt 来自哪个局部参数？', explanation: '匿名函数调用时，把目标高度绑定给 alt。' },
      { id: 's08_compare', answer: '>=', hint: '高度达到门槛，也应该通过，用哪个比较符？', explanation: '>= 会在等于阈值时返回 True。' },
      { id: 's08_threshold', answer: '10', hint: '参考门槛为 10 m，可探索 8～20。', explanation: '阈值实际参与 lambda 表达式，不是固定动画标签。', numberRange: [8, 20] },
      { id: 's08_call', answer: 'is_safe_alt', hint: '调用已定义的高度判断规则。', explanation: '调用结果保存在 safe 中供主流程使用。' },
      { id: 's08_safe', answer: 'safe', hint: 'if 要根据哪个实际布尔返回值选择分支？', explanation: '只有 safe 为真时才下发目标高度。' },
    ],
    code: `is_safe_alt = {{s08_lambda}} {{s08_param}}: alt {{s08_compare}} {{s08_threshold}}
safe = {{s08_call}}(target_altitude)
print("目标高度：", target_altitude, "是否通过：", safe)
# @event scope

if {{s08_safe}}:
    action = "altitude"
    height = target_altitude
    speed = 4
    # @event command
else:
    action = "hold"
    duration = 2
    message = "目标高度未通过规则，保持原有安全悬停。"
    # @event command`,
    scenarios: [
      { id: 'safe', label: '目标 15 m', description: '默认 15 >= 10 为真，飞机前往 15 m。调高阈值可让本场景改变分支。', prelude: 'target_altitude = 15' },
      { id: 'unsafe', label: '目标 5 m', description: '5 m 低于允许填写的所有门槛，保持起始的 10 m 悬停。', prelude: 'target_altitude = 5', expectedActions: ['hold'] },
      { id: 'high', label: '目标 45 m', description: '45 m 高于本关门槛范围，观察明显的向上飞行。', prelude: 'target_altitude = 45' },
    ], defaultScenario: 'safe',
  },
  {
    id: '09', shortTitle: '递归云阶梯', title: '递归每深入一层，飞机下降一级',
    kicker: '3.3.5 · 终止条件与递归调用',
    description: '把 countdown(n) 展开成一段空中阶梯：先飞到 n × step，再随着 n 减小逐层下降。到 0 后停止发出动作，再逐层返回计数。',
    objective: '补全递归基例与规模递减的自调用，观察展开、停止和返回三个过程。',
    concept: '每次 countdown() 调用都有自己的局部 n 和 result。n<=0 是终止条件；n-1 让问题规模缩小。下行时产生高度指令，上行时合并计数结果。',
    traceHint: '参考 n=4、step=8，实际高度为 32→24→16→8 m。调用到 n=0 时不再发出飞行动作，返回值依次合成为 1、2、3、4。',
    expectedActions: ['altitude', 'altitude', 'altitude', 'altitude'],
    blanks: [
      { id: 's09_base', answer: '<=', hint: 'n 已经到 0 或更小时结束，填哪个比较符？', explanation: '明确的终止条件让递归停在最简单的情况。' },
      { id: 's09_return', answer: 'return', hint: '基例把 result=0 交回上一层。', explanation: 'return 立即结束当前这一层调用。' },
      { id: 's09_step', answer: '8', hint: '每层高度差参考为 8 m，可探索 3～10。', explanation: '实际目标高度为当前局部 n 乘以 step。', numberRange: [3, 10] },
      { id: 's09_self', answer: 'countdown', hint: '递归要调用哪一个函数？', explanation: '函数调用自身，创建新的一层局部作用域。' },
      { id: 's09_decrease', answer: '1', hint: '每深入一层让 n 减少多少？', explanation: 'n-1 确保逐步靠近 n<=0 的终止条件。' },
      { id: 's09_n', answer: '4', hint: '参考从 4 层开始，可填 1～5 的整数。', explanation: '每一层产生一条高度指令，基例 0 不产生动作。', numberRange: [1, 5], integer: true },
    ],
    code: `def countdown(n):
    # @event enter
    if n {{s09_base}} 0:
        result = 0
        # @event return
        {{s09_return}} result

    action = "altitude"
    height = n * {{s09_step}}
    speed = 4
    print("深入一层，n =", n, "目标高度：", height)
    # @event command
    result = 1 + {{s09_self}}(n - {{s09_decrease}})
    # @event return
    return result

steps = countdown({{s09_n}})
print("逐层返回后，总层数：", steps)
# @event scope`,
    scenarios: [
      { id: 'stairs', label: '递归下降阶梯', description: '改变初始层数或每层高度差，再预测第一个高度、最后一个高度和返回总层数。', prelude: '' },
    ], defaultScenario: 'stairs',
  },
  {
    id: '10', shortTitle: '计分飞行秀', title: '用整份任务计分报告编排飞行',
    kicker: '3.3 综合 · 作用域 / lambda / 递归',
    description: '把五类知识组合成一份报告。局部计算起飞分，嵌套函数计算航线分，lambda 给奖励，递归算扣分，再由全局总分决定飞行。',
    objective: '连接局部、全局、内嵌作用域、匿名函数和递归，用真实计分结果驱动高度、目标点与 8 字动作。',
    concept: '评分函数先计算数据，add_to_total() 再修改共享总分。总分映射高度，航线分与扣分映射坐标，奖励映射 8 字尺度；最后返航降落。所有转换公式都显示在代码中。',
    traceHint: '参考电量 72%、航段 [8,9,7]、weight=1、告警 3 次：起飞10+航线24+奖励1−递归扣分6=总分29。实际飞到29 m、(12,-6)，飞一个尺度11的完整8字，再返航。',
    expectedActions: ['altitude', 'move', 'figure8', 'return'],
    blanks: [
      { id: 's10_local_return', answer: 'return', hint: '起飞评分函数交回自己的局部 result。', explanation: '局部计算通过返回值交给主流程，不会直接修改总分。' },
      { id: 's10_global', answer: 'global', hint: '累计得分前声明修改哪种作用域？', explanation: 'global total_score 允许修改脚本顶层的共享总分。' },
      { id: 's10_weight', answer: '1', hint: '外层航段权重参考为 1，可探索 0.5～2。', explanation: '三个航段都由内层 calc_segment() 借用这个外层权重。', numberRange: [0.5, 2] },
      { id: 's10_enclosing', answer: 'weight', hint: '内层函数读取哪个外层权重？', explanation: 'weight 对 calc_segment() 属于内嵌作用域。' },
      { id: 's10_lambda', answer: 'lambda', hint: '把电量奖励定义为单表达式匿名函数。', explanation: '表达式根据电量实际返回 2、1 或 0。' },
      { id: 's10_base', answer: '<=', hint: '告警次数到 0 或以下时结束递归。', explanation: '基例返回 0，让逐层扣分计算能够结束。' },
      { id: 's10_self', answer: 'stair_penalty', hint: '递归调用自己的函数名。', explanation: '每层将 n 减 1，返回时计算 n 加上更小问题的结果。' },
      { id: 's10_n', answer: '3', hint: '参考告警 3 次，可填 0～4 的整数。', explanation: '0次扣0分，1次扣1分，3次扣6分，4次扣10分。', numberRange: [0, 4], integer: true },
      { id: 's10_add', answer: 'add_to_total', hint: '把最后一项负扣分累加到共享总分。', explanation: '传入 -pen 表示从现有总分中减去递归扣分。' },
    ],
    code: `total_score = 0

def score_takeoff(battery_percent):
    base = 10
    penalty = 5 if battery_percent < 30 else 0
    result = base - penalty
    # @event scope
    {{s10_local_return}} result

def add_to_total(points):
    {{s10_global}} total_score
    total_score += points
    # @event scope

def score_route(segment_scores):
    weight = {{s10_weight}}
    def calc_segment(s):
        result = s * {{s10_enclosing}}
        # @event scope
        return result
    subtotal = 0
    for s in segment_scores:
        subtotal += calc_segment(s)
    return subtotal

battery_bonus = {{s10_lambda}} b: 2 if b >= 80 else 1 if b >= 50 else 0

def stair_penalty(n):
    # @event enter
    if n {{s10_base}} 0:
        result = 0
        # @event return
        return result
    result = n + {{s10_self}}(n - 1)
    # @event return
    return result

takeoff_points = score_takeoff(battery_percent)
route_points = score_route(segments)
bonus = battery_bonus(battery_percent)
pen = stair_penalty({{s10_n}})
add_to_total(takeoff_points)
add_to_total(route_points)
add_to_total(bonus)
{{s10_add}}(-pen)
print("起飞：", takeoff_points, "航线：", route_points)
print("奖励：", bonus, "扣分：", pen, "全局总分：", total_score)
# @event scope

# 教学映射：总分→高度，航线与扣分→目标点
action = "altitude"
height = total_score
speed = 4
# @event command
action = "move"
x = route_points / 2
y = -pen
speed = 6
# @event command
action = "figure8"
loops = 0.5 if total_score < 25 else 1
scale = 8 + bonus * 3
# @event command
action = "return"
height = 20
speed = 8
# @event command`,
    scenarios: [
      { id: 'standard', label: '教材任务 · 电量 72%', description: '航段为 [8,9,7]，参考总分29，先去指定点，再飞完整8字并返航。', prelude: 'battery_percent = 72\nsegments = [8, 9, 7]' },
      { id: 'excellent', label: '充足电量 · 90%', description: '同样航段，lambda 奖励变为2，总分和8字尺度实际增加。', prelude: 'battery_percent = 90\nsegments = [8, 9, 7]' },
      { id: 'short', label: '短航段任务 · 60%', description: '航段改为 [4,5,3]。参考总分17，8字按代码选择半圈；仍显示真实计分与返航过程。', prelude: 'battery_percent = 60\nsegments = [4, 5, 3]' },
    ], defaultScenario: 'standard',
  },
];
