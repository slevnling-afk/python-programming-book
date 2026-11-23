// Project 4.5: each template is executable Python after filling the marked blanks.
// Commands are ordinary Python dictionaries consumed by the classroom simulator.
const waypointLog = `times = ["10:00", "10:01", "10:02", "10:03"]
altitudes = [12.4, 26.8, 18.2, 32.9]
batteries = [98, 94, 90, 86]
alarms = ["OK", "OK", "GPS_WEAK", "LOW_BATT"]
positions = {"10:00": (-14, -10), "10:01": (-14, 12),
             "10:02": (16, 12), "10:03": (16, -10)}`;

const quietLog = `times = ["10:00", "10:01", "10:02", "10:03"]
altitudes = [12.4, 26.8, 18.2, 32.9]
batteries = [98, 96, 94, 92]
alarms = ["OK", "OK", "OK", "OK"]
positions = {"10:00": (-14, -10), "10:01": (-14, 12),
             "10:02": (16, 12), "10:03": (16, -10)}`;

const actionTable = `table = {"S": {"action": "spin", "turns": 1, "direction": "right", "speed": 180},
         "H": {"action": "figure8", "loops": 0.5, "scale": 10, "speed": 10},
         "F": {"action": "figure8", "loops": 1, "scale": 10, "speed": 10}}`;
const signalData = (signal) => `signal = "${signal}"\n${actionTable}`;

