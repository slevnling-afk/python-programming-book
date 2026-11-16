import { waypoints } from "./lessons.js";

const methods = new Set(["append", "clear", "copy", "count", "extend", "index", "insert", "pop", "remove", "reverse", "sort"]);

export const tokenRules = {
  operator: [/^(?:[+*\-/]|\/\/|%)$/, "填一个运算符。"],
  member: [/^(?:in|not in)$/, "填 Python 成员判断的运算符。"],
  index: [/^-?\d{1,2}$/, "填下标整数，方括号已经给出。"],
  slice: [/^-?\d{0,2}:(?:-?\d{1,2})?$/, "填切片的起止范围，方括号已经给出。"],
  delete: [/^(?:del|pass|return)$/, "填 Python 删除语句的关键字。"],
  comma: [/^[,;:]$/, "填一个英文标点。"],
  name: [/^[a-z][a-z_]{0,19}$/, "只填一个变量名。"],
  exception: [/^(?:TypeError|ValueError|IndexError|AttributeError|Exception)$/, "只填一个 Python 异常类型名。"],
  method: [{ test: value => methods.has(value) }, "填本关所用的列表方法名，括号已经给出。"],
};

export function scenarioSetup(lesson, index) {
  const values = lesson.scenarios[index][1];
  return lesson.setup.replace(/@(\w+)/g, (_, key) => JSON.stringify(values[key]));
}

const defaultPrelude = `
_steps = []
_commands = []

def hover():
    _commands.append(["hold", 2])

def fly(point):
    fly_to(*_waypoints[point], point)

def fly_to(x, y, point=""):
    _commands.append(["move", x, y, point])

def follow(route):
    for point in route:
        fly(point)

def climb(height):
    _commands.append(["altitude", height])

def spin(turns):
    _commands.append(["spin", turns])

def scan(loops):
    _commands.append(["figure8", loops])

class _ExerciseStop(Exception):
    pass

def _observe(passed, value):
    _steps.append([passed, repr(value), _commands[:]])
    _commands.clear()
    if not passed:
        raise _ExerciseStop()

def _student():
    pass`;

export function compileAttempt(setup, steps, replacements, points = waypoints) {
  const source = ("_waypoints = " + JSON.stringify(points) + defaultPrelude).split("\n");
  const lineMap = new Map();
  let visible = 0;
  const addRows = (code, value) => {
    for (const row of code.split("\n")) {
      visible++;
      source.push("    " + row.replace("[[blank]]", () => value ?? ""));
      lineMap.set(source.length, visible);
    }
  };
  addRows(setup);
  for (const [index, value] of replacements.entries()) {
    visible++;
    const step = steps[index];
    addRows(step.code, value);
    source.push("    _observe(bool(" + step.check + "), " + step.value + ")");
  }
  source.push("try:", "    _student()", "except _ExerciseStop:", "    pass",
    "observations = _steps", "# @event result");
  return { source: source.join("\n"), lineMap };
}
