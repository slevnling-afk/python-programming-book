import { lessons } from "./lessons.js";
import { DroneScene } from "../module-flight/drone.js";
import { cancelPython, runPython } from "../module-flight/runtime.js";

const ui = Object.fromEntries([...document.querySelectorAll("[id]")].map(node => [node.id, node]));
const slot = /\[\[(\w+)\]\]/g;
const storageKey = "pythonbook-console-flight-v1";
const points = { P1: [-16, -9], P2: [13, -7], P3: [17, 13], P4: [-13, 15] };
const idleHint = "点选空格，查看一句思路提示。";
const idleOutput = "运行代码后，简报会显示在这里。";

let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch {}
const fills = lessons.map((_, index) => saved.fills?.[index] || {});
const completed = new Set(saved.completed || []);
let current = 0;
let entries = [];
let focused;
let revision = 0;
let timer;
let commands = [];
let stdout = "";

const lesson = () => lessons[current];
const codeLines = () => ["# flight 按顺序记录通过检查的飞行动作。", "flight = []", ...lesson().code.split("\n")];

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify({ fills, completed: [...completed] })); } catch {}
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function status(mode, note, kind = "") {
  ui.mode.textContent = mode;
  ui.note.textContent = note;
  ui.note.dataset.kind = kind;
}

function showOutput() {
  ui.output.textContent = stdout
    ? (ui.spaces.checked ? stdout.replaceAll(" ", "·") : stdout)
    : idleOutput;
}

function updateFlight(state) {
  for (const axis of ["x", "y", "z"]) ui[axis].textContent = state[axis].toFixed(1);
  ui.yaw.textContent = state.yaw.toFixed(0);
  ui.timeline.value = state.totalProgress || 0;
  ui.pause.disabled = !state.playing;
  ui.pause.textContent = state.paused ? "继续" : "暂停";
  ui.replay.disabled = commands.length === 0;
  ui.action.textContent = state.command
    ? (state.done ? "飞行完成" : state.command.label)
    : "等待飞行指令";
  for (const [index, item] of [...ui.plan.children].entries()) {
    if (state.total && index === state.index) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  }
}

const scene = new DroneScene(ui.aircraft, { onUpdate: updateFlight });

function resetRun() {
  revision++;
  clearTimeout(timer);
  cancelPython();
  commands = [];
  stdout = "";
  ui.plan.replaceChildren();
  ui.error.hidden = true;
  ui.error.textContent = "";
  for (const row of ui.editor.querySelectorAll(".error-line")) row.classList.remove("error-line");
  for (const input of ui.editor.querySelectorAll("[aria-invalid]")) input.removeAttribute("aria-invalid");
  showOutput();
  scene.reset();
}

