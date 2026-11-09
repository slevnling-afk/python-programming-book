// Each step defines its short hint and the Python value to validate at that point.
export const lessons = [
  {
    name: "三种时间表示",
    title: "记录起飞，整理第一张时间卡",
    goal: "把一个时刻表示成时间戳、结构化时间和可读文字。每核对一种表示，就放行一段校准飞行。",
    scenarios: [["起飞时钟校准", {}]],
    steps: {
      clock: ["method", "哪个函数读取当前的 Unix 秒数？", "stamp", "记录起飞时间戳", "type(stamp) is float and abs(stamp - time.time()) < 60"],
      parts: ["method", "把时间戳拆成本地年、月、日、时、分、秒。", "parts", "转换本地结构化时间", "isinstance(parts, time.struct_time) and parts == time.localtime(stamp)"],
      text: ["method", "把结构化时间按给定规则排成文字。", "text", "生成起飞时间文字", "text == time.strftime(fmt, parts)"],
    },
    code: `import time
fmt = "%Y-%m-%d %H:%M:%S"

# 时间戳是一个数字，后面可以直接用它求耗时。
stamp = time.[[clock]]()
print("起飞时间戳：", stamp)
flight.append(("altitude", 18))

# 结构化时间可以单独读出年份、小时等字段。
parts = time.[[parts]](stamp)
print("本地小时：", parts.tm_hour)
flight.append(("move", "P1"))

# 生成方便人阅读的记录，再做半圈方向校准。
text = time.[[text]](fmt, parts)
print("起飞记录：", text)
timeline.append(("起飞", text))
flight.append(("spin", 0.5, "right"))`,
  },
  {
    name: "读懂返航日志",
    title: "从返航文字算出搜索窗口",
    goal: "把返航文字解析回来，求出距起飞的秒数。小于 60 秒飞半圈，达到 60 秒飞整圈，时间已过则直接返航。",
    scenarios: [
      ["35 秒搜索", { start: "2025-12-24 09:00:00", end: "2025-12-24 09:00:35" }],
      ["75 秒搜索", { start: "2025-12-24 09:00:00", end: "2025-12-24 09:01:15" }],
      ["返航时间已过", { start: "2025-12-24 09:00:00", end: "2025-12-24 08:59:55" }],
    ],
    labels: { start: "起飞时间", end: "计划返航时间" },
    steps: {
      parse: ["method", "参数是时间文字和格式规则。需要把文字解析成结构化时间。", "parsed", "解析返航文字", "isinstance(parsed, time.struct_time) and parsed == time.strptime(rth_text, fmt)"],
      render: ["method", "把结构化时间排回原来的格式，做一次来回核对。", "rendered", "比对返航记录", "rendered == rth_text"],
      stamp: ["method", "把本地结构化时间还原成可以相减的秒数。", "seconds", "计算可用搜索秒数", "rth_ts == time.mktime(parsed)"],
    },
    code: `import time
from datetime import datetime
fmt = "%Y-%m-%d %H:%M:%S"
rth_text = params["end"]
start_ts = datetime.fromisoformat(params["start"]).timestamp()

# 先读懂日志中的返航时刻。通过后先升到安全高度。
parsed = time.[[parse]](rth_text, fmt)
print("解析出的小时：", parsed.tm_hour)
flight.append(("altitude", 20))

# 把同一个时刻转回文字，核对记录有没有变化。
rendered = time.[[render]](fmt, parsed)
print("核对记录：", rendered)
flight.append(("move", "P2"))

# 时间戳相减得到秒数，负数代表计划返航时刻已过。
rth_ts = time.[[stamp]](parsed)
seconds = rth_ts - start_ts
print("可用搜索秒数：", seconds)
timeline.extend([("起飞", params["start"]), ("计划返航", rendered)])
if seconds <= 0:
    flight.append(("return", 16))
else:
    flight.append(("figure8", 1 if seconds >= 60 else 0.5))`,
  },
  {
    name: "本地与 UTC",
    title: "校准两套时钟，再还原同一时刻",
    goal: "用同一个时间戳观察本地和 UTC，再用本地结构还原。浏览器运行环境是 UTC 时，两种显示可以相同。",
    scenarios: [
      ["时钟校准 A", { stamp: "1766566800" }],
      ["时钟校准 B", { stamp: "1700000000" }],
    ],
    labels: { stamp: "Unix 时间戳（整数秒）" },
    steps: {
      local: ["method", "选择按 Python 运行环境本地时区转换的函数。", "local", "查看本地结构化时间", "isinstance(local, time.struct_time) and local == time.localtime(stamp)"],
      utc: ["method", "选择按 UTC 转换的函数。", "utc", "查看 UTC 结构化时间", "isinstance(utc, time.struct_time) and utc == time.gmtime(stamp)"],
      back: ["method", "这里要用本地结构还原 Unix 秒数。", "error", "核对还原误差（秒）", "back == stamp"],
    },
    code: `import time
stamp = int(params["stamp"])

# 同一个 Unix 秒数可以按不同的时区显示。
local = time.[[local]](stamp)
print("本地小时：", local.tm_hour)
flight.append(("move", "P1"))

# UTC 不需要套用本地时区。对照两边的小时字段。
utc = time.[[utc]](stamp)
print("UTC 小时：", utc.tm_hour)
flight.append(("move", "P2"))

# 用本地结构还原原始时间戳，再计算两者的误差。
back = time.[[back]](local)
error = abs(back - stamp)
print("还原误差：", error, "秒")
timeline.extend([("本地", time.asctime(local)), ("UTC", time.asctime(utc))])
flight.append(("altitude", 6))`,
  },
  {
    name: "落地时间回执",
    title: "用两种方法打印落地回执",
    goal: "同一个落地时刻，分别用结构化时间和时间戳生成固定格式的英文回执。两条回执一致后放行落地。",
    scenarios: [["停机坪回执", { stamp: "1766566800" }], ["夜间回执", { stamp: "1766599200" }]],
    labels: { stamp: "计划落地时间戳" },
    steps: {
      structured: ["method", "参数是结构化时间，选能快速打印固定英文格式的函数。", "struct_text", "打印结构化时间回执", "struct_text == time.asctime(parts)"],
      timestamp: ["method", "这次直接传入时间戳，输出应与上一条回执一致。", "stamp_text", "核验两条落地回执", "stamp_text == struct_text and stamp_text == time.ctime(landing)"],
    },
    code: `import time
landing = int(params["stamp"])
parts = time.localtime(landing)

# 第一条回执来自结构化时间。确认后先进入低空进近。
struct_text = time.[[structured]](parts)
print("结构回执：", struct_text)
flight.append(("altitude", 6))

# 第二条回执来自时间戳。两条一致才放行返航降落。
stamp_text = time.[[timestamp]](landing)
print("秒数回执：", stamp_text)
timeline.append(("落地记录", stamp_text))
if stamp_text == struct_text:
    flight.append(("return", 6))`,
  },
  {
    name: "日期时间卡",
    title: "用 datetime 读出值班日期和计划时刻",
    goal: "依次读取现在、日期、时间、星期，并把计划时刻改到上午 9 点。星期字段决定值班航点。",
    scenarios: [["值班巡检（使用当前时钟）", {}]],
    steps: {
      now: ["method", "调用常用的类方法读取当前本地日期时间。", "now", "读取当前日期时间", "isinstance(now, datetime) and abs((datetime.now() - now).total_seconds()) < 60"],
      today: ["method", "教材还介绍了另一种读取当前本地日期时间的类方法。", "today", "对照两次当前时间", "isinstance(today, datetime) and abs((today - now).total_seconds()) < 60"],
      date: ["method", "只取年月日，返回日期对象。", "day", "取出日期部分", "day == now.date()"],
      time: ["method", "只取时分秒部分，返回时间对象。", "clock", "取出时刻部分", "clock == now.time()"],
      weekday: ["method", "读取星期编号，教材约定周一从 0 算起。", "weekday", "决定工作日或周末航点", "weekday == now.weekday()"],
      replace: ["method", "保留日期，把小时、分钟、秒替换成指定值。", "planned", "生成当天计划时刻", "planned == now.replace(hour=9, minute=0, second=0, microsecond=0)"],
      iso: ["method", "输出带 T 分隔日期和时间的标准时间文字。", "iso", "写入标准计划时间", 'iso == planned.isoformat(timespec="seconds")'],
    },
    code: `from datetime import datetime

# 先读取当前日期时间，再用教材的另一种写法交叉查看。
now = datetime.[[now]]()
print("当前时间：", now)
flight.append(("altitude", 18))
today = datetime.[[today]]()
print("第二次读取：", today)

# 分别取出日期和时刻，看看同一个对象可以读出哪些信息。
day = now.[[date]]()
print("日期：", day)
clock = now.[[time]]()
print("时刻：", clock)
flight.append(("spin", 0.25, "right"))

# 星期一到星期五走 P3，周末走 P4。
weekday = now.[[weekday]]()
print("星期编号：", weekday)
flight.append(("move", "P3" if weekday < 5 else "P4"))

# 修改的是当天计划时刻，模型会用课堂时间压缩演示。
planned = now.[[replace]](hour=9, minute=0, second=0, microsecond=0)
print("计划时刻：", planned)
iso = planned.[[iso]](timespec="seconds")
timeline.append(("计划巡检", iso))
flight.append(("altitude", 12))`,
  },
  {
    name: "日期格式互转",
    title: "把时刻转换为调度指令",
    goal: "从时间戳得到本地和 UTC 两种 datetime，再读取计划文字。上午飞 P3，下午飞 P4。",
    scenarios: [
      ["上午巡检", { start: "2025-12-24 08:30:00", stamp: "1766566800" }],
      ["下午巡检", { start: "2025-12-24 15:30:00", stamp: "1766566800" }],
    ],
    labels: { start: "计划开始时间", stamp: "参考时间戳" },
    steps: {
      local: ["method", "用时间戳生成本地日期时间对象。", "local", "读取本地参考时间", "local == datetime.fromtimestamp(stamp)"],
      utc: ["method", "按教材的 UTC 写法，从秒数得到 UTC 日期时间。", "utc", "读取 UTC 参考时间", "utc == datetime.fromtimestamp(stamp, timezone.utc).replace(tzinfo=None)"],
      parse: ["method", "给定时间文字和规则，解析出一个日期时间对象。", "parsed", "识别计划时间与航点", "parsed == datetime.strptime(text, fmt)"],
      print: ["method", "只显示时分秒，按给定规则把日期时间转成文字。", "shown", "生成时分秒回执", 'shown == parsed.strftime("%H:%M:%S")'],
    },
    code: `from datetime import datetime, timezone
fmt = "%Y-%m-%d %H:%M:%S"
stamp = int(params["stamp"])
text = params["start"]

# 同一个秒数分别生成本地和 UTC 日期时间。
local = datetime.[[local]](stamp)
print("本地：", local)
flight.append(("move", "P1"))
utc = datetime.[[utc]](stamp)
print("UTC：", utc)
flight.append(("move", "P2"))

# 解析计划时间，直接用小时字段决定巡检航点。
parsed = datetime.[[parse]](text, fmt)
point = "P3" if parsed.hour < 12 else "P4"
print("本次巡检航点：", point)
flight.append(("move", point))

# 打印回执，并降到巡检高度。
shown = parsed.[[print]]("%H:%M:%S")
timeline.append(("计划开始", text))
print("开始时分秒：", shown)
flight.append(("altitude", 14))`,
  },
  {
    name: "到达时间 ETA",
    title: "计算预计到达时间，判断是否跨午夜",
    goal: "用时间间隔推算 ETA，算出耗时，再决定航点和 8 字搜索范围。可以修改分钟和秒数。",
    scenarios: [
      ["白天 · 3 分 40 秒", { start: "2025-12-24 14:00:00", minutes: "3", seconds: "40" }],
      ["跨午夜 · 45 秒", { start: "2025-12-24 23:59:35", minutes: "0", seconds: "45" }],
    ],
    labels: { start: "起飞日期时间", minutes: "飞行分钟", seconds: "额外秒数" },
    steps: {
      interval: ["name", "哪种类型用来表示分钟和秒组成的时间间隔？", "travel", "创建时间间隔", "travel == timedelta(minutes=minutes, seconds=seconds) and 0 < travel.total_seconds() <= 900"],
      eta: ["op", "预计到达是从起飞时刻往后推一个间隔。", "eta", "推算预计到达时间", "eta == start + travel"],
      diff: ["op", "求出从起飞到 ETA 之间相隔多久。", "duration", "求两时刻的时间差", "duration == travel"],
      seconds: ["method", "需要整个间隔的总秒数，不能只取秒字段。", "elapsed", "按总秒数决定搜索圈数", "elapsed == travel.total_seconds()"],
    },
    code: `from datetime import datetime, timedelta
start = datetime.fromisoformat(params["start"])
minutes = int(params["minutes"])
seconds = int(params["seconds"])

# 分钟和秒合成一个间隔。课堂允许 1 到 900 秒。
travel = [[interval]](minutes=minutes, seconds=seconds)
print("飞行间隔：", travel)
flight.append(("altitude", 24))

# 推算 ETA。跨到第二天时，改走夜间航点 P4。
eta = start [[eta]] travel
print("预计到达：", eta)
timeline.extend([("起飞", str(start)), ("预计到达", str(eta))])
flight.append(("move", "P4" if eta.date() != start.date() else "P3"))

# 两个时刻相减得到间隔，先准备转向。
duration = eta [[diff]] start
print("耗时：", duration)
flight.append(("spin", 0.25, "left"))

# 用总秒数判断整圈或半圈。时间够长时，再记录提前 10 秒的通报。
elapsed = duration.[[seconds]]()
print("总秒数：", elapsed)
if elapsed >= 10:
    timeline.insert(1, ("到达前 10 秒", str(eta - timedelta(seconds=10))))
flight.append(("figure8", 1 if elapsed >= 60 else 0.5))`,
  },
  {
    name: "综合时间轴",
    title: "记录起飞、返航和落地，执行完整巡检",
    goal: "用真实起飞打点和可编辑的返航秒数排出任务时间轴。改变返航间隔，看搜索动作和预计落地时刻怎样变化。",
    scenarios: [
      ["短窗口 · 半圈", { after: "35", landing: "12", point: "P2" }],
      ["长窗口 · 整圈", { after: "75", landing: "18", point: "P4" }],
    ],
    labels: { after: "起飞至返航（秒）", landing: "返航至落地（秒）", point: "巡检航点 P1～P4" },
    steps: {
      record: ["method", "为起飞事件读取当前 Unix 秒数。", "takeoff", "记录真实起飞打点", 'type(takeoff) is float and abs(takeoff - time.time()) < 60 and point in ("P1", "P2", "P3", "P4")'],
      plus: ["op", "返航在起飞之后，把等待秒数算进时间戳。", "rth", "按返航窗口执行搜索", "10 <= after <= 90 and 5 <= landing <= 60 and abs(rth - takeoff - after) < 0.001"],
      minus: ["op", "从落地时间戳与起飞时间戳求出总耗时。", "elapsed", "核验任务总耗时", "abs(elapsed - after - landing) < 0.001"],
      restore: ["method", "把落地时间戳转为本地日期时间对象。", "land_dt", "记录计划落地时刻", "land_dt == datetime.fromtimestamp(land)"],
      delta: ["name", "用秒数构造时间间隔，再加到日期时间对象上。", "eta", "复核预计返航时间", "abs((eta - start).total_seconds() - (rth - takeoff)) < 0.001"],
      render: ["method", "按年月日和时分秒的格式写出返航回执。", "shown", "写入回执并放行返航", "shown == eta.strftime(fmt)"],
    },
    code: `import time
from datetime import datetime, timedelta
fmt = "%Y-%m-%d %H:%M:%S"
after = int(params["after"])
landing = int(params["landing"])
point = params["point"].strip().upper()

# 起飞打点使用真实当前时间。随后所有计划时间由它推算。
takeoff = time.[[record]]()
start = datetime.fromtimestamp(takeoff)
timeline.append(("起飞打点", str(start)))
flight.append(("altitude", 26))

# 可用时间达到 60 秒时搜索整圈，否则只飞半圈。
rth = takeoff [[plus]] after
print("搜索窗口：", rth - takeoff, "秒")
flight.extend([("move", point), ("figure8", 1 if rth - takeoff >= 60 else 0.5)])

# 用时间戳相减核对总耗时，通过后下降至进近高度。
land = rth + landing
elapsed = land [[minus]] takeoff
print("总耗时：", elapsed, "秒")
flight.append(("altitude", 14))

# 恢复计划落地时间，记录在时间轴上。
land_dt = datetime.[[restore]](land)
timeline.append(("预计落地", str(land_dt)))
flight.append(("spin", 0.25, "left"))

# 用日期时间和间隔复算返航时刻，再输出地面站回执。
eta = start + [[delta]](seconds=after)
print("复算返航时间：", eta)
shown = eta.[[render]](fmt)
timeline.insert(1, ("预计返航", shown))
flight.append(("return", 14))`,
  },
];
