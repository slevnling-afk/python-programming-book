import { lessons } from "./lessons.js";
import { filledPrefix, flightEvidence, inspectionMove, newCommands } from "../string-flight/flight-link.js?v=3";
import { DroneScene } from "../module-flight/drone.js?v=3";
import { cancelPython, runPython } from "../module-flight/runtime.js";

const ui = Object.fromEntries([...document.querySelectorAll("[id]")].map(node => [node.id, node]));
const slot = /\[\[(\w+)\]\]/g;
const storageKey = "pythonbook-time-flight-v1";
const points = { P1: [-16, -9], P2: [13, -7], P3: [17, 13], P4: [-13, 15] };
const idleHint = "点选空格，查看一句思路提示。";
const idleOutput = "运行代码后，这里会显示时间结果。";

let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch {}
const fills = lessons.map((_, index) => saved.fills?.[index] || {});
const completed = new Set(saved.completed || []);
let current = 0;
let entries = {};
let focused;
let revision = 0;
let timer;
let commands = [];
let previousPlan = [];
let origin;
let stdout = "";

const lesson = () => lessons[current];
const codeLines = () => ["# params 是面板参数，flight 记录动作，timeline 记录时刻。", "flight = []", "timeline = []", ...lesson().code.split("\n")];

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
    ? stdout
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

function resetRun(keepPosition = false) {
  revision++;
  clearTimeout(timer);
  cancelPython();
  commands = [];
  origin = undefined;
  stdout = "";
  ui.plan.replaceChildren();
  ui.events.replaceChildren();
  ui.error.hidden = true;
  ui.error.textContent = "";
  for (const row of ui.editor.querySelectorAll(".error-line")) row.classList.remove("error-line");
  for (const input of ui.editor.querySelectorAll("[aria-invalid]")) input.removeAttribute("aria-invalid");
  showOutput();
  scene.reset({ keepPosition });
  flightEvidence(ui, null, "等待代码结果", "", "填一空，观察实际值和本次新下发的动作。");
}

