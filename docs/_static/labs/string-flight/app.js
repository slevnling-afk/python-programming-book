import { lessons } from "./lessons.js?v=3";
import { logAction, logStages } from "./log-stages.js";
import { filledPrefix, flightEvidence, inspectionMove } from "./flight-link.js";
import { DroneScene } from "../module-flight/drone.js?v=3";
import { runPython, cancelPython } from "../module-flight/runtime.js";

const ui = Object.fromEntries([...document.querySelectorAll("[id]")].map(node => [node.id, node]));
const waypoints = new Map([
  ["P1", [-16, -9]],
  ["P2", [13, -7]],
  ["P3", [17, 13]],
  ["P4", [-13, 15]],
]);
const storageKey = "pythonbook-string-flight-v1";
const idleHint = "点选任意填空，查看一句提示。";
const idleNote = "按顺序填空，自动查看当前语句的飞行动作。点运行代码可执行整段已填写的代码。";
const placeholder = /\{\{(\w+)\}\}/g;

let saved = {};
try {
  saved = JSON.parse(localStorage.getItem(storageKey)) || {};
} catch {
  // The lab also works if this browser blocks local storage.
}
const answers = lessons.map((_, index) => saved.answers?.[index] || {});
const completed = new Set(saved.completed || []);
let lessonIndex = 0;
let scenarioIndex = 0;
let revision = 0;
let pending;
let currentPlan = [];
let flightOrigin;
let activeCommand = -1;
let hintedInput;
let projectOnMap = () => [56, 44];

const currentLesson = () => lessons[lessonIndex];
const currentAnswers = () => answers[lessonIndex];

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ answers, completed: [...completed] }));
  } catch {
    // Progress remains available for this tab.
  }
}