function updateScore() {
  const keys = Object.keys(lesson().hints);
  const filled = keys.filter(key => fills[current][key]?.trim()).length;
  ui.score.textContent = filled + " / " + keys.length + " 空已填";
  ui.progress.textContent = completed.size + " / " + lessons.length + " 关完成";
  [...ui.missions.children].forEach((button, index) => {
    button.firstChild.textContent = String(index + 1).padStart(2, "0") + (completed.has(index) ? " ✓" : "");
    if (index === current) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
}

function scheduleRun() {
  resetRun();
  if (ui.auto.checked && Object.values(fills[current]).some(value => value.trim())) {
    status("等待输入", "停顿后自动运行已填写的代码。");
    timer = setTimeout(execute, 600);
  } else {
    status("等待运行", "按代码顺序填写空格，再运行已能执行的语句。");
  }
}

function drawEditor() {
  focused = null;
  ui.hint.textContent = idleHint;
  const keys = Object.keys(lesson().hints);
  const rows = codeLines().map((line, index) => {
    const row = element("div", undefined, "code-line");
    row.dataset.line = String(index + 1);
    const number = element("span", index + 1, "line-no");
    number.setAttribute("aria-hidden", "true");
    const text = element("span", undefined, "code-text");
    if (line.trimStart().startsWith("#")) text.classList.add("code-comment");
    let offset = 0;
    for (const match of line.matchAll(slot)) {
      const key = match[1];
      const [kind, hint] = lesson().hints[key];
      const label = "第 " + (keys.indexOf(key) + 1) + " 空";
      const input = element("input");
      input.dataset.slot = key;
      input.value = fills[current][key] || "";
      input.placeholder = label;
      input.maxLength = 24;
      input.autocomplete = "off";
      input.autocapitalize = "off";
      input.spellcheck = false;
      input.style.width = kind === "name" || kind === "call" ? "13ch" : "8ch";
      input.setAttribute("aria-label", label + "。" + hint);
      input.onfocus = () => {
        focused = input;
        ui.hint.textContent = label + " · " + hint;
      };
      input.oninput = () => {
        fills[current][key] = input.value;
        completed.delete(current);
        save();
        updateScore();
        scheduleRun();
      };
      text.append(line.slice(offset, match.index), input);
      offset = match.index + match[0].length;
    }
    text.append(line.slice(offset));
    row.append(number, text);
    return row;
  });
  ui.editor.replaceChildren(...rows);
}

function loadScenario(index) {
  entries = [...lesson().scenarios[index][1]];
  ui.fields.replaceChildren(...lesson().fields.map((name, position) => {
    const label = element("label");
    const caption = element("span");
    caption.append(element("b", String(position + 1)), name);
    const input = element("input");
    input.value = entries[position];
    input.maxLength = 36;
    input.spellcheck = false;
    input.autocomplete = "off";
    input.dataset.entry = String(position);
    input.oninput = () => {
      entries[position] = input.value;
      scheduleRun();
    };
    label.append(caption, input);
    return label;
  }));
  scheduleRun();
}

function selectLesson(index) {
  current = index;
  ui["lesson-number"].textContent = "课内任务 " + String(index + 1).padStart(2, "0");
  ui["lesson-title"].textContent = lesson().title;
  ui.goal.textContent = lesson().goal;
  ui.scenario.replaceChildren(...lesson().scenarios.map(([name], i) => new Option(name, i)));
  drawEditor();
  updateScore();
  loadScenario(0);
}

function tokenAllowed(kind, value) {
  if (kind === "call") return ["input", "int", "float", "str", "bool", "len"].includes(value);
  if (kind === "name") return /^[A-Za-z][A-Za-z0-9_]{0,23}$/.test(value);
  if (kind === "prefix") return /^[A-Za-z]$/.test(value);
  return /^[A-Za-z0-9<>=^*+ .,%_-]{1,10}$/.test(value)
    && [...value.matchAll(/\d+/g)].every(([number]) => Number(number) <= 32);
}

function displayError(mode, message, line) {
  ui.error.textContent = message;
  ui.error.hidden = false;
  status(mode, "先看右侧反馈，再检查相应代码或键盘输入。", "error");
  const row = ui.editor.querySelector('[data-line="' + line + '"]');
  if (row) row.classList.add("error-line");
}

function showPlan(plan) {
  commands = plan.map(([action, value, direction]) => {
    switch (action) {
      case "hold": return { action, duration: value, label: "悬停待命" };
      case "altitude": return { action, height: value, speed: 9, label: "高度 " + value + " m" };
      case "spin": return { action, turns: value, direction, speed: 135, label: (direction === "left" ? "逆时针 " : "顺时针 ") + value + " 圈" };
      case "move": return { action, x: points[value][0], y: points[value][1], speed: 8, label: "飞往 " + value };
      case "figure8": return { action, loops: value, scale: 15, speed: 9, label: value === 0.5 ? "半圈 8 字" : "整圈 8 字" };
      case "orbit": return { action, radius: value, laps: 1, direction: "right", speed: 8, label: "环绕巡检" };
      case "return": return { action, height: value, speed: 8, label: "返航降落" };
      default: throw new Error("无法识别的飞行指令。");
    }
  });
  ui.plan.replaceChildren(...commands.map(command => element("li", command.label)));
  if (commands.length) scene.play(commands);
}

async function execute() {
  resetRun();
  const run = revision;
  const values = fills[current];
  const replacements = {};
  for (const [key, [kind]] of Object.entries(lesson().hints)) {
    const value = values[key]?.trim();
    if (!value) continue;
    if (!tokenAllowed(kind, value)) {
      const input = ui.editor.querySelector('[data-slot="' + key + '"]');
      input.setAttribute("aria-invalid", "true");
      const instruction = {
        name: "只填函数名或变量名，不加括号。",
        call: "此空只接受常用的输入或类型转换函数名，不加括号。",
        prefix: "这里只填一个字母。",
        format: "只填冒号后的格式说明。宽度和精度最多为 32。",
      }[kind];
      displayError("检查填写格式", instruction);
      return;
    }
    replacements[key] = value;
  }

  const lines = codeLines();
  const firstOpen = lines.findIndex(line => [...line.matchAll(slot)]
    .some(([, key]) => !Object.hasOwn(replacements, key)));
  const partial = firstOpen !== -1;
  const runnable = partial ? lines.slice(0, firstOpen) : lines;
  if (partial && !runnable.some(line => [...line.matchAll(slot)].length)) {
    status("等待填空", "先补全前面第一个还未填完的语句。");
    return;
  }
  const body = runnable.map(line => "    " + line.replace(slot, (_, key) => replacements[key])).join("\n");
  // A fresh worker turns the form's lines into stdin for the real Python input().
  const stdin = JSON.stringify(entries.join("\n") + "\n");
  const source = "import io as _io, sys as _sys; _sys.stdin = _io.StringIO(" + stdin + ")\n"
    + "def _student():\n" + body + "\n"
    + '    return flight, bool(locals().get("passed", False))\n'
    + "flight, passed = _student()\n# @event result";

  status("运行 Python", partial ? "只运行第一个空缺之前的完整语句。" : "正在生成简报和飞行指令。");
  const result = await runPython(source, { entry: "uav_console_brief.py" });
  if (run !== revision) return;
  stdout = result.output || "";
  showOutput();
  if (!result.ok) {
    displayError("Python 报错", result.error, result.line - 2);
    return;
  }
  const scope = result.events.findLast(event => event.type === "result")?.scope;
  if (!scope || !Array.isArray(scope.flight)) {
    displayError("未生成结果", "Python 没有返回飞行指令。");
    return;
  }
  try {
    showPlan(scope.flight);
  } catch (error) {
    commands = [];
    ui.plan.replaceChildren();
    scene.reset();
    displayError("检查飞行指令", error.message);
    return;
  }
  if (partial) {
    status("阶段运行", "简报只显示已运行的内容。继续填空，解锁后续动作。");
  } else if (scope.passed) {
    completed.add(current);
    save();
    updateScore();
    status("本情境通过", "简报已通过校验。改变表单输入，再观察动作。");
  } else {
    status("继续核对", "请对照本关要求，检查简报排版或输入范围。");
  }
}

lessons.forEach(({ name }, index) => {
  const button = element("button");
  button.type = "button";
  button.append(element("small"), element("span", name));
  button.onclick = () => selectLesson(index);
  ui.missions.append(button);
});

ui.scenario.onchange = () => loadScenario(Number(ui.scenario.value));
ui.auto.onchange = () => {
  if (!ui.auto.checked) clearTimeout(timer);
  else scheduleRun();
};
ui.run.onclick = execute;
ui.editor.onkeydown = ui.fields.onkeydown = event => {
  if (event.key === "Enter" && !event.isComposing) {
    event.preventDefault();
    execute();
  }
};
ui["hint-button"].onclick = () => {
  const inputs = [...ui.editor.querySelectorAll("input")];
  (focused || inputs.find(input => !input.value.trim()) || inputs[0])?.focus();
};
ui.clear.onclick = () => {
  fills[current] = {};
  completed.delete(current);
  save();
  drawEditor();
  updateScore();
  scheduleRun();
};
ui.spaces.onchange = showOutput;
ui.pause.onclick = () => scene.setPaused(!scene.state.paused);
ui.replay.onclick = () => scene.play(commands);
ui.speed.onchange = () => scene.setPlaybackRate(Number(ui.speed.value));
const views = [...document.querySelectorAll("[data-view]")];
for (const button of views) {
  button.onclick = () => {
    scene.setView(button.dataset.view);
    for (const view of views) view.setAttribute("aria-pressed", String(button === view));
  };
}
ui.demo.onclick = () => {
  resetRun();
  showPlan([["altitude", 28], ["move", "P2"], ["spin", 1, "left"],
    ["figure8", 0.5], ["return", 20]]);
  status("动作演示", "这是独立的动作预览。填写左侧代码可生成自己的飞行。");
};
window.addEventListener("pagehide", () => {
  clearTimeout(timer);
  revision++;
  cancelPython();
});
selectLesson(0);
