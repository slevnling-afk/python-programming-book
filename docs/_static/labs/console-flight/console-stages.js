// The ground station evaluates these conditions in the same Python run as the student's code.
export const consoleStages = [
  {
    read: ["uav", "读取无人机呼号", "registered"],
    height: ["height", "读取并核验目标高度", "height_ok"],
    turns: ["turns", "核验自旋圈数与方向", "passed"],
  },
  {
    prefix: ["badge", "生成呼号简报", "registered"],
    mission: ["line", "嵌入任务编号", "listed"],
    pilot: ["brief", "嵌入飞手姓名", 'listed and bool(pilot) and brief == line + " / 飞手 " + pilot'],
    waypoint: ["destination", "下发实际目的地", "passed"],
  },
  {
    climb: ["up", "核对爬升高度的显示", "climb_ok"],
    battery: ["power", "核验电量显示", "climb_ok and power_ok"],
    descent: ["down", "核对下降高度的显示", "passed"],
  },
  {
    left: ["left", "核对左列位置", "left_ok"],
    right: ["right", "核对右列位置", "left_ok and right_ok"],
    center: ["center", "核对居中与目的地", "passed"],
  },
  {
    title: ["banner", "核对标题填充", "title_ok"],
    zero: ["power", "核对补零和电量门槛", "passed"],
  },
  {
    whole: ["whole", "核对整数百分比", "whole_ok"],
    detail: ["detail", "核对精确百分比和搜索范围", "passed"],
  },
  {
    read: ["uav", "读取无人机呼号", 'uav.startswith("UAV-")'],
    battery: ["battery", "读取电量", "type(battery) is int and 0 <= battery <= 100"],
    altitude: ["height", "读取高度", "type(height) is float and 12 <= height <= 60"],
    callsign: ["callsign", "嵌入无人机呼号", 'uav.startswith("UAV-") and callsign == uav'],
    align: ["column", "核对简报列宽", "ready"],
    zero: ["power", "核对电量显示", "ready and type(battery) is int and 0 <= battery <= 100 and power == str(battery).zfill(3)"],
    height: ["height_text", "核对高度精度", "ready and power_ok and height_ok"],
    signal: ["quality", "核对链路并下发任务", "passed"],
  },
];
