// Module 5, Project 2. Each boundary follows a complete Python statement.
const file = (name, data, label) => ({ label, files: { [name]: data } });
const field = (id, answer, hint, accepted) => ({ id, answer, hint, ...(accepted ? { accepted } : {}) });
const quoted = (id, value, hint, extra = []) => field(id, '"' + value + '"', hint, ["'" + value + "'", ...extra]);
const numeric = (id, answer, min, max, hint, integer = false) => ({
  id, answer: String(answer), hint, numeric: [min, max], ...(integer ? { integer: true } : {}),
});
const stages = (...labels) => labels.map(label => ({ label }));
const utf8 = text => new TextEncoder().encode(text);
const bytes = (...values) => new Uint8Array(values);

export const lessons = [
  {
    id: 'utf8-brief',
    title: '读懂中文简报，找到飞行高度',
    shortTitle: 'UTF-8 简报',
    topic: '5.2.1 · 显式指定文本编码',
    description: '两份简报用相同的编码保存了不同的首段高度。读出简报后，模型飞到记录中的目标位置。',
    challenge: '切换高空和低空情境，预测同一段代码会让飞机升高还是降低。',
    concept: '编码决定字节如何变成字符。读写同一份中文简报时，要使用一致的编码。',
    scenarios: [
      file('brief.txt', '北桥,34,8\n', '北桥高空巡检'),
      file('brief.txt', '河湾,6,22\n', '河湾低空巡检'),
    ],
    stages: stages('按编码读取', '写入副本再读回'),
    code: String.raw`with open("brief.txt", "r", encoding={{read_codec}}) as f:
    brief = f.read()
area, high, low = brief.strip().split(",")
commands = [{"action": "altitude", "height": int(high), "speed": 13}]
print("简报区域：", area, "首段高度：", high)
# @stage
with open("report_copy.txt", {{write_mode}}, encoding={{write_codec}}) as f:
    f.{{write_text}}(brief)
with open("report_copy.txt", "r", encoding="utf-8") as f:
    copy = f.read()
if copy == brief:
    commands.append({"action": "altitude", "height": int(low), "speed": 13})
print("副本一致：", copy == brief)`,
    watch: ['brief', 'copy'],
    blanks: [
      quoted('read_codec', 'utf-8', '文件是跨平台常用的 UTF-8 文本。填写带引号的编码名。', ['"UTF-8"', "'UTF-8'"]),
      quoted('write_mode', 'w', '创建或覆盖一份纯文本副本。'),
      quoted('write_codec', 'utf-8', '副本稍后会用 UTF-8 读回，保存时也用同一编码。', ['"UTF-8"', "'UTF-8'"]),
      field('write_text', 'write', '向文件写入一个字符串。'),
    ],
  },
  {
    id: 'gbk-transcode',
    title: '从旧设备日志转出新航线',
    shortTitle: 'GBK 转码',
    topic: '5.2.1 · GBK、编码不匹配与异常处理',
    description: '旧设备用 GBK 存了中文地名和坐标。先按原编码读到航点，再另存为 UTF-8。',
    challenge: '用 UTF-8 读取同一份旧文件会发生什么？观察捕获异常后，验证过的新副本能否触发半圈绕检。',
    concept: '转码先用原编码得到 str，再用目标编码写出。捕获解码失败可以让程序继续完成可用的操作。',
    scenarios: [
      file('legacy.txt', bytes(206, 247, 176, 182, 44, 45, 49, 55, 44, 49, 52, 10), '旧设备：西岸'),
      file('legacy.txt', bytes(182, 171, 176, 182, 44, 50, 49, 44, 45, 49, 50, 10), '旧设备：东岸'),
    ],
    stages: stages('读取旧航点', '捕获不匹配', '转码后复检'),
    code: String.raw`with open("legacy.txt", "r", encoding={{legacy_codec}}) as f:
    original = f.read()
area, x, y = original.strip().split(",")
commands = [{"action": "move", "x": int(x), "y": int(y), "speed": 14}]
# @stage
try:
    with open("legacy.txt", "r", encoding="utf-8") as f:
        f.read()
    mismatch = False
except {{decode_error}}:
    mismatch = True
print("用 UTF-8 读旧文件失败：", mismatch)
# @stage
with open("transcoded.txt", "w", encoding={{target_codec}}) as f:
    f.{{save_text}}(original)
with open("transcoded.txt", "r", encoding="utf-8") as f:
    verified = (f.read() == original)
if verified:
    commands.append({"action": "orbit", "radius": 7, "laps": 0.5,
                     "direction": "left", "speed": 12})
print("转码内容一致：", verified)`,
    watch: ['original', 'mismatch', 'verified'],
    blanks: [
      quoted('legacy_codec', 'gbk', '选择表中兼容旧设备中文日志的编码。', ['"GBK"', "'GBK'"]),
      field('decode_error', 'UnicodeDecodeError', '文件包含无法按所选编码解释的字节。填 Python 的解码异常类型。'),
      quoted('target_codec', 'utf-8', '输出新文件的编码应与它后续的读取编码一致。', ['"UTF-8"', "'UTF-8'"]),
      field('save_text', 'write', '保存一份完整字符串。'),
    ],
  },
  {
    id: 'bom-header',
    title: '识别文件头，选择正确的 8 字路线',
    shortTitle: 'BOM 与文件头',
    topic: '5.2.1 · 扩展：UTF-8 BOM',
    description: '日志开头可能带有 UTF-8 签名。文件头标记有效后，字段里的圈数才能进入飞行指令。',
    challenge: '切换带签名和不带签名的日志，比较普通读取与去签名读取的表头结果。',
    concept: '用普通 UTF-8 读取带签名的文件时，开头可能保留一个不可见字符。utf-8-sig 会跳过开头的 UTF-8 签名，也可读取没有签名的 UTF-8。',
    scenarios: [
      file('pattern.txt', utf8('\uFEFF航线,0.5\n'), '带签名：半圈'),
      file('pattern.txt', utf8('航线,1\n'), '无签名：整圈'),
    ],
    stages: stages('查看普通读取结果', '去掉签名并回放'),
    code: String.raw`with open("pattern.txt", "r", encoding="utf-8") as f:
    before = f.{{read_text}}()
ordinary_header = before.startswith("航线,")
commands = [{"action": "spin", "turns": 0.5, "direction":
             "right" if ordinary_header else "left", "speed": 180}]
print("普通读取：", repr(before))
# @stage
with open("pattern.txt", "r", encoding={{bom_codec}}) as f:
    after = f.read()
header, value = after.strip().split(",")
if header == "航线":
    loops = {{as_number}}(value)
    commands.append({"action": "figure8", "loops": loops, "scale": 11, "speed": 14})
print("去签名读取：", repr(after))`,
    watch: ['before', 'ordinary_header', 'after', 'loops'],
    blanks: [
      field('read_text', 'read', '这里需要读出整个文件的剩余内容。'),
      quoted('bom_codec', 'utf-8-sig', '选择带签名处理的 UTF-8 编解码器，填写完整编码名。', ['"UTF-8-SIG"', "'UTF-8-SIG'"]),
      field('as_number', 'float', '圈数可能是 0.5，需要转换成浮点数。'),
    ],
  },
  {
    id: 'text-pointer',
    title: '记录读到哪，再回到第一条',
    shortTitle: 'tell 与回读',
    topic: '5.2.2 · 文本流的 tell、seek 与 read',
    description: '第一行的中文标记后面是两位数字。读前三个字符就能得到首段高度，也能比较读取前后的文件位置。',
    challenge: '回到文件开头再读整行，然后读第二行。对照操作记录，找出位置回到零的时刻。',
    concept: 'read(n) 在文本流中按字符读取。tell 返回可供 seek 使用的位置值，不应把一般文本流的位置当作字符下标。seek(0) 可回到开头。',
    scenarios: [
      file('altitudes.txt', '高36\n低9\n', '36 m → 9 m'),
      file('altitudes.txt', '高24\n低6\n', '24 m → 6 m'),
    ],
    stages: stages('记录位置并读取首段', '回到文件开头', '读取下一条高度'),
    code: String.raw`with open("altitudes.txt", "r", encoding="utf-8") as f:
    start = f.{{initial_pos}}()
    prefix = f.{{partial_read}}(3)
    after_read = f.tell()
commands = [{"action": "altitude", "height": int(prefix[1:]), "speed": 13}]
print("读前与读后位置：", start, after_read, "字符数：", len(prefix))
# @stage
with open("altitudes.txt", "r", encoding="utf-8") as f:
    f.read(3)
    f.{{rewind}}({{origin}})
    rewound = f.tell()
    first = f.readline().strip()
print("回读首行：", first, "重置后位置：", rewound)
# @stage
with open("altitudes.txt", "r", encoding="utf-8") as f:
    f.readline()
    second = f.{{next_line}}().strip()
commands.append({"action": "altitude", "height": int(second[1:]), "speed": 13})`,
    watch: ['start', 'after_read', 'prefix', 'rewound', 'first', 'second'],
    blanks: [
      field('initial_pos', 'tell', '返回当前位置的方法，不移动读写位置。'),
      field('partial_read', 'read', '从当前位置取指定数量的字符。'),
      field('rewind', 'seek', '把文件位置移动到指定位置。'),
      field('origin', '0', '从文件起点开始计数，开头的位置是几？'),
      field('next_line', 'readline', '取下一条完整的文本行。'),
    ],
  },
  {
    id: 'binary-pointer',
    title: '跳到不同字节，改变自旋圈数',
    shortTitle: '二进制定位',
    topic: '5.2.2 · 二进制偏移量与文件末尾',
    description: '三个字节分别给出三条自旋指令。用偏移量选择一个字节，飞行模型按其中记录的圈数自旋。',
    challenge: '把偏移量分别改成 0、1、2，比较取出的数值和圈数。再从末尾回退一个字节，读出末条动作。',
    concept: '二进制流中的偏移量按字节计算。seek(n) 默认从文件开头定位，seek(-1, 2) 从末尾回退一个字节。',
    scenarios: [
      file('turns.bin', bytes(1, 2, 3), '逐步加圈'),
      file('turns.bin', bytes(3, 1, 2), '交错圈数'),
    ],
    stages: stages('按偏移读取指令', '从末尾反查'),
    code: String.raw`with open("turns.bin", "rb") as f:
    f.{{jump}}({{offset}})
    selected_pos = f.tell()
    payload = f.read(1)
turns = payload[0] / 2
commands = [{"action": "spin", "turns": turns, "direction": "right", "speed": 180}]
print("选中位置：", selected_pos, "右旋圈数：", turns)
# @stage
with open("turns.bin", "rb") as f:
    f.seek({{back_one}}, {{end_origin}})
    tail_pos = f.{{position}}()
    tail = f.read(1)
commands.append({"action": "spin", "turns": tail[0] / 2,
                 "direction": "left", "speed": 180})
print("末条指令位置：", tail_pos)`,
    watch: ['selected_pos', 'payload', 'turns', 'tail_pos', 'tail'],
    blanks: [
      field('jump', 'seek', '使用定位方法，把指针移到给定偏移。'),
      numeric('offset', 1, 0, 2, '选第 1、2 或 3 个字节，填写整数偏移 0、1 或 2。', true),
      field('back_one', '-1', '从末尾位置回退一格。'),
      field('end_origin', '2', 'seek 的第二个参数：0 以开头为基准，1 以当前位置为基准，哪一个表示以末尾为基准？'),
      field('position', 'tell', '查看反查后的字节位置。'),
    ],
  },
  {
    id: 'text-route',
    title: '重写巡检路线，再追加两段',
    shortTitle: 'write 与 writelines',
    topic: '5.2.3 · 文本覆盖、追加和换行',
    description: '待改写的日志有一条旧坐标。先写入新的首个航点，再把两条复查记录追加到末尾。',
    challenge: '试试修改首站 X 坐标，观察航迹。追加后读取整个文件，数一数有几个完整航点。',
    concept: 'w 打开时清空旧内容，a 从末尾写入。writelines 不会自动插入换行，要在每条记录里保存换行符。',
    scenarios: [
      file('route.txt', '-30,-20\n', '旧线：西南'),
      file('route.txt', '27,22\n', '旧线：东北'),
    ],
    stages: stages('覆盖旧坐标', '批量追加航点', '读回核对路线'),
    code: String.raw`first_x = {{first_x}}
with open("route.txt", {{replace_mode}}, encoding="utf-8") as f:
    f.write(f"{first_x},-10\n")
with open("route.txt", "r", encoding="utf-8") as f:
    x, y = map(float, f.readline().strip().split(","))
commands = [{"action": "move", "x": x, "y": y, "speed": 14}]
# @stage
with open("route.txt", {{append_mode}}, encoding="utf-8") as f:
    f.{{write_lines}}(["-5,16\n", "21,11\n"])
with open("route.txt", "r", encoding="utf-8") as f:
    pending = f.readlines()[1:]
points = [tuple(map(float, row.strip().split(","))) for row in pending]
commands.append({"action": "route", "points": points, "speed": 14})
# @stage
with open("route.txt", {{verify_mode}}, encoding="utf-8") as f:
    verified = f.read()
print("改写后的路线：\n" + verified)`,
    watch: ['x', 'y', 'points', 'verified'],
    blanks: [
      numeric('first_x', -16, -25, 25, '决定新首站的横坐标，-25 到 25 都可用于比较。'),
      quoted('replace_mode', 'w', '打开时清空旧航线，并写入新文件内容。'),
      quoted('append_mode', 'a', '保留首站，将复查记录写在末尾。'),
      field('write_lines', 'writelines', '把一组字符串直接写入文件，列表元素已经带换行。'),
      quoted('verify_mode', 'r', '只查看写好的文件。'),
    ],
  },
  {
    id: 'blackbox-write',
    title: '把两段高度封进黑匣子',
    shortTitle: 'encode 与二进制写',
    topic: '5.2.4 · encode、wb 与 ab',
    description: '把中文高度记录编码成字节。黑匣子写入一段再追加一段，读回后依次回放。',
    challenge: '改动首段高度，检查黑匣子文件的写入字节数和回放队列。',
    concept: 'encode 把 str 变成 bytes，二进制文件需要 bytes。wb 创建或覆盖，ab 从末尾追加原始字节。',
    scenarios: [
      file('blackbox.bin', utf8('高度,2\n'), '已有旧备份'),
      file('blackbox.bin', utf8('高度,3\n'), '另一份旧备份'),
    ],
    stages: stages('建立首段备份', '追加第二段', '确认字节数'),
    code: String.raw`high = {{high}}
record = f"高度,{high}\n".{{encode_text}}("utf-8")
with open("blackbox.bin", {{binary_new}}) as f:
    bytes_written = f.write(record)
with open("blackbox.bin", "rb") as f:
    value = f.readline().decode("utf-8").strip().split(",")[1]
commands = [{"action": "altitude", "height": int(value), "speed": 13}]
# @stage
with open("blackbox.bin", {{binary_more}}) as f:
    added = f.write("高度,8\n".encode("utf-8"))
with open("blackbox.bin", "rb") as f:
    second = f.readlines()[1].decode("utf-8").strip().split(",")[1]
commands.append({"action": "altitude", "height": int(second), "speed": 13})
# @stage
with open("blackbox.bin", "rb") as f:
    raw = f.read()
same_size = {{measure}}(raw) == bytes_written + added
print("黑匣子总字节数正确：", same_size)`,
    watch: ['record', 'bytes_written', 'added', 'raw', 'same_size'],
    blanks: [
      numeric('high', 32, 14, 55, '填 14 到 55 的整数高度，第二段固定在 8 米。', true),
      field('encode_text', 'encode', '先把字符串变为可写入二进制文件的 bytes。'),
      quoted('binary_new', 'wb', '覆盖旧黑匣子并写入字节。'),
      quoted('binary_more', 'ab', '保持首段字节，在末尾添加第二段。'),
      field('measure', 'len', '取整个 bytes 对象的长度。'),
    ],
  },
  {
    id: 'blackbox-read',
    title: '从字节还原飞行坐标与方向',
    shortTitle: 'rb 与 decode',
    topic: '5.2.5 · 读回 bytes 并解码',
    description: '备份第一行有中文地名和坐标，第二行只有飞行方向。先解出首行，再决定向哪一侧自旋。',
    challenge: '切换备份，检查相同代码是否同时改变航点和自旋方向。',
    concept: 'rb 返回 bytes；用与写入时一致的 decode 才能恢复原来的 str。',
    scenarios: [
      file('coords.bin', utf8('塔东,20,12\nleft\n'), '塔东 · 左转'),
      file('coords.bin', utf8('塔西,-19,-10\nright\n'), '塔西 · 右转'),
    ],
    stages: stages('读取并解码首条', '读取下一条动作'),
    code: String.raw`with open("coords.bin", {{raw_mode}}) as f:
    packet = f.readline()
line = packet.{{decode_text}}("utf-8")
place, x, y = line.strip().split(",")
commands = [{"action": "move", "x": int(x), "y": int(y), "speed": 14}]
print("恢复地点：", place)
# @stage
with open("coords.bin", "rb") as f:
    f.readline()
    turn_packet = f.{{next_record}}()
direction = turn_packet.decode({{right_codec}}).strip()
commands.append({"action": "spin", "turns": 0.5, "direction": direction, "speed": 180})
print("恢复方向：", direction)`,
    watch: ['packet', 'line', 'direction'],
    blanks: [
      quoted('raw_mode', 'rb', '读取字节，不先让 open 将它解码为文本。'),
      field('decode_text', 'decode', '把已读出的 bytes 变回 str。'),
      field('next_record', 'readline', '只取下一条动作记录，保留读取的边界。'),
      quoted('right_codec', 'utf-8', '用备份原先的编码解码第二行。', ['"UTF-8"', "'UTF-8'"]),
    ],
  },
  {
    id: 'recovery-gate',
    title: '备份通过核验才绕点巡检',
    shortTitle: '备份核验分流',
    topic: '5.2.5 · 解码、异常与一致性验证',
    description: '实际读取字节并解码。通过内容核验时才执行环绕。可读但内容错误，或遇到损坏字节时，都触发模拟返航。',
    challenge: '在三份备份间切换，分别判断“解码成功”和“与原始内容一致”是否成立。',
    concept: 'decode 成功只说明字节能按规则解释。内容是否恢复正确，仍需与预期文本对照。',
    scenarios: [
      file('backup.bin', utf8('巡检,17,13\n'), '原样备份'),
      file('backup.bin', utf8('巡检,19,13\n'), '内容不一致'),
      file('backup.bin', bytes(255, 97, 10), '字节已损坏'),
    ],
    stages: stages('读取并尝试恢复', '核验后决定航线'),
    code: String.raw`expected = "巡检,17,13\n"
with open("backup.bin", "rb") as f:
    raw = f.{{read_backup}}()
try:
    restored = raw.decode({{restore_codec}})
except UnicodeDecodeError:
    restored = None
commands = [{"action": "spin", "turns": 0.5, "direction":
             "right" if restored is not None else "left", "speed": 180}]
print("解码成功：", restored is not None)
# @stage
same = restored {{compare}} {{expected_value}}
if same:
    _, x, y = restored.strip().split(",")
    commands.append({"action": "move", "x": int(x), "y": int(y), "speed": 14})
    commands.append({"action": "orbit", "radius": 7, "laps": 1,
                     "direction": "right", "speed": 13})
else:
    commands.append({"action": "return", "height": 12, "speed": 13})
print("内容核验：", same)`,
    watch: ['raw', 'restored', 'same'],
    blanks: [
      field('read_backup', 'read', '完整读取这份短小的黑匣子备份。'),
      quoted('restore_codec', 'utf-8', '备份保存时约定用 UTF-8。用同一编码尝试还原。', ['"UTF-8"', "'UTF-8'"]),
      field('compare', '==', '检查两份内容是否相等，结果应为布尔值。'),
      field('expected_value', 'expected', '右边要与原始简报字符串比较，找到它的变量名。'),
    ],
  },
  {
    id: 'complete-blackbox',
    title: '完整演练：从现场日志到恢复飞行',
    shortTitle: '黑匣子接力',
    topic: '5.2 · 转码、定位、备份和读回',
    description: '先读取中文航点，再把任务简报保存为二进制。通过恢复校验后，根据告警字段完成 8 字巡检与返航。',
    challenge: '平稳日志和有告警的日志将飞不同圈数。用同一份代码运行两次，对照你的预测。',
    concept: '用约定编码读取并编码，再按相同编码读回验证。用文件指针回读时，要在正确的字节位置开始。',
    scenarios: [
      file('mission.txt', '巡检,12,16,32,0\n', '巡检正常'),
      file('mission.txt', '告警,-19,11,17,1\n', '电量告警'),
    ],
    stages: stages('读取航点并前往', '建立备份并回读', '核验后完成路线'),
    code: String.raw`with open("mission.txt", "r", encoding={{mission_codec}}) as f:
    origin = f.readline()
_, x, y, height, alert = origin.strip().split(",")
commands = [{"action": "move", "x": int(x), "y": int(y), "speed": 15}]
# @stage
packet = origin.{{pack}}("utf-8")
with open("final.bin", {{create}}) as f:
    f.write(packet)
with open("final.bin", {{restore_mode}}) as f:
    f.read(3)
    f.{{reset_pointer}}(0)
    backup = f.{{read_restore}}()
decoded = backup.decode("utf-8")
_, _, _, restored_height, _ = decoded.strip().split(",")
commands.append({"action": "altitude", "height": int(restored_height), "speed": 13})
# @stage
verified = decoded {{matches}} origin
if verified:
    _, _, _, _, alarm_code = decoded.strip().split(",")
    loops = 0.5 if alarm_code == "1" else 1
    commands.append({"action": "figure8", "loops": loops, "scale": 13, "speed": 14})
commands.append({"action": "return", "height": 10, "speed": 14})
print("原简报与备份一致：", verified)`,
    watch: ['origin', 'packet', 'backup', 'decoded', 'verified', 'loops'],
    blanks: [
      quoted('mission_codec', 'utf-8', '文件包含中文，使用与日志保存时一致的编码。', ['"UTF-8"', "'UTF-8'"]),
      field('pack', 'encode', '把需要备份的文本转为 UTF-8 字节。'),
      quoted('create', 'wb', '创建或覆盖备份文件，并写入字节。'),
      quoted('restore_mode', 'rb', '读取备份文件中的原始字节。'),
      field('reset_pointer', 'seek', '将位置移回首字节，再完整读取备份。'),
      field('read_restore', 'read', '从重置后的位置读取全部剩余字节。'),
      field('matches', '==', '验证恢复的简报内容与源简报一致。'),
    ],
  },
];
