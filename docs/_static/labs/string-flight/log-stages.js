// Each line pairs the actual Python variable with its classroom checkpoint.
export const logStages = [
  { plus: ["callsign", "登记呼号"], count: ["turns", "设置扫描圈数"], times: ["pulses", "生成扫描口令"], contains: ["has_rth", "判定返航口令"] },
  { lines: ["lines", "拆开日志"], field: ["mission", "核对任务号"], once: ["csv", "提取航点文本"], waypoints: ["waypoints", "读取航点列表"], from_right: ["target", "定位最后一站"], height: ["height", "读取飞行高度"] },
  { target: ["waypoints", "追加目的地"], separator: ["separator", "设置路线分隔符"], readable: ["route", "生成可读航线"], csv: ["csv", "下发航点清单"] },
  { keyword: ["keyword", "设置搜索关键字"], first: ["first", "定位首次出现"], last: ["last", "比较两次查找"], header: ["header", "核对备注开头"], divider: ["divider", "核对最后分隔符"] },
  { comma: ["separator", "设置航点分隔符"], delimiter: ["route", "替换分隔符"], spaces: ["clean", "清洗航点清单"], size: ["width", "设置制表位"], tab: ["aligned", "核对打印排版"] },
  { left: ["left", "清理左端"], right: ["right", "清理右端"], clean: ["point", "核对清洗后的航点"], contains: ["permitted", "判断航点是否放行"] },
  { prefix: ["prefix_ok", "核验任务前缀"], suffix: ["suffix_ok", "核验无人机后缀"], digit: ["digit", "检查数字字符"], decimal: ["decimal", "检查十进制数字"], numeric: ["numeric", "检查广义数字"], identifier: ["name_ok", "核验标识符"] },
  { uav: ["callsign", "统一呼号"], mode: ["mode", "识别动作口令"], title: ["alarm_name", "规范告警标题"], pilot: ["pilot_name", "规范飞手姓名"], swap: ["swapped", "核对大小写转换"] },
  { lines: ["lines", "拆开整份日志"], fields: ["fields", "拆出任务字段"], strip: ["mission", "清洗任务编号"], call: ["callsign", "统一无人机呼号"], partition: ["csv", "提取航点文本"], replace: ["points", "生成巡检航点"], join: ["route", "生成路线简报"], starts: ["valid", "核验任务前缀"], lower: ["note", "统一备注大小写"], contains: ["return_now", "选择巡检或返航"] },
];

export function logAction(lesson, key, values) {
  if (key === "lines") return [["altitude", 10 + values.lines.length * 3]];
  if (lesson === 0 && key === "times") return [["spin", values.pulses.trim().split(" ").length, "right"]];
  if (lesson === 1 && key === "waypoints") return values.waypoints.map(point => ["move", point]);
  if (lesson === 1 && key === "from_right") return [["move", values.target]];
  if (lesson === 2 && key === "target") return [["move", values.waypoints.at(-1)]];
  if (lesson === 3 && key === "last") {
    return values.first < 0 ? [["hold", 2]] : [["figure8", values.first === values.last ? 0.5 : 1]];
  }
  if (lesson === 4 && key === "spaces") return values.clean.split(",").map(point => ["move", point]);
  if (lesson === 6 && (key === "prefix" || key === "suffix" || key === "decimal")) {
    if (!values[logStages[lesson][key][0]]) return [["hold", 2]];
  }
  if (lesson === 7 && key === "mode") {
    if (values.mode === "orbit") return [["orbit", 10]];
    if (values.mode === "figure8") return [["figure8", 0.5]];
    if (values.mode === "return") return [["return", 24]];
  }
  return [];
}
