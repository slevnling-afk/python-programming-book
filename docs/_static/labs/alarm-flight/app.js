import { lessons, points } from "./lessons.js";
import { compileAttempt, scenarioSetup } from "../list-flight/flight-code.js";
import { startFlightLab } from "../list-flight/flight-ui.js";

const methods = new Set([
  "add", "clear", "copy", "discard", "get", "items", "keys", "pop",
  "popitem", "remove", "setdefault", "update", "values",
]);

startFlightLab({
  lessons,
  scenarioSetup,
  compileAttempt: (setup, steps, replacements) => compileAttempt(setup, steps, replacements, points),
  tokenRules: {
    member: [/^(?:in|not in)$/, "填用于成员判断的运算符。"],
    method: [{ test: value => methods.has(value) }, "填字典或集合的方法名，括号已经给出。"],
    key: [/^(?:"[a-z_]{1,20}"|'[a-z_]{1,20}')$/, "填带英文引号的字段名。"],
    name: [/^[a-z][a-z_]{0,19}$/, "填任务提供的一个变量名。"],
    constructor: [/^(?:set|list|tuple|dict)$/, "填要使用的 Python 容器类型名。"],
  },
  storageKey: "pythonbook-alarm-flight-v1",
  filename: "uav_dict_set_manager.py",
});
