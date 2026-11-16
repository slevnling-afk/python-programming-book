export const points = {
  "PAD": [0, 0], "GPS": [-17, 15], "POWER": [18, -11],
  "THERMAL": [18, 15], "RADIO": [-18, -11], "SCAN": [4, 17],
  "CHECK-A": [-19, 0], "CHECK-B": [21, 0],
};

const step = (title, kind, hint, code, value, check) => ({
  title, kind, hint, code, value, check,
});

export const lessons = [
  {
    name: "查键与默认值",
    title: "高度回传了吗？",
    goal: "先检查高度字段。字段缺失时，读到备用高度，再飞到卫星数决定的检查点。",
    scenarios: [
      ["遥测完整", { status: { altitude_m: 26, gps_satellites: 12 }, fallback: 7 }],
      ["高度丢包", { status: { gps_satellites: 4 }, fallback: 7 }],
      ["低空复测", { status: { altitude_m: 15, gps_satellites: 9 }, fallback: 5 }],
    ],
    setup: `# 收到的字典字段随情境变化，fallback 是备用高度。
status = @status
fallback = @fallback`,
    steps: [
      step("检查高度键", "member", "字典的成员判断检查键。请选择使“键存在”得到真值的运算符。", `# 有高度字段就进扫描区，缺失就飞到遥测复测点。
has_height = "altitude_m" [[blank]] status
fly("SCAN" if has_height else "RADIO")`, "has_height", "has_height == ('altitude_m' in status)"),
      step("读取高度或备用值", "method", "找一个支持缺失时返回默认值的字典方法。", `# 读取到的数值就是这个步骤的目标高度。
altitude = status.[[blank]]("altitude_m", fallback)
climb(altitude)`, "altitude", "altitude == (status['altitude_m'] if has_height else fallback) and ('altitude_m' in status) == has_height"),
      step("按键读取卫星数", "key", "方括号里填带引号的字段名。回传字典中哪个字段表示卫星数？", `# 卫星数不足时飞去复检，达标时做一圈航向校验。
satellites = status[[[blank]]]
if satellites < 8:
    fly("GPS")
else:
    spin(1)`, "satellites", "satellites == status['gps_satellites']"),
    ],
  },
  {
    name: "读键值对",
    title: "给不同传感器分配高度",
    goal: "同一张参数表可以取标签、取高度，也可以把标签和高度成对读出来。",
    scenarios: [
      ["塔楼巡查", { profile: { GPS: 21, THERMAL: 29, RADIO: 12 } }],
      ["屋顶巡查", { profile: { POWER: 15, RADIO: 23, THERMAL: 10 } }],
    ],
    setup: `# 键表示设备对应的区域，值表示该区域的目标高度。
profile = @profile`,
    steps: [
      step("读取全部键", "method", "这一空只需要区域名，需要字典的哪一种视图？", `# 只按区域名称巡飞。
zones = list(profile.[[blank]]())
for zone in zones:
    fly(zone)`, "zones", "zones == list(profile)"),
      step("读取全部值", "method", "区域名是键，目标高度放在字典的另一列。", `# 原地依次升降到参数表里的高度。
heights = list(profile.[[blank]]())
for height in heights:
    climb(height)`, "heights", "heights == [profile[zone] for zone in profile]"),
      step("成对读取", "method", "找一个能一次取出键和值、供 for 循环解包的字典方法。", `# 飞到每个区域，再升降到该区域自己的高度。
zones_with_height = list(profile.[[blank]]())
for zone, height in zones_with_height:
    fly(zone)
    climb(height)`, "zones_with_height", "zones_with_height == [(zone, profile[zone]) for zone in profile]"),
    ],
  },
  {
    name: "插入与替换",
    title: "修改巡检指令表",
    goal: "先新增高度和转向字段，再用相同的键更新高度。最后把无人机切到新的检查点。",
    scenarios: [
      ["紧急去东侧", { status: { target: "CHECK-A" }, altitude: 19, degrees: 360, revised: 8, target: "CHECK-B" }],
      ["改查无线电", { status: { target: "CHECK-B" }, altitude: 16, degrees: 180, revised: 30, target: "RADIO" }],
    ],
    setup: `status = @status
flight_height = @altitude
turn = @degrees
revised_height = @revised
next_target = @target`,
    steps: [
      step("新增高度键", "key", "给高度加单位后缀 m，使用与遥测高度相同的键名。", `# 补录高度后，模型按这个字段升降。
status[[[blank]]] = flight_height
climb(list(status.values())[-1])`, "status", "status['altitude_m'] == flight_height and len(status) == 2"),
      step("新增航向角键", "key", "转向角的单位是度。下一行会读取这个新字段。", `# 用角度换算自旋圈数。
status[[[blank]]] = turn
spin(list(status.values())[-1] / 360)`, "status", "status['heading_deg'] == turn and len(status) == 3"),
      step("覆盖旧高度", "name", "使用面板提供的修订高度变量。同一个键重新赋值会覆盖原来的值。", `# 高度改变，字典中的键数仍保持不变。
status["altitude_m"] = [[blank]]
climb(status["altitude_m"])`, "status", "status['altitude_m'] == revised_height and len(status) == 3"),
      step("替换目标点", "name", "找到保存下一站的变量名，把它赋给 target 对应的值。", `# 新目标会替换旧目标，模型直接飞向新的目标点。
status["target"] = [[blank]]
fly(status["target"])`, "status", "status['target'] == next_target and len(status) == 3"),
    ],
  },
  {
    name: "移除字典字段",
    title: "读出撤回的最后指令",
    goal: "取出一条指定指令，再取出末尾的一对键和值。任务表清空后回到起降台降落。",
    scenarios: [
      ["撤回西线", { status: { first_target: "GPS", temporary_target: "CHECK-A", final_target: "CHECK-B" } }],
      ["撤回东线", { status: { first_target: "POWER", temporary_target: "THERMAL", final_target: "RADIO" } }],
    ],
    setup: `# 字典保留添加顺序，final_target 是最后插入的键。
status = @status`,
    steps: [
      step("按键取出临时目标", "method", "要删除指定键，并把取出的值交给变量。", `# 飞往被取出的临时航点，做最后一次检查。
point = status.[[blank]]("temporary_target")
fly(point)`, "(point, status)", "'temporary_target' not in status"),
      step("取出最后一对键和值", "method", "这个字典方法无需传键，会一并返回键和值。", `# 取出末尾的键与值，用值定位最后一站。
field, point = status.[[blank]]()
fly(point)`, "(field, point, status)", "field == 'final_target' and len(status) == 1"),
      step("清空字典", "method", "让当前字典变为空字典，同时保留这个变量。", `# 没有剩余任务时回到起降台并落地。
status.[[blank]]()
if not status:
    fly("PAD")
    climb(0)`, "status", "status == {}"),
    ],
  },
  {
    name: "去重与查告警",
    title: "同一告警只处理一次",
    goal: "把回传记录去重，按不同告警数调整高度。再分别测试 GPS 和低电量告警。",
    scenarios: [
      ["GPS 弱、低电量", { packets: ["GPS_WEAK", "LOW_BATT", "GPS_WEAK"] }],
      ["温度重复告警", { packets: ["TEMP_HIGH", "TEMP_HIGH", "TEMP_HIGH"] }],
      ["低电量重复告警", { packets: ["LOW_BATT", "LOW_BATT", "TEMP_HIGH"] }],
    ],
    setup: `# 原始列表可能收到同一设备的多次告警。
packets = @packets`,
    steps: [
      step("将重复记录去重", "constructor", "选择无重复元素的容器，把原始列表交给它。", `# 每个不同的告警为演示高度增加 4 米。
alarms = [[blank]](packets)
climb(8 + 4 * len(alarms))`, "alarms", "type(alarms) is set and alarms == {*packets}"),
      step("检查 GPS 告警", "member", "判断某个告警代码是否在集合里。", `# 有 GPS 告警先做半圈校验；其余情境做整圈。
weak = "GPS_WEAK" [[blank]] alarms
scan(0.5 if weak else 1)`, "weak", "weak == ('GPS_WEAK' in alarms)"),
      step("检查低电量告警", "member", "用成员判断查 LOW_BATT，观察它给出的布尔值。", `# 低电量演示下降并飞向电源站，其他情境前往扫描区。
low = "LOW_BATT" [[blank]] alarms
if low:
    climb(5)
    fly("POWER")
else:
    fly("SCAN")`, "(low, alarms)", "low == ('LOW_BATT' in alarms)"),
    ],
  },
  {
    name: "添加告警",
    title: "接收两批新消息",
    goal: "先添加一个告警，再批量合并。只有新增的不同告警会增加第二批扫描圈数。",
    scenarios: [
      ["收到两类新告警", { initial: ["GPS_WEAK"], first: "LOW_BATT", batch: ["GPS_WEAK", "TEMP_HIGH", "LINK_LOST", "TEMP_HIGH"] }],
      ["收到一类新告警", { initial: ["TEMP_HIGH"], first: "GPS_WEAK", batch: ["TEMP_HIGH", "LOW_BATT", "LOW_BATT"] }],
      ["全部是重复告警", { initial: ["GPS_WEAK"], first: "TEMP_HIGH", batch: ["TEMP_HIGH", "GPS_WEAK", "TEMP_HIGH"] }],
    ],
    setup: `initial_alarms = set(@initial)
alarms = set(initial_alarms)
first = @first
messages = @batch
checkpoint = {"GPS_WEAK": "GPS", "LOW_BATT": "POWER", "TEMP_HIGH": "THERMAL"}`,
    steps: [
      step("添加单个告警", "method", "这个集合方法一次接收一个元素。", `# 把单条消息加入集合，再飞往它对应的设备。
alarms.[[blank]](first)
if first in alarms:
    fly(checkpoint[first])
before = len(alarms)`, "(alarms, before)", "first in alarms and before == 2"),
      step("批量合并并去重", "method", "把整批消息交给一个能逐个并入元素的集合方法。", `# 每新增一种扫描半圈；全是重复消息就悬停。
alarms.[[blank]](messages)
new_count = len(alarms) - before
if new_count:
    scan(new_count / 2)
else:
    hover()`, "(alarms, new_count)", "alarms == {*messages, *initial_alarms, first}"),
    ],
  },
  {
    name: "删除告警",
    title: "复核告警并回收",
    goal: "对比元素可缺失时和已知存在时的删除方式。观察弹出的告警如何决定机体要去哪一站。",
    scenarios: [
      ["未出现过链路告警", { initial: ["LOW_BATT", "GPS_WEAK", "TEMP_HIGH"] }],
      ["已出现链路告警", { initial: ["LOW_BATT", "GPS_WEAK", "TEMP_HIGH", "LINK_LOST"] }],
    ],
    setup: `alarms = set(@initial)
checkpoint = {"GPS_WEAK": "GPS", "TEMP_HIGH": "THERMAL"}`,
    steps: [
      step("安全剔除可缺失的告警", "method", "即使这个元素从未出现，代码也应继续运行。", `# 链路告警已处理或原本就没有，飞往通信复核点。
# 同一条恢复消息可能重复收到，所以连续执行两次。
for _ in range(2):
    alarms.[[blank]]("LINK_LOST")
fly("RADIO")`, "alarms", "'LINK_LOST' not in alarms and len(alarms) == 3"),
      step("删除确认存在的告警", "method", "这里选元素缺失时会抛出异常的方法，用它验证低电量记录曾存在。", `# 重复删除两次：第一次成功，第二次缺失并触发 KeyError。
duplicate_rejected = False
try:
    for _ in range(2):
        alarms.[[blank]]("LOW_BATT")
except KeyError:
    duplicate_rejected = True
    climb(18)`, "(alarms, duplicate_rejected)", "'LOW_BATT' not in alarms and len(alarms) == 2 and duplicate_rejected"),
      step("清空已归档的副本", "method", "只处理归档副本，让飞行中的告警集合保留。", `# 清空归档副本后降到交接高度。
archive = set(alarms)
archive.[[blank]]()
if not archive:
    climb(8)`, "(archive, alarms)", "not archive and len(alarms) == 2"),
      step("弹出一条未安排的告警", "method", "使用不带参数、会取走并返回一个元素的方法。集合不保证会取到哪一项。", `# 直接使用 Python 实际弹出的告警决定目的地。
pending = alarms.[[blank]]()
fly(checkpoint[pending])`, "(pending, alarms)", "pending not in alarms and len(alarms) == 1"),
    ],
  },
  {
    name: "综合试飞",
    title: "夜航结束前，再处置一次",
    goal: "先按状态表调整高度，根据剩余告警扫描，再更新目标并完成返航。更换情境可试飞不同分支。",
    scenarios: [
      ["完整回传 · 有 GPS 告警", { status: { altitude_m: 25, target: "CHECK-B" }, packets: ["GPS_WEAK", "GPS_WEAK", "LOW_BATT"], restored: "GPS_WEAK", home: "CHECK-A" }],
      ["高度缺失 · 双告警", { status: { target: "CHECK-A" }, packets: ["TEMP_HIGH", "LOW_BATT", "TEMP_HIGH"], restored: "LINK_LOST", home: "CHECK-B" }],
    ],
    setup: `status = @status
messages = @packets
restored = @restored
home = @home
alarms = set()`,
    steps: [
      step("读取夜航高度", "method", "找一个能接收备用高度的方法，字段缺失时使用 14 米。", `# 高度来自当前字典，缺失时使用备用高度。
height = status.[[blank]]("altitude_m", 14)
climb(height)`, "height", "height == (status['altitude_m'] if 'altitude_m' in status else 14)"),
      step("批量录入告警", "method", "把消息列表里的每项加入集合，重复项只保留一次。", `# 飞到原定任务点，准备处理实际记录的告警。
alarms.[[blank]](messages)
if alarms:
    fly(status["target"])`, "alarms", "alarms == {*messages}"),
      step("撤销已恢复的告警", "method", "恢复项可能根本没有上报过，删除时让两种情况都能继续。", `# 剩余一种告警扫半圈，两种扫整圈，然后下降。
alarms.[[blank]](restored)
scan(len(alarms) / 2)
climb(6)`, "alarms", "alarms == {*messages} - {restored}"),
      step("将目标替换为返航点", "name", "右边填保存返航点名称的变量。", `# 更新字段后，按新的目标返航并落地。
status["target"] = [[blank]]
fly(status["target"])
climb(0)`, "status", "status['target'] == home"),
    ],
  },
];