function makeElement(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function sourceTemplate() {
  const [, values] = currentLesson().scenarios[scenarioIndex];
  const dataLines = Object.entries(values).map(([name, value]) => {
    if (typeof value !== "string" || !value.includes("\n")) {
      return name + " = " + JSON.stringify(value);
    }
    const lines = value.split("\n");
    const quoted = lines.map((line, index) => {
      const newline = index < lines.length - 1 ? "\n" : "";
      return "    " + JSON.stringify(line + newline);
    });
    return name + " = (\n" + quoted.join("\n") + "\n)";
  });
  return ["# 当前巡检日志", ...dataLines, "", currentLesson().code].join("\n");
}

function cleanToken(kind, text) {
  const value = text.trim();
  if (kind === "method" && /^[A-Za-z][A-Za-z0-9_]{0,29}$/.test(value)) return value;
  if (kind === "int" && /^\d{1,2}$/.test(value)) return value;
  if (kind === "op" && ["+", "*", "in", "not in", "-", "/", "==", "!="].includes(value)) return value;
  if (kind === "str" && value.length >= 2 && /^["']/.test(value) && value.at(-1) === value[0]) {
    const contents = value.slice(1, -1);
    if (!contents.includes(value[0]) && !/[\\\r\n\0]/.test(contents)) {
      return JSON.stringify(contents);
    }
  }
  return null;
}

function updateScore() {
  const keys = Object.keys(currentLesson().blanks);
  const filled = keys.filter(key => currentAnswers()[key]?.trim()).length;
  ui.score.textContent = filled + " / " + keys.length + " 空已填";
  ui.progress.textContent = completed.size + " / " + lessons.length + " 关完成";
  for (const [index, button] of [...ui.missions.children].entries()) {
    const number = String(index + 1).padStart(2, "0");
    button.firstChild.textContent = number + (completed.has(index) ? " ✓" : "");
  }
}

function buildEditor() {
  const definition = currentLesson().blanks;
  const keys = Object.keys(definition);
  const fragment = document.createDocumentFragment();
  sourceTemplate().split("\n").forEach((line, lineIndex) => {
    const row = makeElement("div", undefined, "code-line");
    row.dataset.line = String(lineIndex + 1);
    const number = makeElement("span", lineIndex + 1, "line-no");
    number.setAttribute("aria-hidden", "true");
    const text = makeElement("span", undefined, "code-text");
    let position = 0;
    for (const match of line.matchAll(placeholder)) {
      const key = match[1];
      const [kind, hint] = definition[key];
      const ordinal = keys.indexOf(key) + 1;
      const input = document.createElement("input");
      input.dataset.blank = key;
      input.value = currentAnswers()[key] || "";
      input.placeholder = "空 " + ordinal;
      input.setAttribute("aria-label", "填空 " + ordinal + "。" + hint);
      input.setAttribute("autocomplete", "off");
      input.setAttribute("autocapitalize", "off");
      input.spellcheck = false;
      input.maxLength = 40;
      input.style.width = { method: "14ch", str: "10ch", op: "7ch", int: "7ch" }[kind];
      input.addEventListener("focus", () => {
        hintedInput = input;
        ui.hint.textContent = "第 " + ordinal + " 空 · " + hint;
      });
      input.addEventListener("input", () => {
        currentAnswers()[key] = input.value;
        completed.delete(lessonIndex);
        persist();
        updateScore();
        invalidate(true);
        if (ui.auto.checked && Object.values(currentAnswers()).some(value => value.trim())) {
          setStatus("等待输入", "继续填写，停顿后自动试飞。");
          pending = setTimeout(() => execute(key), 650);
        }
      });
      text.append(line.slice(position, match.index), input);
      position = match.index + match[0].length;
    }
    text.append(line.slice(position));
    row.append(number, text);
    fragment.append(row);
  });
  ui.editor.replaceChildren(fragment);
}

function setStatus(mode, note, kind = "") {
  ui.mode.textContent = mode;
  ui["run-note"].textContent = note;
  ui["run-note"].dataset.kind = kind;
}

function invalidate(keepPosition = false) {
  revision++;
  clearTimeout(pending);
  cancelPython();
  currentPlan = [];
  activeCommand = -1;
  ui.plan.replaceChildren();
  ui.result.replaceChildren();
  ui.error.hidden = true;
  ui.error.textContent = "";
  ui.empty.hidden = false;
  ui.callsign.textContent = "UAV-07";
  ui.track.setAttribute("points", "");
  projectOnMap = () => [56, 44];
  for (const row of ui.editor.querySelectorAll(".error-line")) row.classList.remove("error-line");
  for (const input of ui.editor.querySelectorAll("[aria-invalid]")) input.removeAttribute("aria-invalid");
  flightOrigin = undefined;
  scene.reset({ keepPosition });
  flightEvidence(ui, null, "等待代码结果", "", "右侧只执行左侧代码产生或通过校验的动作。");
  setStatus("等待试飞", idleNote);
}

function selectLesson(index) {
  lessonIndex = index;
  scenarioIndex = 0;
  invalidate();
  const lesson = currentLesson();
  ui.concepts.textContent = lesson.concepts;
  ui["lesson-title"].textContent = lesson.title;
  ui.brief.textContent = lesson.brief;
  ui.hint.textContent = idleHint;
  ui.scenario.replaceChildren(...lesson.scenarios.map(([name], i) => new Option(name, i)));
  for (const [i, button] of [...ui.missions.children].entries()) {
    if (i === index) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  }
  buildEditor();
  updateScore();
}

function translateFlight(commands) {
  if (!Array.isArray(commands) || commands.length === 0) throw new Error("Python 没有生成飞行指令。");
  return commands.map(([action, value, direction]) => {
    switch (action) {
      case "move": {
        const point = waypoints.get(value);
        if (!point) throw new Error("场地中没有航点 " + JSON.stringify(value) + "。请检查分隔符与首尾空格。");
        return { action, x: point[0], y: point[1], speed: 8, label: "飞往 " + value };
      }
      case "altitude":
        return { action, height: value, speed: 9, label: "高度 " + value + " m" };
      case "spin":
        return { action, turns: value, direction, speed: 130, label: "自旋 " + value + " 圈" };
      case "figure8":
        return { action, loops: value, scale: 15, speed: 9, label: value === 0.5 ? "半圈 8 字" : "整圈 8 字" };
      case "orbit":
        return { action, radius: value, laps: 1, direction: "right", speed: 8, label: "环绕拍照" };
      case "hold":
        return { action, duration: value, label: "原地悬停" };
      case "return":
        return { action, height: value, speed: 8, label: "返航降落" };
      default:
        throw new Error("无法识别的飞行指令 " + String(action));
    }
  });
}

function updateFlight(state) {
  ui.x.textContent = state.x.toFixed(1);
  ui.y.textContent = state.y.toFixed(1);
  ui.z.textContent = state.z.toFixed(1);
  ui.yaw.textContent = state.yaw.toFixed(0);
  ui.timeline.value = state.totalProgress || 0;
  ui.pause.disabled = !state.playing;
  ui.pause.textContent = state.paused ? "继续" : "暂停";
  ui.replay.disabled = currentPlan.length === 0;
  const [x, y] = projectOnMap(state);
  ui.position.setAttribute("cx", x);
  ui.position.setAttribute("cy", y);
  const index = state.total ? state.index : -1;
  const label = state.command?.label;
  ui.action.textContent = label ? (state.done ? "飞行完成" : label) : "等待 Python 指令";
  if (index !== activeCommand) {
    ui.plan.children[activeCommand]?.removeAttribute("aria-current");
    if (index >= 0) ui.plan.children[index]?.setAttribute("aria-current", "step");
    activeCommand = index;
  }
}

const scene = new DroneScene(ui.aircraft, { onUpdate: updateFlight });

function startFlight(commands, from) {
  currentPlan = commands;
  flightOrigin = from;
  activeCommand = -1;
  ui.plan.replaceChildren(...commands.map(command => makeElement("li", command.label)));
  const plan = scene.play(commands, { from });
  const xs = plan.points.map(point => point.x);
  const ys = plan.points.map(point => point.y);
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const scale = Math.min(90 / Math.max(12, Math.max(...xs) - Math.min(...xs)),
    64 / Math.max(12, Math.max(...ys) - Math.min(...ys)));
  projectOnMap = point => [56 + (point.x - cx) * scale, 44 - (point.y - cy) * scale];
  ui.track.setAttribute("points", plan.points.map(point => projectOnMap(point).join(",")).join(" "));
  updateFlight(scene.state);
}

function describe(value) {
  if (typeof value === "boolean") return value ? "True" : "False";
  if (Array.isArray(value)) return JSON.stringify(value);
  return String(value);
}

function renderReport(report) {
  ui.result.replaceChildren(...report.map(([label, value]) => {
    const item = makeElement("div");
    item.append(makeElement("dt", label), makeElement("dd", describe(value)));
    return item;
  }));
}

function showError(title, message, line) {
  currentPlan = [];
  ui.plan.replaceChildren();
  scene.reset({ keepPosition: true });
  flightEvidence(ui, null, title, "", "本次代码未通过，停止下发动作。", "blocked");
  ui.empty.hidden = true;
  ui.error.hidden = false;
  ui.error.textContent = message;
  ui.action.textContent = "未下发飞行指令";
  setStatus(title, "运行未生成可执行的飞行计划。请检查左侧代码和右侧反馈。", "error");
  if (Number.isInteger(line)) {
    const row = ui.editor.querySelector('[data-line="' + line + '"]');
    if (row) {
      row.classList.add("error-line");
      ui.editor.scrollTop = Math.max(0, row.offsetTop - ui.editor.offsetTop - 40);
    }
  }
}

async function execute(requestedKey) {
  invalidate(Boolean(requestedKey));
  const run = revision;
  const lesson = currentLesson();
  const [, data] = lesson.scenarios[scenarioIndex];
  const lines = sourceTemplate().split("\n");
  const tokens = {};
  let problem;
  for (const [key, [kind]] of Object.entries(lesson.blanks)) {
    const value = currentAnswers()[key]?.trim();
    if (!value) continue;
    const token = cleanToken(kind, value);
    if (token === null) {
      problem = { key, kind };
      break;
    }
    tokens[key] = token;
  }
  if (problem) {
    const input = ui.editor.querySelector('[data-blank="' + problem.key + '"]');
    const instruction = {
      method: "只填写方法名，括号已在代码中。",
      int: "填写一到两位整数。",
      op: "填写单个 Python 运算符。",
      str: "填写带成对单引号或双引号的字符串。",
    }[problem.kind];
    showError("检查填空格式", instruction);
    input.setAttribute("aria-invalid", "true");
    return;
  }
  const { lines: runnable, partial, stage, blocked } = filledPrefix(lines, placeholder, tokens, requestedKey);
  const source = runnable.join("\n").replace(placeholder, (_, key) => tokens[key]);
  if (!stage || blocked) {
    setStatus("等待填空", "请先补全前面第一个还未填完的语句，再运行代码。");
    flightEvidence(ui, null, "等待前面的空格", "", "先按代码顺序补全语句，当前空才能执行。", "blocked");
    return;
  }
  const [variable, label] = logStages[lessonIndex][stage.key];
  flightEvidence(ui, stage, label, "", "正在执行这一行所在的 Python 语句。", "working");
  const mode = partial ? "中间结果" : "完整运行";
  const context = partial ? "正在运行第一个空缺语句之前的代码。" : "正在运行你的完整代码。";
  setStatus(mode + " · 准备中", context);
  const result = await runPython(source + "\n# @event result", {
    entry: "uav_log_parser.py",
    onStatus: status => {
      if (run !== revision) return;
      setStatus(mode + " · " + (status.stage === "running" ? "运行 Python" : "加载 Python"), context);
    },
  });
  if (run !== revision) return;
  if (!result.ok) {
    showError("Python 报错", result.error, result.line);
    return;
  }
  const values = result.events.findLast(event => event.type === "result")?.scope;
  if (!values) {
    showError("未收到解析结果", "Python 已执行，但没有产生可用于模拟飞行的结果。");
    return;
  }
  ui.empty.hidden = true;
  renderReport(values.report || Object.entries(values)
    .filter(([name]) => !Object.hasOwn(data, name)).slice(-6));
  if (typeof values.callsign === "string") ui.callsign.textContent = values.callsign.slice(0, 24);
  const mismatch = Object.entries(lesson.targets(values, scenarioIndex, data)).find(([name, target]) => {
    if (partial && !Object.hasOwn(values, name)) return false;
    const actual = values[name];
    return typeof target === "function"
      ? !target(actual)
      : JSON.stringify(actual) !== JSON.stringify(target);
  });
  const actual = values[variable];
  const evidence = variable + " = " + (typeof actual === "string" ? JSON.stringify(actual) : describe(actual));
  if (mismatch) {
    flightEvidence(ui, stage, label, evidence, "变量 " + mismatch[0] + " 未通过检查，本次保持原位。", "blocked");
    setStatus("校验未通过", "请检查 " + mismatch[0] + " 对应的语句和提示。");
    return;
  }
  const missionActions = partial ? logAction(lessonIndex, stage.key, values) : values.flight;
  try {
    const moves = missionActions?.length ? translateFlight(missionActions) : [inspectionMove(stage.number)];
    const from = requestedKey && scene.state.z > 3 ? { ...scene.state } : undefined;
    startFlight(moves, from);
    let cause = missionActions?.length ? "根据实际结果执行：" : "本步结果通过，解锁训练校验点：";
    if (partial && stage.key === "lines") cause = "按拆出的行数校准高度，基础 10 m，每行加 3 m：";
    if (partial && stage.key === "times") cause = "每段扫描口令对应一圈：";
    if (partial && stage.key === "last") cause = "按关键字出现次数选择搜索范围：";
    flightEvidence(ui, stage, label, evidence, cause + moves.map(move => move.label).join(" → "));
  } catch (error) {
    showError("地面站未通过", error.message, stage.line);
    return;
  }
  if (!partial) {
    completed.add(lessonIndex);
    persist();
    updateScore();
    setStatus("本关完成", "本情境的解析结果符合目标。可切换日志继续对照。", "success");
  } else {
    setStatus("阶段飞行", "右侧显示本空的实际结果和动作。继续填写下一空。", "success");
  }
}

lessons.forEach((lesson, index) => {
  const button = makeElement("button");
  button.type = "button";
  button.append(makeElement("small"), makeElement("span", lesson.label));
  button.addEventListener("click", () => selectLesson(index));
  ui.missions.append(button);
});

ui.scenario.addEventListener("change", () => {
  scenarioIndex = Number(ui.scenario.value);
  invalidate();
  buildEditor();
  updateScore();
  if (ui.auto.checked && Object.values(currentAnswers()).some(value => value.trim())) execute();
});
ui.auto.addEventListener("change", () => {
  if (!ui.auto.checked) clearTimeout(pending);
});
ui.editor.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.isComposing) {
    event.preventDefault();
    execute(event.target.dataset.blank);
  }
});
ui.run.addEventListener("click", () => execute());
ui.clear.addEventListener("click", () => {
  answers[lessonIndex] = {};
  completed.delete(lessonIndex);
  persist();
  invalidate();
  buildEditor();
  updateScore();
  ui.hint.textContent = idleHint;
});
ui["show-hint"].addEventListener("click", () => {
  const inputs = [...ui.editor.querySelectorAll("input")];
  const input = hintedInput?.isConnected
    ? hintedInput : (inputs.find(field => !field.value.trim()) || inputs[0]);
  input?.focus();
});
ui.pause.addEventListener("click", () => scene.setPaused(!scene.state.paused));
ui.replay.addEventListener("click", () => startFlight(currentPlan, flightOrigin));
ui.speed.addEventListener("change", () => scene.setPlaybackRate(Number(ui.speed.value)));
const viewButtons = [...document.querySelectorAll("[data-view]")];
for (const button of viewButtons) {
  button.addEventListener("click", () => {
    scene.setView(button.dataset.view);
    for (const view of viewButtons) view.setAttribute("aria-pressed", String(view === button));
  });
}

selectLesson(0);
window.addEventListener("pagehide", () => {
  clearTimeout(pending);
  revision++;
  cancelPython();
});

