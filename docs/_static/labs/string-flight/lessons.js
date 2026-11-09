// Each mission executes its template as Python. Flight tuples are simulator commands.
function expandTabs(text, width) {
  return text.split("\t").reduce((line, part, index) => {
    const padding = index === 0 ? "" : " ".repeat(width - line.length % width);
    return line + padding + part;
  }, "");
}

export const lessons = [
  {
    title: "从日志识别返航指令",
    label: "运算符",
    concepts: "拼接 · 重复 · 包含判断",
    brief: "拼出呼号，重复扫描口令，再用包含判断决定自旋扫描还是返航。",
    scenarios: [
      ["常规扫描", { tail: "07", note: "note: Patrol-Ready" }],
      ["低电量返航", { tail: "19", note: "note: Return-Home if battery<30%" }],
    ],
    blanks: {
      plus: ["op", "用哪个运算符拼接两段字符串？"],
      times: ["op", "用哪个运算符把字符串重复多次？"],
      count: ["int", "填一个 1 到 3 的整数，重复次数就是自旋圈数。"],
      contains: ["op", "哪个运算符可以判断子串是否存在？"],
    },
    targets: (_, index) => ({
      callsign: ["UAV-07", "UAV-19"][index],
      pulses: value => typeof value === "string" && /^(SCAN ){1,3}$/.test(value),
      has_rth: index === 1,
    }),
    code: `callsign = "UAV-" {{plus}} tail
pulses = "SCAN " {{times}} {{count}}
has_rth = "Return-Home" {{contains}} note
report = [("呼号", callsign), ("扫描口令", repr(pulses)),
          ("是否含返航指令", has_rth)]
if has_rth:
    flight = [("return", 22)]
else:
    flight = [("spin", len(pulses.split()), "right")]`,
  },
  {
    title: "把四行日志拆成飞行计划",
    label: "分割",
    concepts: "拆行 · 拆字段 · 从右侧取值",
    brief: "先拆行，再拆航点和高度。末尾字段有多个分隔符，观察从右切的结果。",
    scenarios: [
      ["东区巡检", { raw: "MIS-A03 | UAV-07 | pilot=Li\nwaypoints:P1,P2\nnote=target=P3\nheight:agl:34" }],
      ["西区巡检", { raw: "MIS-B09 | UAV-07 | pilot=Li\nwaypoints:P4,P3\nnote=target=P2\nheight:agl:18" }],
    ],
    blanks: {
      lines: ["method", "哪个方法按换行拆成多行？"],
      field: ["method", "哪个方法按竖线分割整行？"],
      once: ["method", "从左切一次，得到左边、分隔符、右边三段。"],
      waypoints: ["method", "把逗号分隔的航点拆成列表。"],
      from_right: ["method", "从最右边的等号切一次，返回三段。"],
      height: ["method", "从最右边的冒号只拆一次，返回列表。"],
    },
    targets: (_, index) => [
      { mission: "MIS-A03", waypoints: ["P1", "P2"], target: "P3", height: 34 },
      { mission: "MIS-B09", waypoints: ["P4", "P3"], target: "P2", height: 18 },
    ][index],
    code: `lines = raw.{{lines}}()
mission = lines[0].{{field}}("|")[0].strip()
_, _, csv = lines[1].{{once}}(":")
waypoints = csv.{{waypoints}}(",")
_, _, target = lines[2].{{from_right}}("=")
height = int(lines[3].{{height}}(":", 1)[-1])
report = [("任务编号", mission), ("航点列表", waypoints),
          ("最后一站", target), ("目标高度", height)]
flight = [("altitude", height)]
flight += [("move", point) for point in waypoints + [target]]`,
  },
  {
    title: "把航点串成巡检路线",
    label: "合并",
    concepts: "生成可读航线和逗号清单",
    brief: "把航点合并成可读的航线和 CSV。改最后一个航点，看看模型飞到哪里。",
    scenarios: [
      ["从南侧进入", { points: ["P1", "P2"] }],
      ["从北侧进入", { points: ["P4", "P2"] }],
    ],
    blanks: {
      target: ["str", '写一个有效航点编号，记得使用引号。'],
      separator: ["str", '选一个便于阅读的分隔符，保留成对引号。'],
      readable: ["method", "由分隔符调用，把航点列表串起来。"],
      csv: ["method", "用逗号合并同一个航点列表。"],
    },
    targets: ({ waypoints, separator }, index) => ({
      waypoints: value => value.length === 3 && value[0] === ["P1", "P4"][index]
        && value[1] === "P2" && /^P[1-4]$/.test(value[2]),
      separator: value => typeof value === "string" && value.trim().length > 0,
      route: waypoints.join(separator),
      csv: waypoints.join(","),
    }),
    code: `waypoints = points + [{{target}}]
separator = {{separator}}
route = separator.{{readable}}(waypoints)
csv = ",".{{csv}}(waypoints)
report = [("航线", route), ("CSV", csv)]
flight = [("move", point) for point in csv.split(",")]`,
  },
  {
    title: "定位告警，选择 8 字搜索范围",
    label: "查找",
    concepts: "定位关键字 · 比较缺失时的行为",
    brief: "首尾位置不同就飞整圈，只找到一次就飞半圈，找不到则悬停。试着比较两种查找方式遇到缺失关键字时的结果。",
    scenarios: [
      ["GPS 重复告警", { note: "note:GPS_LOST|BAT_LOW|GPS_LOST" }],
      ["GPS 单次告警", { note: "note:BAT_LOW|GPS_LOST" }],
      ["无 GPS 告警", { note: "note:BAT_LOW|IMU_OK" }],
    ],
    blanks: {
      keyword: ["str", '写一个想在当前日志中查找的短关键字，记得用引号。'],
      first: ["method", "从左查找，缺失时返回 -1。"],
      last: ["method", "从右查找，缺失时返回 -1。"],
      header: ["method", "从左查找确定存在的冒号，缺失时应报错。"],
      divider: ["method", "从右查找最后一个竖线，缺失时应报错。"],
    },
    targets: ({ keyword }, _, { note }) => ({
      keyword: value => typeof value === "string" && value.trim().length > 0,
      first: note.indexOf(keyword),
      last: note.lastIndexOf(keyword),
      header: note.indexOf(":"),
      divider: note.lastIndexOf("|"),
    }),
    code: `keyword = {{keyword}}
first = note.{{first}}(keyword)
last = note.{{last}}(keyword)
header = note.{{header}}(":")
divider = note.{{divider}}("|")
report = [("第一次出现", first), ("最后一次出现", last),
          ("冒号位置", header), ("最后的竖线", divider)]
if first == -1:
    flight = [("hold", 2)]
else:
    loops = 1 if first != last else 0.5
    flight = [("figure8", loops)]`,
  },
  {
    title: "修复分隔符，接通航点指令",
    label: "替换",
    concepts: "统一分隔符 · 对齐制表符",
    brief: "地面站只认逗号分隔的航点。修好分号和中间空格，并观察制表符展开后的对齐。",
    scenarios: [
      ["仓库线", { route_text: "P2 ; P1 ; P4", panel: "GPS\tOK\t12" }],
      ["河岸线", { route_text: "P3 ; P4 ; P2", panel: "CAMERA\tOK\t03" }],
    ],
    blanks: {
      delimiter: ["method", "哪个方法把一个子串替换为另一个？"],
      comma: ["str", "想想下一步按什么字符拆航点，填带引号的字符。"],
      spaces: ["method", "删除中间的空格也要用替换方法。"],
      tab: ["method", "把制表符按制表位展开为空格。"],
      size: ["int", "试试 2 到 8 的整数，观察制表位如何变化。"],
    },
    targets: (_, index, { panel }) => ({
      route: ["P2 , P1 , P4", "P3 , P4 , P2"][index],
      clean: ["P2,P1,P4", "P3,P4,P2"][index],
      aligned: value => [2, 3, 4, 5, 6, 7, 8].some(width => value === expandTabs(panel, width)),
    }),
    code: `route = route_text.{{delimiter}}(";", {{comma}})
clean = route.{{spaces}}(" ", "")
aligned = panel.{{tab}}({{size}})
report = [("原始航线", route_text), ("清洗航线", clean),
          ("原始面板", repr(panel)), ("对齐面板", repr(aligned))]
flight = [("move", point) for point in clean.split(",")]`,
  },
  {
    title: "剪掉航点两端的空白",
    label: "去空白",
    concepts: "分别清理左端、右端和两端",
    brief: "地面站按完整编号识别航点。对比只清左侧、只清右侧和两侧都清，看看哪条指令能通过。",
    scenarios: [
      ["两侧带空白", { raw: "  P3 \t ", height: 24 }],
      ["只有右侧空白", { raw: "P4   ", height: 16 }],
      ["未知航点", { raw: "  P9  ", height: 30 }],
    ],
    blanks: {
      left: ["method", "只去掉左侧空白。"],
      right: ["method", "只去掉右侧空白。"],
      clean: ["method", "去掉两端的空白，保留内部字符。"],
      contains: ["op", "判断清洗后的航点是否在允许的编号中。"],
    },
    targets: (_, index, { raw }) => ({
      left: raw.trimStart(),
      right: raw.trimEnd(),
      point: raw.trim(),
      permitted: index !== 2,
    }),
    code: `left = raw.{{left}}()
right = raw.{{right}}()
point = raw.{{clean}}()
permitted = point {{contains}} ("P1", "P2", "P3", "P4")
report = [("只清左边", repr(left)), ("只清右边", repr(right)),
          ("发给地面站", repr(point)), ("航点可用", permitted)]
if permitted:
    flight = [("altitude", 36), ("move", point), ("altitude", height)]
else:
    flight = [("hold", 2)]`,
  },
  {
    title: "核验飞行日志，再决定是否爬升",
    label: "字符串测试",
    concepts: "编号格式 · 数字字符 · 标识符",
    brief: "用 True / False 检查编号和卫星数。对比普通数字与上标 ²，观察哪一个能用于整数换算。",
    scenarios: [
      ["正常编号和卫星数", { mission: "MIS-A03", callsign: "UAV-07", sats: "12" }],
      ["上标 ²", { mission: "MIS-A03", callsign: "UAV-07", sats: "²" }],
      ["编号与前缀不符", { mission: "TEST-A03", callsign: "UAV-19", sats: "8" }],
    ],
    blanks: {
      prefix: ["method", "检查任务编号的开头。"],
      suffix: ["method", "检查无人机编号的结尾。"],
      digit: ["method", "数字字符测试，² 也通过。"],
      decimal: ["method", "十进制数字测试，² 不通过。"],
      numeric: ["method", "测试范围更广的数字字符。"],
      identifier: ["method", "检查转换后的编号能否作为 Python 标识符。"],
    },
    targets: (_, index) => ({
      prefix_ok: index !== 2, suffix_ok: index !== 2, name_ok: true,
      digit: true, decimal: index !== 1, numeric: true,
    }),
    code: `prefix_ok = mission.{{prefix}}("MIS-")
suffix_ok = callsign.{{suffix}}("07")
digit = sats.{{digit}}()
decimal = sats.{{decimal}}()
numeric = sats.{{numeric}}()
name_ok = callsign.replace("-", "_").{{identifier}}()
report = [("任务前缀合格", prefix_ok), ("无人机后缀合格", suffix_ok),
          ("数字字符", digit), ("十进制数字", decimal),
          ("广义数字", numeric), ("标识符合格", name_ok)]
if prefix_ok and suffix_ok and name_ok and decimal:
    flight = [("altitude", 14 + int(sats) * 2), ("move", "P2")]
else:
    flight = [("hold", 2)]`,
  },
  {
    title: "统一大小写，读懂混写口令",
    label: "大小写",
    concepts: "规范呼号 · 规范口令 · 对比显示",
    brief: "把混写动作规范成控制程序认识的口令。对比同一字符串的不同显示形式。",
    scenarios: [
      ["环绕拍照", { uav: "uav-07", pilot: "lI", mode_text: "OrBiT", alarm: "gps lost" }],
      ["半圈 8 字搜索", { uav: "uav-07", pilot: "lI", mode_text: "FiGuRe8", alarm: "search zone" }],
      ["返航降落", { uav: "uav-07", pilot: "lI", mode_text: "ReTuRn", alarm: "low battery" }],
    ],
    blanks: {
      uav: ["method", "呼号的字母全部转大写。"],
      mode: ["method", "动作口令全部转小写。"],
      title: ["method", "每个单词的首字母都转大写。"],
      pilot: ["method", "飞手名首字母转大写，其余转小写。"],
      swap: ["method", "已有的大写和小写互相交换。"],
    },
    targets: (_, index) => ({
      callsign: "UAV-07", pilot_name: "Li", swapped: "uav-07",
      mode: ["orbit", "figure8", "return"][index],
      alarm_name: ["Gps Lost", "Search Zone", "Low Battery"][index],
    }),
    code: `callsign = uav.{{uav}}()
mode = mode_text.{{mode}}()
alarm_name = alarm.{{title}}()
pilot_name = pilot.{{pilot}}()
swapped = callsign.{{swap}}()
report = [("呼号", callsign), ("飞手", pilot_name),
          ("告警显示", alarm_name), ("大小写互换", swapped), ("动作口令", mode)]
if mode == "orbit":
    flight = [("orbit", 10)]
elif mode == "figure8":
    flight = [("figure8", 0.5)]
elif mode == "return":
    flight = [("return", 24)]
else:
    flight = [("hold", 2)]`,
  },
  {
    title: "解析整份巡检日志，完成综合任务",
    label: "综合巡检",
    concepts: "拆分 → 清洗 → 核验 → 下发",
    brief: "从日志里读出航点、搜索范围和告警。正常任务会升空、巡检和下降，收到返航口令则提前结束任务。",
    scenarios: [
      ["日常巡检 · 整圈", { raw: "MIS-A03 | uav-07\nwaypoints: P1; P3\nscan: FULL\nnote: GPS_OK" }],
      ["狭窄区域 · 半圈", { raw: "MIS-B09 | uav-07\nwaypoints: P4; P2\nscan: HALF\nnote: GPS_OK" }],
      ["紧急返航", { raw: "MIS-C12 | uav-07\nwaypoints: P2; P4\nscan: HALF\nnote: RETURN-HOME" }],
    ],
    blanks: {
      lines: ["method", "把原始日志按行拆开。"],
      fields: ["method", "把第一行按竖线拆成字段。"],
      strip: ["method", "去掉字段的两端空白。"],
      call: ["method", "统一呼号为大写。"],
      partition: ["method", "按第一个冒号拆出航点内容。"],
      replace: ["method", "用逗号替换分号。"],
      join: ["method", "把航点列表合并成箭头路线。"],
      starts: ["method", "检查任务编号前缀。"],
      lower: ["method", "把返航备注统一为小写后再比较。"],
      contains: ["op", "判断备注是否包含返航口令。"],
    },
    targets: (_, index) => ({
      mission: ["MIS-A03", "MIS-B09", "MIS-C12"][index], callsign: "UAV-07",
      points: [["P1", "P3"], ["P4", "P2"], ["P2", "P4"]][index],
      route: ["P1 → P3", "P4 → P2", "P2 → P4"][index],
      valid: true, return_now: index === 2,
    }),
    code: `lines = raw.{{lines}}()
fields = lines[0].{{fields}}("|")
mission, uav = [field.{{strip}}() for field in fields]
callsign = uav.{{call}}()
_, _, csv = lines[1].{{partition}}(":")
points = [p.strip() for p in csv.{{replace}}(";", ",").split(",")]
route = " → ".{{join}}(points)
mode = lines[2].partition(":")[2].strip().upper()
loops = 0.5 if mode == "HALF" else 1
valid = mission.{{starts}}("MIS-")
return_now = "return-home" {{contains}} lines[3].{{lower}}()
report = [("任务编号", mission), ("呼号", callsign), ("路线", route),
          ("搜索圈数", loops), ("返航指令", return_now)]
if not valid:
    flight = [("hold", 2)]
elif return_now:
    flight = [("return", 22)]
else:
    flight = [("altitude", 32)]
    flight += [("move", point) for point in points]
    flight += [("figure8", loops), ("altitude", 12)]`,
  },
];