function updateScore() {
  const keys = Object.keys(lesson().steps);
  const filled = keys.filter(key => fills[current][key]?.trim()).length;
  ui.score.textContent = filled + " / " + keys.length + " 空已填";
  ui.progress.textContent = completed.size + " / " + lessons.length + " 关完成";
  [...ui.missions.children].forEach((button, index) => {
    button.firstChild.textContent = String(index + 1).padStart(2, "0") + (completed.has(index) ? " ✓" : "");
    if (index === current) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
}

function scheduleRun(key) {
  resetRun(Boolean(key));
  if (ui.auto.checked && Object.values(fills[current]).some(value => value.trim())) {
    status("等待输入", "停顿后自动运行已填写的代码。");
    timer = setTimeout(() => execute(key), 600);
  } else {
    status("等待运行", "按代码顺序填写空格，再运行已能执行的语句。");
  }
}

function drawEditor() {
  focused = null;
  ui.hint.textContent = idleHint;
  const keys = Object.keys(lesson().steps);
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
      const [kind, hint] = lesson().steps[key];
      const label = "第 " + (keys.indexOf(key) + 1) + " 空";
      const input = element("input");
      input.dataset.slot = key;
      input.value = fills[current][key] || "";
      input.placeholder = label;
      input.maxLength = 24;
      input.autocomplete = "off";
      input.autocapitalize = "off";
      input.spellcheck = false;
      input.style.width = kind === "op" ? "7ch" : "17ch";
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
        scheduleRun(key);
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
  previousPlan = [];
  entries = { ...lesson().scenarios[index][1] };
  ui.parameters.hidden = Object.keys(entries).length === 0;
  ui.fields.replaceChildren(...Object.keys(entries).map((key, position) => {
    const label = element("label");
    const caption = element("span");
    caption.append(element("b", String(position + 1)), lesson().labels[key]);
    const input = element("input");
    input.value = entries[key];
    input.maxLength = 32;
    input.spellcheck = false;
    input.autocomplete = "off";
    input.dataset.param = key;
    input.oninput = () => {
      entries[key] = input.value;
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
  if (kind === "op") return ["+", "-", "*", "/"].includes(value);
  if (kind === "name") return ["timedelta", "datetime", "int", "float"].includes(value);
  return /^[A-Za-z][A-Za-z0-9_]{0,23}$/.test(value);
}

function displayError(mode, message, line) {
  ui.error.textContent = message;
  ui.error.hidden = false;
  status(mode, "先看右侧反馈，再检查相应代码或键盘输入。", "error");
  flightEvidence(ui, null, mode, "", "本次代码未通过，停止下发动作。", "blocked");
  const row = ui.editor.querySelector('[data-line="' + line + '"]');
  if (row) row.classList.add("error-line");
}

function showPlan(plan, fallback, from) {
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
  if (!commands.length && fallback) commands = [fallback];
  origin = from;
  ui.plan.replaceChildren(...commands.map(command => element("li", command.label)));
  if (commands.length) scene.play(commands, { from });
}

async function execute(requestedKey) {
  resetRun(Boolean(requestedKey));
  const run = revision;
  const values = fills[current];
  const replacements = {};
  for (const [key, [kind]] of Object.entries(lesson().steps)) {
    const value = values[key]?.trim();
    if (!value) continue;
    if (!tokenAllowed(kind, value)) {
      const input = ui.editor.querySelector('[data-slot="' + key + '"]');
      input.setAttribute("aria-invalid", "true");
      const instruction = kind === "op"
        ? "只填一个运算符。"
        : "只填时间函数或类型的名字，不加括号。";
      displayError("检查填写格式", instruction);
      return;
    }
    replacements[key] = value;
  }

  const { lines: runnable, partial, stage, blocked } = filledPrefix(codeLines(), slot, replacements, requestedKey);
  if (!stage || blocked) {
    status("等待填空", "先补全前面第一个还未填完的语句。");
    flightEvidence(ui, null, "等待前面的空格", "", "先按代码顺序补全语句，当前空才能执行。", "blocked");
    return;
  }
  const [, , variable, label] = lesson().steps[stage.key];
  flightEvidence(ui, stage, label, "", "正在执行这一行所在的 Python 语句。", "working");
  const body = runnable.map(line => "    " + line.replace(slot, (_, key) => replacements[key])).join("\n");
  const used = runnable.flatMap(line => [...line.matchAll(slot)].map(([, key]) => key));
  const checks = used.map(key => "(" + JSON.stringify(key) + ", bool(" + lesson().steps[key][4] + "))").join(", ");
  const source = "params = " + JSON.stringify(entries) + "\n"
    + "def _student():\n" + body + "\n"
    + "    checks = [" + checks + "]\n"
    + '    failed = next((key for key, accepted in checks if not accepted), "")\n'
    + "    return flight, timeline, repr(" + variable + "), failed\n"
    + "flight, timeline, observed, failed = _student()\n# @event result";

  status("运行 Python", partial ? "正在运行本空和之前的完整语句。" : "正在计算时间轴和飞行指令。");
  const result = await runPython(source, {
    entry: "uav_time_log.py",
    onStatus: event => {
      if (run === revision && event.stage === "loading") {
        status("加载 Python", "首次加载后，浏览器会缓存运行资源。");
      }
    },
  });
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
  const evidence = variable + " = " + scope.observed;
  if (scope.failed) {
    const checkLabel = lesson().steps[scope.failed][3];
    flightEvidence(ui, stage, label, evidence, "“" + checkLabel + "”未通过，无人机保持原位。", "blocked");
    status("校验未通过", "检查时间结果、参数范围和对应填空的提示。");
    return;
  }
  ui.events.replaceChildren(...scope.timeline.map(([name, time]) => {
    const item = element("li");
    item.append(element("strong", name), element("code", time));
    return item;
  }));
  try {
    const next = requestedKey ? newCommands(previousPlan, scope.flight) : scope.flight;
    // A verified readout with no new mission movement releases one inspection pad.
    const motion = partial ? next.filter(([action]) => action !== "hold") : next;
    const from = requestedKey && scene.state.z > 3 ? { ...scene.state } : undefined;
    showPlan(motion, inspectionMove(stage.number), from);
    previousPlan = scope.flight;
    const cause = motion.length ? "本次代码下发：" : "本步结果通过，解锁训练校验点：";
    flightEvidence(ui, stage, label, evidence, cause + commands.map(command => command.label).join(" → "));
  } catch (error) {
    commands = [];
    ui.plan.replaceChildren();
    scene.reset();
    displayError("检查飞行指令", error.message);
    return;
  }
  if (partial) {
    status("阶段飞行", "右侧显示本空的实际结果和动作。继续填写下一空。");
  } else {
    completed.add(current);
    save();
    updateScore();
    status("本情境通过", "时间结果已通过校验。可切换情境或修改任务参数再试。");
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
ui.run.onclick = () => execute();
ui.editor.onkeydown = ui.fields.onkeydown = event => {
  if (event.key === "Enter" && !event.isComposing) {
    event.preventDefault();
    execute(event.target.dataset.slot);
  }
};
ui["hint-button"].onclick = () => {
  const inputs = [...ui.editor.querySelectorAll("input")];
  (focused || inputs.find(input => !input.value.trim()) || inputs[0])?.focus();
};
ui.clear.onclick = () => {
  fills[current] = {};
  previousPlan = [];
  completed.delete(current);
  save();
  drawEditor();
  updateScore();
  scheduleRun();
};
ui.pause.onclick = () => scene.setPaused(!scene.state.paused);
ui.replay.onclick = () => scene.play(commands, { from: origin });
ui.speed.onchange = () => scene.setPlaybackRate(Number(ui.speed.value));
const views = [...document.querySelectorAll("[data-view]")];
for (const button of views) {
  button.onclick = () => {
    scene.setView(button.dataset.view);
    for (const view of views) view.setAttribute("aria-pressed", String(button === view));
  };
}
window.addEventListener("pagehide", () => {
  clearTimeout(timer);
  revision++;
  cancelPython();
});
selectLesson(0);
