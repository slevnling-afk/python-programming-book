// Module 5, Project 1. Each checkpoint ends after a complete Python statement.
const file = (name, data, label) => ({ label, files: { [name]: data } });
const field = (id, answer, hint, accepted) => ({ id, answer, hint, ...(accepted ? { accepted } : {}) });
const quoted = (id, value, hint) => field(id, '"' + value + '"', hint, ["'" + value + "'"]);
const alarm = id => field(id, '"ALARM"', '查看告警行共有的标记，填带引号的字符串。', ["'ALARM'", '"ALARM:"', "'ALARM:'"]);
const stages = (...labels) => labels.map(label => ({ label }));
const normalLog = '09:00,北岸,0,12,18,OK\n09:01,跨桥,18,8,34,OK\n09:02,回程,12,-14,14,OK\n';
const alertLog = normalLog.replace('34,OK', '34,ALARM:GPS_WEAK').replace('14,OK', '14,ALARM:LOW_BATT');
const harbor = [file('flight_log.txt', normalLog, '平稳巡检'), file('flight_log.txt', alertLog, '两条告警')];

export const lessons = [
  {
    id: 'open-close',
    title: '开档后复现第一段升降',
    shortTitle: '打开和关闭',
    topic: '5.1.1 · 打开、读取与关闭',
    description: '文件记录了两次飞行高度。完成第一空，模型就会追到首个高度。',
    challenge: '预测第二个目标比第一个高还是低，再回放下一条高度。',
    concept: '文件对象连接程序和文件。手动打开时，要在读取完成后主动关闭。',
    scenarios: [file('flight_log.txt', '32\n12\n', '高空降至巡检层'), file('flight_log.txt', '5\n27\n', '低空爬升到巡检层')],
    stages: stages('打开档案', '回放后一条', '关闭后转身确认'),
    code: `log = {{opening}}("flight_log.txt", "r", encoding="utf-8")
text = log.read()
heights = [int(row) for row in text.splitlines()]
commands = [{"action": "altitude", "height": heights[0], "speed": 12}]
# @stage
next_height = heights[{{next_index}}]
commands.append({"action": "altitude", "height": next_height, "speed": 12})
# @stage
log.{{closing}}()
closed = log.{{closed_attr}}
if closed:
    commands.append({"action": "spin", "turns": 0.5,
                     "direction": "right", "speed": 180})
print("目标高度：", heights, "｜文件已关闭：", closed)`,
    watch: ['text', 'heights', 'next_height', 'closed'],
    blanks: [
      field('opening', 'open', '使用 Python 的内置函数建立文件连接。'),
      field('next_index', '1', '行列表从 0 开始编号。这里读取第二个采样。'),
      field('closing', 'close', '调用文件对象的方法，手动结束本次读取。'),
      field('closed_attr', 'closed', '检查文件对象表示“已关闭”的布尔属性。'),
    ],
  },
  {
    id: 'log-path',
    title: '用两种地址找到同一个航点',
    shortTitle: '路径与自动关闭',
    topic: '5.1.1 · 相对路径、绝对路径与 with',
    description: '航点文件位于工作目录下的 logs 文件夹。先用相对路径读取坐标。',
    challenge: '改用从虚拟根目录开始的路径，验证是否仍读取同一份坐标。复核通过就绕航标半圈。',
    concept: '相对路径以当前工作目录为起点。绝对路径从根目录开始。with 代码块结束后会自动关闭文件。',
    scenarios: [file('logs/checkpoint.txt', '-21,18\n', '西侧航标'), file('logs/checkpoint.txt', '22,-16\n', '东侧航标')],
    stages: stages('相对路径定位', '绝对路径复核'),
    code: `with open({{relative}}, "r", encoding="utf-8") as f:
    relative_text = f.read().strip()
x, y = map(int, relative_text.split(","))
commands = [{"action": "move", "x": x, "y": y, "speed": 12}]
# @stage
{{context}} open({{absolute}}, {{mode}}, encoding="utf-8") {{binding}} absolute_file:
    absolute_text = absolute_file.read().strip()
same_point = relative_text == absolute_text
auto_closed = absolute_file.closed
if same_point and auto_closed:
    commands.append({"action": "orbit", "radius": 7, "laps": 0.5,
                     "direction": "left", "speed": 11})
print("地址指向同一航点：", same_point, "｜自动关闭：", auto_closed)`,
    watch: ['relative_text', 'absolute_text', 'same_point', 'auto_closed'],
    blanks: [
      field('relative', '"logs/checkpoint.txt"', '当前工作目录是 /flight-lab。文件在它下方的 logs 中，填带引号的相对路径。', ["'logs/checkpoint.txt'", '"./logs/checkpoint.txt"', "'./logs/checkpoint.txt'"]),
      field('context', 'with', '补上负责管理资源生命周期的语句关键字。'),
      quoted('absolute', '/flight-lab/logs/checkpoint.txt', '从虚拟根目录写起，路径包含工作目录、logs 子目录和文件名。'),
      quoted('mode', 'r', '只需要读取已经存在的文件。'),
      field('binding', 'as', '把打开后的文件对象交给 absolute_file。'),
    ],
  },
  {
    id: 'opening-modes',
    title: '追加航点，还是改写整条路线',
    shortTitle: '追加与覆盖',
    topic: '5.1.2 · 文本打开模式',
    description: '两个文件各有两条航点记录。先追加一个点，再用另一个文件对比覆盖效果。',
    challenge: '比较两条路线的航点数。为什么新增一行之后，一个文件有三行，另一个只有一行？',
    concept: '追加模式从末尾写入，写入模式在打开时清空已有内容。两种模式都可以创建不存在的文件。',
    scenarios: [{ label: '双份航线副本', files: { 'route.txt': '-17,-10\n-13,16\n', 'copy.txt': '-17,-10\n-13,16\n' } }],
    stages: stages('追加后重读', '核对末行', '比较覆盖'),
    code: `with open("route.txt", {{append_mode}}, encoding="utf-8") as f:
    f.write("16,14\\n")
with open("route.txt", "r", encoding="utf-8") as f:
    saved_lines = f.readlines()
points = [tuple(map(int, row.split(","))) for row in saved_lines]
commands = [{"action": "route", "points": points, "speed": 13}]
# @stage
appended_line = saved_lines[{{tail}}].strip()
print("追加后的末行：", appended_line)
# @stage
with open("copy.txt", {{replace_mode}}, encoding="utf-8") as f:
    f.{{write_method}}("0,-18\\n")
with open("copy.txt", {{read_mode}}, encoding="utf-8") as f:
    copy_lines = f.readlines()
copy_points = [tuple(map(int, row.split(","))) for row in copy_lines]
commands.append({"action": "route", "points": copy_points, "speed": 13})
print("追加与覆盖后的行数：", len(saved_lines), len(copy_lines))`,
    watch: ['saved_lines', 'appended_line', 'copy_lines'],
    blanks: [
      quoted('append_mode', 'a', '保留旧内容，并从文件末尾加入一行。填带引号的打开模式。'),
      field('tail', '-1', '使用负下标，从行列表的末尾取第一项。'),
      quoted('replace_mode', 'w', '清空旧内容，再写入新坐标。'),
      field('write_method', 'write', '这里只向文件写入一个字符串。'),
      quoted('read_mode', 'r', '写完后重新以只读方式打开。'),
    ],
  },
  {
    id: 'text-and-binary',
    title: '从文字登高，从字节转身',
    shortTitle: '文本与二进制',
    topic: '5.1.1–5.1.2 · 字符与字节',
    description: '文字档案写着航区和高度。二进制指令的第一个字节表示要转几个半圈。',
    challenge: '切换情境，比较两个文件的数据类型和动作。再试试写入和追加字节。',
    concept: '文本模式按编码得到 str。二进制模式返回 bytes，不能传 encoding。用下标从 bytes 取出的是字节的整数值。',
    scenarios: [
      { label: '北岸 · 两个半圈', files: { 'height.txt': '北岸,31\n', 'turn.bin': new Uint8Array([2]) } },
      { label: '南岸 · 一个半圈', files: { 'height.txt': '南岸,8\n', 'turn.bin': new Uint8Array([1]) } },
    ],
    stages: stages('读文字档案', '读字节指令', '写入与追加字节'),
    code: `with open("height.txt", "r", encoding={{encoding}}) as f:
    text = f.read()
zone, height = text.strip().split(",")
commands = [{"action": "altitude", "height": int(height), "speed": 12}]
# @stage
with open("turn.bin", {{binary_read}}) as f:
    packet = f.{{byte_method}}(1)
commands.append({"action": "spin", "turns": packet[0] / 2,
                 "direction": "right", "speed": 200})
print("读取类型：", type(text).__name__, type(packet).__name__)
# @stage
with open("scratch.bin", {{binary_write}}) as f:
    f.write(packet)
with open("scratch.bin", {{binary_append}}) as f:
    f.write(bytes([1]))
with open("scratch.bin", "rb") as f:
    combined = f.read()
commands.append({"action": "spin", "turns": combined[-1] / 2,
                 "direction": "left", "speed": 200})
print("写入再追加：", list(combined))`,
    watch: ['text', 'zone', 'packet', 'combined'],
    blanks: [
      field('encoding', '"utf-8"', '档案是 UTF-8 文本，填对应的编码名字符串。', ["'utf-8'", '"UTF-8"', "'UTF-8'", '"utf8"', "'utf8'"]),
      quoted('binary_read', 'rb', '用读模式，并添加表示二进制的字母。'),
      field('byte_method', 'read', '这里按指定数量读取一个字节。'),
      quoted('binary_write', 'wb', '建立一个要写入的文件，并让它接收 bytes。'),
      quoted('binary_append', 'ab', '保留现有字节，从文件末尾追加一个新字节。'),
    ],
  },
  {
    id: 'read-bounded',
    title: '读几个字符，飞多高？',
    shortTitle: 'read 指定长度',
    topic: '5.1.3 · read(size) 与剩余内容',
    description: '第一行有两位数字。只读一位或读完整两位，会得到不同高度。',
    challenge: '试填 1 和 2，观察首段升降。第二次读取会从哪一个字符开始？',
    concept: '文本模式下 read(n) 最多读 n 个字符，推进读取位置。随后不带参数的 read() 会读入剩余内容。',
    scenarios: [file('heights.txt', '38\n17\n', '高空再下降'), file('heights.txt', '24\n7\n', '低空停靠')],
    stages: stages('读指定字符', '读剩余文本', '手动关闭'),
    code: `f = open("heights.txt", "r", encoding="utf-8")
chunk = f.read({{size}})
commands = [{"action": "altitude", "height": int(chunk), "speed": 13}]
# @stage
rest = f.{{read_rest}}()
tail = rest.{{split_method}}()
commands.append({"action": "altitude", "height": int(tail[-1]), "speed": 13})
# @stage
f.{{manual_close}}()
print("先读到：", repr(chunk), "｜再读到：", repr(rest))`,
    watch: ['chunk', 'rest', 'tail'],
    blanks: [
      field('size', '2', '填整数 1 或 2，分别读第一位或前两位数字。两种方案都可以完成任务。', ['1']),
      field('read_rest', 'read', '调用一次读取剩余全部字符的方法，不传数量。'),
      field('split_method', 'splitlines', '把读到的字符串按换行切成行列表。', ['strip().splitlines']),
      field('manual_close', 'close', '代码没有用上下文管理器，要主动结束文件连接。'),
    ],
  },
  {
    id: 'readline-order',
    title: '一行一个目标，按顺序执行',
    shortTitle: 'readline 顺序',
    topic: '5.1.3 · readline() 连续读取',
    description: '三行日志依次存放训练高度、航点横坐标和纵坐标。',
    challenge: '首段升高或下降后，到哪个坐标停？用第二、第三次读取验证。',
    concept: 'readline() 每次读取下一行，通常包含结尾换行符。连续读取会推进位置。',
    scenarios: [file('route_header.txt', '29\n15\n-19\n', '高空东南航点'), file('route_header.txt', '8\n-16\n16\n', '低空西北航点')],
    stages: stages('读取首行高度', '连续读出三行'),
    code: `with open("route_header.txt", "r", encoding="utf-8") as f:
    height_line = f.{{height_read}}()
commands = [{"action": "altitude", "height": int(height_line), "speed": 12}]
# @stage
# 重新打开，使用同一个文件对象连续读三行。
with open("route_header.txt", "r", encoding="utf-8") as log:
    row1 = log.readline()
    row2 = {{f_handle}}.{{line_read}}()
    row3 = log.readline()
point = (int({{x_line}}), int({{y_line}}))
commands.append({"action": "move", "x": point[0], "y": point[1], "speed": 11})
print("首行高度：", row1.strip(), "｜目标：", point)`,
    watch: ['height_line', 'row1', 'row2', 'row3', 'point'],
    blanks: [
      field('height_read', 'readline', '只取文件的第一行日志。'),
      field('f_handle', 'log', '使用当前 with 语句绑定的文件对象。'),
      field('line_read', 'readline', '继续向后读取一行，而不是读完文件。'),
      field('x_line', 'row2', '文件第二行存的是横坐标。'),
      field('y_line', 'row3', '文件第三行存的是纵坐标。'),
    ],
  },
  {
    id: 'readlines-list',
    title: '翻到最后一行确认目标高度',
    shortTitle: 'readlines 首尾',
    topic: '5.1.3 · readlines() 与列表下标',
    description: '一次读成行列表。首行是入场高度，末行是最后一次飞行采样。',
    challenge: '不管日志中间有几行，都能用相同的写法找到首行和末行。',
    concept: 'readlines() 返回一个列表，每个元素是一行。列表负下标从末尾查找，len() 返回元素数量。',
    scenarios: [file('samples.txt', '41\n27\n15\n', '三行 · 从高处下降'), file('samples.txt', '16\n11\n25\n38\n', '四行 · 从低处爬升')],
    stages: stages('读取行列表', '回放首行', '回放末行'),
    code: `with open("samples.txt", "r", encoding="utf-8") as f:
    rows = f.{{read_lines}}()
commands = []
# @stage
first_line = rows[{{first}}].strip()
commands.append({"action": "altitude", "height": int(first_line), "speed": 12})
# @stage
last_line = rows[{{last}}].{{trim}}()
total = {{count}}(rows)
commands.append({"action": "altitude", "height": int(last_line), "speed": 12})
print("总行数：", total, "｜首行／末行：", first_line, last_line)`,
    watch: ['rows', 'first_line', 'last_line', 'total'],
    blanks: [
      field('read_lines', 'readlines', '把每一行分开保留在同一个列表里。'),
      field('first', '0', '首行的下标是最小的非负整数。'),
      field('last', '-1', '无论有几行，都从列表末尾选择最后一项。'),
      field('trim', 'strip', '去掉行末换行和两端空白。'),
      field('count', 'len', '用内置函数数一数列表元素。'),
    ],
  },
  {
    id: 'eof-check',
    title: '空白行还是读到文件末尾？',
    shortTitle: '读到末尾',
    topic: '5.1.3 · readline() 的 EOF 判定',
    description: '第一行是高度。第二次读取可能是一条空白行，也可能已经读完文件。',
    challenge: '空白行触发半圈自旋，文件读完则返航。切换情境验证两个分支。',
    concept: '读到文件末尾时 readline() 返回空字符串。仅有换行的空白行仍有一个字符，比较前要保留换行。',
    scenarios: [file('check.txt', '21\n\n', '末尾有一条空白行'), file('check.txt', '21\n', '首行之后已读完')],
    stages: stages('读取高度', '查看下一行', '决定是否返航'),
    code: `f = open("check.txt", "r", encoding="utf-8")
height = int(f.{{first_read}}())
commands = [{"action": "altitude", "height": height, "speed": 12}]
# @stage
next_line = f.{{second_read}}()
f.close()
print("下一行：", repr(next_line))
# @stage
at_end = next_line {{equals}} {{empty_text}}
if at_end:
    commands.append({"action": "return", "height": height, "speed": 12})
else:
    commands.append({"action": "spin", "turns": 0.5,
                     "direction": "left", "speed": 180})`,
    watch: ['height', 'next_line', 'at_end'],
    blanks: [
      field('first_read', 'readline', '读取第一行。文件里不一定只有一行。'),
      field('second_read', 'readline', '在同一文件对象上再前进一行。'),
      field('equals', '==', '用关系运算符比较读取结果是否等于目标字符串。'),
      quoted('empty_text', '', '填一个没有字符、也没有空格的字符串。'),
    ],
  },
  {
    id: 'iterate-alarms',
    title: '逐行扫描，决定飞半圈或整圈',
    shortTitle: '逐行读与告警',
    topic: '5.1.3 · 从文件对象迭代',
    description: '逐行扫描并计数，记录每条的高度。有告警时改飞半圈 8 字，没有告警则飞整圈。',
    challenge: '先预测有几条告警，再切换两种日志对比航迹。',
    concept: 'for 可直接遍历文件对象，每次读取一行，不必先把整份文件读成列表。也可以在循环里做计数。',
    scenarios: harbor,
    stages: stages('逐行采集高度', '扫描告警字段'),
    code: `total_count = 0
commands = []
with open("flight_log.txt", "r", encoding="utf-8") as f:
    {{loop}} row {{membership}} {{source}}:
        total_count += 1
        height = int(row.split(",")[4])
        commands.append({"action": "altitude", "height": height, "speed": 14})
# @stage
alarm_count = 0
with open("flight_log.txt", "r", encoding="utf-8") as scan:
    for row in scan:
        if {{marker}} in {{row_name}}:
            alarm_count += 1
loops = 0.5 if alarm_count else 1
commands.append({"action": "figure8", "loops": loops, "scale": 12, "speed": 14})
print("总行数：", total_count, "｜告警行数：", alarm_count)`,
    watch: ['total_count', 'alarm_count', 'loops'],
    blanks: [
      field('loop', 'for', '逐项遍历可迭代对象的语句关键字。'),
      field('membership', 'in', '循环语句用这个词连接循环变量和可迭代对象。'),
      field('source', 'f', '这里直接迭代当前打开的文件对象。'),
      alarm('marker'),
      field('row_name', 'row', '在本轮读取的那一行中查找标记。'),
    ],
  },
  {
    id: 'mission-summary',
    title: '读出飞行摘要，重现整段任务',
    shortTitle: '飞行摘要挑战',
    topic: '综合 · 总行数、告警数、首行与末行',
    description: '读取带时间、航标、位置和告警的日志，按实读数据飞到首末航标，再生成任务摘要。',
    challenge: '对比有告警和无告警的航线，找出决定半圈和整圈 8 字的是哪个统计值。',
    concept: '行列表便于读取首末记录，逐行循环适合计数。用原始记录核对统计结果和飞行指令。',
    scenarios: [...harbor, file('flight_log.txt', '10:20,山口,-19,13,25,OK\n10:21,回廊,19,-6,8,OK\n', '山谷两条记录')],
    stages: stages('读取首个航标', '读取最后航标', '统计并形成摘要'),
    code: `with open("flight_log.txt", {{mode}}, encoding="utf-8") as f:
    lines = f.{{read_list}}()
first = lines[{{first_index}}].strip()
t, zone, x, y, h, status = first.split(",")
commands = [{"action": "altitude", "height": int(h), "speed": 14},
            {"action": "move", "x": int(x), "y": int(y), "speed": 13}]
# @stage
last = lines[{{last_index}}].strip()
t, zone, x, y, h, status = last.split(",")
commands.extend([{"action": "move", "x": int(x), "y": int(y), "speed": 13},
                 {"action": "altitude", "height": int(h), "speed": 14}])
# @stage
alarm_count = 0
with open("flight_log.txt", "r", encoding="utf-8") as report:
    for line in {{scan_source}}:
        if {{alarm_tag}} in line:
            alarm_count += 1
summary = {"总行数": {{count}}(lines), "告警行数": alarm_count,
           "首行": first, "末行": last}
loops = 0.5 if alarm_count else 1
commands.extend([{"action": "figure8", "loops": loops, "scale": 9, "speed": 15},
                 {"action": "orbit", "radius": 7, "laps": 0.5,
                  "direction": "right", "speed": 13},
                 {"action": "return", "height": int(h), "speed": 14}])
print("飞行日志摘要", summary)`,
    watch: ['first', 'last', 'alarm_count', 'summary', 'loops'],
    blanks: [
      quoted('mode', 'r', '对已有的日志进行只读操作。'),
      field('read_list', 'readlines', '需要一个可以分别用下标查首行与末行的行列表。'),
      field('first_index', '0', '从头取第一条记录。'),
      field('last_index', '-1', '不预先计算行数，使用从末尾开始的下标。'),
      field('scan_source', 'report', '遍历刚刚重新打开并绑定的文件对象。'),
      alarm('alarm_tag'),
      field('count', 'len', '求行列表中的元素总数。'),
    ],
  },
];