export const lessons = [
  {
    id: 'iterable-altitude',
    title: '跟拍日志高度',
    topic: '可迭代对象 · 列表',
    description: '读取三次高度采样，让飞机依照列表顺序爬升、下降，再升到下一层。',
    challenge: '补全循环，再把高度改成 15 或 50，预测第一段会飞到哪一层。',
    concept: 'for 每次从列表取出一个元素。这里每次取出的高度生成一条对应指令，顺序与列表一致。',
    data: '# 后两次采样高度（米）\ntail = [12.2, 25.6]',
    code: `altitudes = [{{peak}}] + tail
seen = []
commands = []
{{loop}} h {{sourceWord}} {{source}}:
    seen.append(h)
    commands.{{add}}({"action": "altitude", "height": {{height}}})
print(seen)`,
    watch: ['altitudes', 'seen'],
    blanks: [
      { id: 'peak', answer: '36.4', numeric: [12, 54], hint: '填写第一条采样高度。试试 15 或 50，单位是米。' },
      { id: 'loop', answer: 'for', hint: '用哪个关键字循环取值？' },
      { id: 'sourceWord', answer: 'in', hint: 'for 变量 ___ 可迭代对象。' },
      { id: 'source', answer: 'altitudes', hint: '循环需要遍历哪一列高度？' },
      { id: 'add', answer: 'append', hint: '向列表末尾添加一条新指令。' },
      { id: 'height', answer: 'h', hint: '使用本轮循环取到的高度，不要固定写一个数。' },
    ],
  },
  {
    id: 'iterable-orders',
    title: '一串暗号，三种动作',
    topic: '可迭代对象 · 字符串与字典',
    description: '把动作暗号逐字符取出。S 自旋，H 飞半圈 8 字，F 飞完整 8 字。',
    challenge: '比较两种暗号的播放顺序。字典的 for 循环取到的是键，还是动作本身？',
    concept: '字符串逐字符迭代，字典默认逐键迭代。用字符作为键查找对应动作。',
    data: signalData('SH'),
    scenarios: [
      { id: 'spin-half', label: 'SH · 自旋再飞半圈', data: signalData('SH') },
      { id: 'full-spin', label: 'FS · 飞整圈再自旋', data: signalData('FS') },
    ],
    code: `keys = []
for k in {{table}}:
    keys.append({{key}})

chars = []
commands = []
for ch in {{signal}}:
    chars.append({{char}})
    commands.append(table[{{lookup}}])
print(keys, chars)`,
    watch: ['keys', 'chars'],
    blanks: [
      { id: 'table', answer: 'table', hint: '遍历动作字典。' },
      { id: 'key', answer: 'k', hint: '默认迭代字典时，当前取出的键存在哪个变量里？' },
      { id: 'signal', answer: 'signal', hint: '逐字符遍历动作暗号。' },
      { id: 'char', answer: 'ch', hint: '记录本轮取到的字符。' },
      { id: 'lookup', answer: 'ch', hint: '用本轮暗号字符查字典。' },
    ],
  },
  {
    id: 'list-comp',
    title: '一行改完三层高度',
    topic: '列表解析 · 映射',
    description: '用一条列表解析给每个高度加上相同的校正值，再保留一位小数。',
    challenge: '把校正值从 8 改为 2。看三条高度指令如何一起移动。',
    concept: '[表达式 for 变量 in 数据] 按顺序产生一个新列表。原始采样与校正结果可以同时比较。',
    data: 'altitudes = [12.43, 31.86, 16.12]',
    code: `offset = {{offset}}
targets = [{{round}}(a + offset, 1) {{loop}} a {{in}} {{data}}]
commands = [{"action": "altitude", "height": h} for h in targets]
print("原始高度", altitudes)
print("校正高度", targets)`,
    watch: ['altitudes', 'targets'],
    blanks: [
      { id: 'offset', answer: '8', numeric: [0, 18], hint: '所有采样增加的米数。试试 2 和 16。' },
      { id: 'round', answer: 'round', hint: '哪个函数可按指定小数位数取整？' },
      { id: 'loop', answer: 'for', hint: '列表解析的迭代部分以这个词开头。' },
      { id: 'in', answer: 'in', hint: '从哪个对象取元素，用这个关键词连接。' },
      { id: 'data', answer: 'altitudes', hint: '对原始高度中的每一个值应用表达式。' },
    ],
  },
  {
    id: 'conditional-comp',
    title: '过了门槛才能飞大 8 字',
    topic: '列表解析 · 布尔标记与条件筛选',
    description: '先给每条电量打上低电标记，再筛出达到门槛的电量。达标至少两条飞整圈，否则飞半圈。',
    challenge: '分别填 90 和 96，预测留下几条，看看 8 字缺的是哪一瓣。',
    concept: '表达式写条件会为每项产生一个布尔值。把 if 放在解析末尾才会筛掉整项。',
    data: 'batteries = [98, 94, 90, 86, 82]',
    code: `minimum = {{minimum}}
low_flags = [b {{lower}} minimum for b in {{batteries}}]
eligible = [b for b in batteries {{condition}} b {{enough}} minimum]
loops = 1 if len(eligible) >= 2 else 0.5
commands = [{"action": "figure8", "loops": loops, "scale": 12, "speed": 11}]
print(low_flags, eligible, loops)`,
    watch: ['low_flags', 'eligible', 'loops'],
    blanks: [
      { id: 'minimum', answer: '90', numeric: [80, 100], hint: '设定最低电量。90 有三条达标；96 只有一条。' },
      { id: 'lower', answer: '<', hint: '“低于”使用哪个比较符？' },
      { id: 'batteries', answer: 'batteries', hint: '为电量列表中的每项生成一个布尔标记。' },
      { id: 'condition', answer: 'if', hint: '列表解析末尾的筛选以哪个词开头？' },
      { id: 'enough', answer: '>=', hint: '达到门槛，表示大于或等于。' },
    ],
  },
  {
    id: 'grid-comp',
    title: '飞遍巡检方格',
    topic: '列表解析 · 嵌套循环与元组',
    description: '将两个方向的坐标两两组合，生成一张网格巡检路线。',
    challenge: '有 2 个 x 和 3 个 y。先预测共几个航点，再看飞机先扫哪一列。',
    concept: '两个 for 从左到右对应外层、内层循环。每次连接一对坐标，结果的每一项都是元组。',
    data: 'xs = [-12, 12]\nys = [-8, 0, 8]',
    code: `points = [({{x}}, {{y}}) for x in {{xs}} {{loop}} y in {{ys}}]
commands = [{"action": "route", "points": {{path}}, "speed": 12}]
print(len(points), points)`,
    watch: ['points'],
    blanks: [
      { id: 'x', answer: 'x', hint: '航点元组的横坐标取当前外层循环的值。' },
      { id: 'y', answer: 'y', hint: '航点元组的纵坐标取当前内层循环的值。' },
      { id: 'xs', answer: 'xs', hint: '外层循环遍历两个横坐标。' },
      { id: 'loop', answer: 'for', hint: '第二重循环从哪个关键字开始？' },
      { id: 'ys', answer: 'ys', hint: '内层循环遍历三个纵坐标。' },
      { id: 'path', answer: 'points', hint: '把整个生成的航点列表交给路线指令。' },
    ],
  },
  {
    id: 'dict-set-comp',
    title: '去重告警，按时间追回采样',
    topic: '字典解析与集合解析',
    description: '用时间查高度，让重复告警只进入统计一次。飞机到达你指定的坐标和采样高度，再按告警种类数自旋。',
    challenge: '发现两次 GPS_WEAK。预测去重后有多少种问题，最后会转几圈。',
    concept: '{键: 值 for …} 产生字典，{值 for …} 产生集合。集合只记录成员，不用它来指定巡检顺序。',
    data: `times = ["10:00", "10:01", "10:02", "10:03"]
altitudes = [12.4, 22.8, 34.2, 16.1]
alarms = ["OK", "GPS_WEAK", "GPS_WEAK", "LOW_BATT"]
checkpoint = "10:02"`,
    code: `by_time = {t: {{value}} for t, h in zip(times, {{altitudes}})}
unique = { {{alarm}} for a in alarms if a != "OK" }
target = by_time[{{checkpoint}}]
turns = {{count}}(unique) / 2
beacon = ({{east}}, {{north}})
commands = [{"action": "move", "x": beacon[0], "y": beacon[1], "speed": 10},
            {"action": "altitude", "height": target}]
if turns > 0:
    commands.append({"action": "spin", "turns": turns,
                     "direction": "left", "speed": 180})
print(by_time, unique)`,
    watch: ['by_time', 'unique', 'target', 'turns', 'beacon'],
    blanks: [
      { id: 'value', answer: 'h', hint: '字典中每个时间键关联对应的高度值。' },
      { id: 'altitudes', answer: 'altitudes', hint: '用 zip 把时间列和高度列排在一起。' },
      { id: 'alarm', answer: 'a', hint: '集合收集每轮取到的非 OK 告警。' },
      { id: 'checkpoint', answer: 'checkpoint', hint: '用数据区指定的时间查高度。' },
      { id: 'count', answer: 'len', hint: '统计去重后还有多少种告警。' },
      { id: 'east', answer: '15', numeric: [-25, 25], hint: '自己指定航点的横坐标 x，单位是米。' },
      { id: 'north', answer: '-12', numeric: [-25, 25], hint: '自己指定航点的纵坐标 y，单位是米。' },
    ],
  },
  {
    id: 'zip-records',
    title: '对齐四列日志',
    topic: 'zip · 按位置配对',
    description: '把时间、高度、电量、告警逐列对齐。飞机只访问能够配成完整记录的航点。',
    challenge: '切换到“告警列缺尾”，预判第 4 个航点是否还会出现在路线里。',
    concept: 'zip 把同位置的数据打包成元组，默认到最短的一列为止。用 list 展开它，可反复查看完整记录。',
    data: waypointLog,
    scenarios: [
      { id: 'aligned', label: '四列完整', data: waypointLog },
      { id: 'short', label: '告警列缺尾', data: waypointLog.replace('["OK", "OK", "GPS_WEAK", "LOW_BATT"]', '["OK", "OK", "GPS_WEAK"]') },
    ],
    code: `records = {{list}}({{zip}}(times, {{altitudes}}, {{batteries}}, {{alarms}}))
points = [positions[t] for t, h, b, a in records]
commands = []
if records:
    commands.append({"action": "altitude", "height": records[-1][1]})
    commands.append({"action": "route", "points": points, "speed": 12})
print("对齐行数", len(records), "原始时间个数", len(times))`,
    watch: ['records', 'points'],
    blanks: [
      { id: 'list', answer: 'list', hint: '把 zip 的结果展开为列表。' },
      { id: 'zip', answer: 'zip', hint: '四列按同一位置组合成记录，像拉链一样。' },
      { id: 'altitudes', answer: 'altitudes', hint: '第 2 列是高度。' },
      { id: 'batteries', answer: 'batteries', hint: '第 3 列是电量。' },
      { id: 'alarms', answer: 'alarms', hint: '第 4 列是告警。' },
    ],
  },
  {
    id: 'map-log',
    title: '让整列日志走过加工线',
    topic: 'map · 批量转换',
    description: '一条 map 校正每个高度并统一精度。另一条 map 把电量转成百分号字符串。',
    challenge: '把校正值设为 0 或 20，比较飞行高度。电量 94 和 "94%" 分别是什么类型？',
    concept: 'map 将同一个函数作用在每个元素上。转换数值与格式化文字可以使用不同的函数。',
    data: 'altitudes = [10.12, 31.47, 12.01]\nbatteries = [98, 94, 89]',
    code: `gain = {{gain}}
targets = list({{map}}(lambda a: round(a + gain, {{precision}}), altitudes))
labels = {{list}}(map(lambda b: {{format}}, {{batteries}}))
commands = [{"action": "altitude", "height": h} for h in targets]
print(targets, labels)`,
    watch: ['targets', 'labels'],
    blanks: [
      { id: 'gain', answer: '4', numeric: [0, 22], hint: '每个高度增加的米数。所有采样会使用相同加法规则。' },
      { id: 'map', answer: 'map', hint: '把函数应用到这一列里的每个元素。' },
      { id: 'precision', answer: '1', hint: '按本题要求保留 1 位小数。' },
      { id: 'list', answer: 'list', hint: '将 map 的结果展开成适合检查的列表。' },
      { id: 'format', answer: 'f"{b}%"', accepted: ["f'{b}%'", 'str(b) + "%"', "str(b) + '%'"], hint: '把当前的 b 加上百分号，例如 f"{b}%"。' },
      { id: 'batteries', answer: 'batteries', hint: '用于转换百分号标签的原始电量。' },
    ],
  },
  {
    id: 'filter-records',
    title: '只飞需要复查的点',
    topic: 'filter · 筛选整条记录',
    description: '筛选出低电量或出现告警的记录。飞机从原点出发，仅回访被保留的航点。',
    challenge: '试用 90 和 97 作门槛；再切到“全部正常”，看空筛选结果是否还会下发路线。',
    concept: 'filter 保留满足条件的原元素。这里保留整行元组，仍可按时间字段查到对应航点。',
    data: waypointLog,
    scenarios: [
      { id: 'two-alerts', label: '两条告警', data: waypointLog },
      { id: 'clear', label: '全部正常', data: quietLog },
    ],
    code: `limit = {{limit}}
records = list(zip(times, altitudes, batteries, alarms))
focus = list({{filter}}(lambda r: (r[{{batt}}] < limit)
                    {{or}} (r[{{alarm}}] != "OK"), {{records}}))
points = [positions[r[0]] for r in focus]
commands = [{"action": "route", "points": points, "speed": 10}] if points else []
print("保留", len(focus), "条复查记录")`,
    watch: ['records', 'focus', 'points'],
    blanks: [
      { id: 'limit', answer: '90', numeric: [82, 100], hint: '低于这个百分比才算低电量。建议比较 90 和 97。' },
      { id: 'filter', answer: 'filter', hint: '保留条件为 True 的原始记录。' },
      { id: 'batt', answer: '2', hint: '按 0 开始数，电量是第 3 个字段。' },
      { id: 'or', answer: 'or', hint: '低电量与非 OK 告警，满足任意一个条件即可。' },
      { id: 'alarm', answer: '3', hint: '按 0 开始数，告警是第 4 个字段。' },
      { id: 'records', answer: 'records', hint: '对已经对齐的记录列表筛选。' },
    ],
  },
  {
    id: 'batch-show',
    title: '结业任务 · 编排复查飞行',
    topic: '综合 · zip → map → filter',
    description: '对齐日志、生成低电标记和电量标签、筛选复查点，最后让飞机完成 8 字、绕点和返航。',
    challenge: '保持门槛 90，切换告警日志与平稳日志。哪条航线应该是半圈？为什么？',
    concept: '先配对、再转换和筛选。指令使用本次运行产生的数据，也能处理没有需复查记录的情况。',
    data: waypointLog,
    scenarios: [
      { id: 'warning', label: '告警复查 · 半圈', data: waypointLog },
      { id: 'quiet', label: '平稳日志 · 整圈', data: quietLog },
    ],
    code: `minimum = {{minimum}}
records = list({{zip}}(times, altitudes, batteries, alarms))
flags = [b < minimum for b in {{batteries}}]
percent = list({{map}}(lambda b: f"{b}%", batteries))
focus = list({{filter}}(lambda r: r[2] < minimum or r[3] != "OK", records))
points = [positions[r[0]] for r in {{focus}}]
commands = [{"action": "altitude", "height": records[0][1]}] if records else []
if points:
    commands.append({"action": "route", "points": points, "speed": 12})
loops = 0.5 if focus else 1
commands.append({"action": "figure8", "loops": loops, "scale": 10, "speed": 12})
commands.append({"action": "orbit", "radius": 8, "laps": 0.5,
                 "direction": "right", "speed": 10})
commands.append({"action": "return", "height": 16, "speed": 12})
print(flags, percent, "复查行数", len(focus))`,
    watch: ['records', 'flags', 'percent', 'focus', 'loops'],
    blanks: [
      { id: 'minimum', answer: '90', numeric: [80, 100], hint: '设置低电量判断使用的界线，建议先用 90。' },
      { id: 'zip', answer: 'zip', hint: '对齐四列日志。' },
      { id: 'batteries', answer: 'batteries', hint: '给这列电量中的每条记录生成标记。' },
      { id: 'map', answer: 'map', hint: '生成百分号标签时，逐项应用格式化函数。' },
      { id: 'filter', answer: 'filter', hint: '按给定条件保留整条记录。' },
      { id: 'focus', answer: 'focus', hint: '用筛选后的复查记录生成需要回访的坐标。' },
    ],
  },
];
