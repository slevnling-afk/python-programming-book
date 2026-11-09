// Each scenario supplies a name and the lines read by Python's input().
export const lessons = [
  {
    name: "键盘输入",
    title: "登记无人机，输入高度和自旋圈数",
    goal: "先读入无人机编号，再把高度转成小数、圈数转成整数。",
    fields: ["无人机编号", "旋转方向 left / right", "计划高度（12～60 m）", "圈数（1～3）"],
    scenarios: [["顺时针校准", ["UAV-07", "right", "32.5", "1"]], ["逆时针校准", ["UAV-19", "left", "22.5", "2"]]],
    hints: {
      read: ["call", "哪个内置函数读取一行键盘输入？这里只填函数名。"],
      height: ["call", "高度可以有小数，选一种能保留小数的数值类型。"],
      turns: ["call", "把圈数转换成整数类型，再交给飞行模拟器。"],
    },
    code: `# 第一行输入是呼号。先去掉两端的空格，再看数据类型。
uav = [[read]]().strip()
print("呼号：", uav, "类型：", type(uav).__name__)
registered = uav.startswith("UAV-")
if registered:
    flight.append(("hold", 1))
# 每读取一次，就从上方输入队列取走一行。
direction = input().strip().lower()
height = [[height]](input())
print("目标高度：", height, "类型：", type(height).__name__)
# 只有数值类型和高度范围都合格，才加入升高指令。
height_ok = registered and type(height) is float and 12 <= height <= 60
if height_ok:
    flight.append(("altitude", height))
# 圈数必须为整数。方向由表单决定，程序检查拼写。
turns = [[turns]](input())
print("自旋圈数：", turns, "类型：", type(turns).__name__)
passed = height_ok and type(turns) is int and 1 <= turns <= 3
passed = passed and direction in ("left", "right")
if passed:
    flight.append(("spin", turns, direction))
else:
    flight.append(("hold", 2))`,
  },
  {
    name: "变量嵌入",
    title: "拼好任务简报，飞往指定航点",
    goal: "把任务号、无人机、飞手和航点填进对应的模板位置。",
    fields: ["任务编号", "无人机编号", "飞手", "目的地 P1～P4"],
    scenarios: [["东区送达", ["MIS-A03", "UAV-07", "Li", "P2"]], ["西区送达", ["MIS-B09", "UAV-19", "Chen", "P4"]]],
    hints: {
      prefix: ["prefix", "哪个单字母前缀会让 Python 求出花括号里的值？"],
      mission: ["name", "这里需要任务编号。回看代码中接收第一行输入的变量。"],
      pilot: ["name", "这个位置显示飞手姓名，找到对应的变量。"],
      waypoint: ["name", "找到接收目的地的变量，让指令跟随表单变化。"],
    },
    code: `# 四次读取的顺序与输入区中的编号一致。
mission_id = input()
uav_id = input()
pilot = input()
waypoint = input().strip()
# 把变量的值插入简报。看看花括号中的名字是否被替换。
badge = [[prefix]]"UAV={uav_id}"
print(badge)
registered = bool(uav_id) and badge == "UAV=" + uav_id
if registered:
    flight.append(("hold", 1))
# 任务编号核对通过后，允许先爬升到巡检高度。
line = f"任务 {[[mission]]} / {uav_id}"
print(line)
listed = registered and bool(mission_id)
listed = listed and line == "任务 " + mission_id + " / " + uav_id
if listed:
    flight.append(("altitude", 24))
# 飞手与航点也要填写正确，地面站才会下发目的地。
brief = f"{line} / 飞手 {[[pilot]]}"
print(brief)
destination = f"{[[waypoint]]}"
print("目的地：", destination)
passed = listed and bool(pilot) and brief == line + " / 飞手 " + pilot
passed = passed and destination == waypoint and waypoint in ("P1", "P2", "P3", "P4")
if passed:
    flight.append(("move", destination))
else:
    flight.append(("hold", 2))`,
  },
  {
    name: "数字精度",
    title: "核对高度简报，完成爬升与下降",
    goal: "先把爬升高度显示为一位小数，再按十进制整数打印电量，最后用两位小数显示下降高度。",
    fields: ["爬升目标（12～60 m）", "电量（0～100）", "下降目标（至少 4 m）"],
    scenarios: [["正常测高", ["38.567", "78", "12.345"]], ["低电量备降", ["29.246", "18", "8.527"]]],
    hints: {
      climb: ["format", "冒号之后填格式说明。这里需要固定一位小数。"],
      battery: ["format", "按十进制整数显示，不要小数部分。"],
      descent: ["format", "沿用固定小数的写法，这次保留两位。"],
    },
    code: `# 先把三行文本转成数值。后面才指定它们的显示格式。
climb = float(input())
battery = int(input())
descent = float(input())
# 冒号后面控制简报的显示精度。无人机使用原始高度。
up = f"{climb:[[climb]]}"
print("爬升目标：", up, "m")
climb_ok = 12 <= climb <= 60 and up.isascii()
climb_ok = climb_ok and up.count(".") == 1 and len(up.split(".")[-1]) == 1
if climb_ok:
    flight.append(("altitude", climb))
# 核验电量。电量充足时飞往 P3，低电量时跳过这个航点。
power = f"{battery:[[battery]]}"
print("电量：", power + "%")
power_ok = 0 <= battery <= 100 and power == str(battery)
if climb_ok and power_ok and battery >= 30:
    flight.append(("move", "P3"))
# 下降高度必须低于爬升高度，并达到简报要求的精度。
down = f"{descent:[[descent]]}"
print("下降目标：", down, "m")
passed = climb_ok and power_ok and 4 <= descent < climb
passed = passed and down.count(".") == 1 and len(down.split(".")[-1]) == 2
if passed:
    if battery < 30:
        print("电量不足，直接下降至备降高度。")
    flight.append(("altitude", descent))`,
  },
  {
    name: "对齐排版",
    title: "排齐两列航点表，取得巡检许可",
    goal: "字段名左对齐，航点右对齐，任务编号居中。竖线标出每列边界。",
    fields: ["任务编号（最多 12 字符）", "目的地 P1～P4"],
    scenarios: [["边界巡检", ["MIS-A03", "P1"]], ["堤岸巡检", ["MIS-RIVER", "P3"]]],
    hints: {
      left: ["format", "让标签靠近左边界，整列宽度为 10。"],
      right: ["format", "让航点贴近右边界，整列宽度为 10。"],
      center: ["format", "让编号两侧的空格尽量均匀，整列宽度为 16。"],
    },
    code: `# 先读取任务编号与目的地，两者仍然是字符串。
mission = input().strip()
waypoint = input().strip()
# 打印竖线作为列边界。字段名通过检查后，先原地转向。
left = f"{'TARGET':[[left]]}"
print("|" + left + "|")
left_ok = len(left) == 10 and left.startswith("TARGET")
if left_ok:
    flight.append(("spin", 0.25, "right"))
# 右列贴边，和左列一起形成一张可核对的航点表。
right = f"{waypoint:[[right]]}"
print("|" + left + "|" + right + "|")
right_ok = len(right) == 10 and right.endswith(waypoint)
if left_ok and right_ok:
    flight.append(("altitude", 26))
# 数一数标题两端的空格。需要补奇数个空格时，两侧可以相差一个。
center = f"{mission:[[center]]}"
print("|" + center + "|")
leading = len(center) - len(center.lstrip())
trailing = len(center) - len(center.rstrip())
center_ok = len(center) == 16 and center.strip() == mission
center_ok = center_ok and 1 <= len(mission) <= 12 and abs(leading - trailing) <= 1
passed = left_ok and right_ok and center_ok and waypoint in ("P1", "P2", "P3", "P4")
if passed:
    flight.append(("move", waypoint))`,
  },
  {
    name: "字符填充",
    title: "制作醒目的检查牌，决定环绕或返航",
    goal: "用符号突出检查标题，再把电量打印成三位宽。低电量会触发返航。",
    fields: ["检查牌（1～12 个英文字母）", "电量（0～100）"],
    scenarios: [["许可环绕", ["CHECK", "76"]], ["低电量返航", ["ALERT", "7"]]],
    hints: {
      title: ["format", "选星号、短横线或等号来填充，把标题放在宽 20 的中间。"],
      zero: ["format", "宽度为 3，整数位数不够时在左边补零。"],
    },
    code: `# 标题是文本，电量转为整数，方便与返航门槛比较。
tag = input().strip()
battery = int(input())
# 核对标题的宽度和两端的填充，再允许无人机起飞。
banner = f"{tag:[[title]]}"
print(banner)
symbol = banner[:1]
left = len(banner) - len(banner.lstrip(symbol))
right = len(banner) - len(banner.rstrip(symbol))
title_ok = tag.isascii() and tag.isalpha() and 1 <= len(tag) <= 12
title_ok = title_ok and len(banner) == 20 and symbol in ("*", "-", "=")
title_ok = title_ok and banner.strip(symbol) == tag and abs(left - right) <= 1
if title_ok:
    flight.append(("altitude", 18))
# 输出时补齐位数，电量变量仍保存原来的整数。
power = f"{battery:[[zero]]}"
print("电量：", power + "%")
passed = title_ok and 0 <= battery <= 100 and power == str(battery).zfill(3)
# 正常电量环绕巡检，低电量按预设高度返航。
if passed:
    if battery >= 30:
        flight.append(("orbit", 10))
    else:
        flight.append(("return", 18))`,
  },
  {
    name: "百分比",
    title: "核验链路质量，选择搜索范围",
    goal: "比较整数百分比和两位小数百分比。搜索范围由原始比例决定。",
    fields: ["链路质量（0～1）"],
    scenarios: [["良好链路 · 整圈", ["0.8632"]], ["临界链路 · 半圈", ["0.799"]], ["弱链路 · 返航", ["0.42"]]],
    hints: {
      whole: ["format", "选自动换算百分比的格式，输出不要小数位。"],
      detail: ["format", "仍然使用百分比格式，这次让小数点后保留两位。"],
    },
    code: `# 链路质量是 0 到 1 的比例，先保存原始小数。
link = float(input())
# 先打印整百分比，用于地面站快速浏览。
whole = f"{link:[[whole]]}"
print("整数读数：", whole)
whole_ok = 0 <= link <= 1 and whole.endswith("%") and whole[:-1].isascii()
whole_ok = whole_ok and whole[:-1].isdigit()
whole_ok = whole_ok and abs(int(whole[:-1]) - link * 100) <= 0.500001
if whole_ok:
    flight.append(("hold", 1))
# 再打印更精确的读数，观察它和整百分比有什么差别。
detail = f"{link:[[detail]]}"
print("精确读数：", detail)
print("原始比例：", link)
number = detail.removesuffix("%")
integer, dot, fraction = number.partition(".")
detail_ok = detail.endswith("%") and dot and len(fraction) == 2
detail_ok = detail_ok and integer.isascii() and fraction.isascii()
detail_ok = detail_ok and integer.isdigit() and fraction.isdigit()
passed = whole_ok and bool(detail_ok) and abs(float(number) - link * 100) <= 0.005001
# 分支看原始小数。临界值可能显示成 80%，但仍低于门槛。
if passed:
    if link >= 0.8:
        flight.append(("figure8", 1))
    elif link >= 0.55:
        flight.append(("figure8", 0.5))
    else:
        flight.append(("return", 18))`,
  },
  {
    name: "综合调度",
    title: "提交一份完整简报，调度无人机巡检",
    goal: "读入呼号、电量、高度和链路。简报逐项通过后，飞往航点，再按实测链路决定搜索或返航。",
    fields: ["无人机编号", "电量（0～100）", "高度（12～60 m）", "链路质量（0～1）", "目的地 P1～P4"],
    scenarios: [
      ["日常巡检", ["UAV-07", "72", "32.5", "0.88", "P3"]],
      ["临界链路", ["UAV-19", "55", "22.5", "0.79", "P4"]],
      ["低电量", ["UAV-08", "18", "26.5", "0.9", "P1"]],
    ],
    hints: {
      read: ["call", "读取首行文本，保留无人机编号。"],
      battery: ["call", "把电量文本转换成十进制整数。"],
      altitude: ["call", "计划高度可以带小数，数值类型应能保留它。"],
      callsign: ["name", "花括号中使用保存无人机编号的变量。"],
      align: ["format", "把呼号放在宽 12 的列内，文字贴左。"],
      zero: ["format", "电量栏要有三位，不足时在左侧补零。"],
      height: ["format", "高度以固定一位小数显示。"],
      signal: ["format", "显示百分比，保留一位小数。"],
    },
    code: `# 第一步，按输入区的顺序读入任务参数。
uav = [[read]]().strip()
print("已读取呼号：", uav)
battery = [[battery]](input())
print("已读取电量：", battery)
height = [[altitude]](input())
print("已读取高度：", height)
link = float(input())
point = input().strip()
# 第二步，把呼号放入简报，再核对列宽和对齐。
callsign = f"{[[callsign]]}"
column = f"{callsign:[[align]]}"
print("|" + column + "|")
ready = uav.startswith("UAV-") and callsign == uav
ready = ready and len(column) == 12 and column.startswith(uav)
if ready:
    flight.append(("hold", 1))
# 第三步，统一电量和高度的显示，核验原始数值范围。
power = f"{battery:[[zero]]}"
height_text = f"{height:[[height]]}"
print("电量：", power + "%", " 高度：", height_text, "m")
power_ok = type(battery) is int and 0 <= battery <= 100 and power == str(battery).zfill(3)
height_ok = type(height) is float and 12 <= height <= 60
height_ok = height_ok and height_text.count(".") == 1 and len(height_text.split(".")[-1]) == 1
if ready and power_ok and height_ok and battery >= 30:
    flight.append(("altitude", height))
# 第四步，显示链路读数，再用实际链路和电量决定动作。
quality = f"{link:[[signal]]}"
print("链路：", quality, " 航点：", point)
whole, dot, decimal = quality.removesuffix("%").partition(".")
link_ok = 0 <= link <= 1 and quality.endswith("%") and dot and len(decimal) == 1
link_ok = link_ok and whole.isascii() and decimal.isascii() and whole.isdigit() and decimal.isdigit()
link_ok = link_ok and abs(float(whole + dot + decimal) - link * 100) <= 0.050001
passed = bool(ready and power_ok and height_ok and link_ok and point in ("P1", "P2", "P3", "P4"))
if passed:
    if battery < 30 or link < 0.55:
        flight.append(("return", 18))
    else:
        flight.append(("move", point))
        flight.append(("figure8", 1 if link >= 0.8 else 0.5))
        flight.append(("altitude", 10))`,
  },
];
