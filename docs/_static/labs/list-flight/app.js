import { lessons } from "./lessons.js";
import { compileAttempt, scenarioSetup, tokenRules } from "./flight-code.js";
import { flightEvidence, newCommands } from "../string-flight/flight-link.js?v=3";
import { DroneScene } from "../module-flight/drone.js?v=3";
import { cancelPython, runPython } from "../module-flight/runtime.js";

const ui = Object.fromEntries([...document.querySelectorAll("[id]")].map(node => [node.id, node]));
const storageKey = "pythonbook-list-flight-v1";
const idleHint = "点选空格，查看一句思路提示。";
const idleOutput = "运行后，这里会依次显示各步骤的 Python 结果。";

let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch {}
const fills = lessons.map((_, index) => saved.fills?.[index] || []);
const completed = new Set(saved.completed || []);
let current = 0;
let variant = 0;
let focused;
let revision = 0;
let timer;
let commands = [];
let previousPlan = [];
let origin;
let slots = [];
let evidence = [];
let shownStep = -1;

const lesson = () => lessons[current];
const fillsNow = () => fills[current];

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

function updateFlight(state) {
  for (const axis of ["x", "y", "z"]) ui[axis].textContent = state[axis].toFixed(1);
  ui.yaw.textContent = String(Math.round((state.yaw % 360 + 360) % 360) % 360);
  ui.timeline.value = state.totalProgress || 0;
  ui.pause.disabled = !state.playing;
  ui.pause.textContent = state.paused ? "继续" : "暂停";
  ui.replay.disabled = commands.length === 0;
  ui.action.textContent = state.command
    ? (state.done ? "飞行完成" : state.command.label)
    : "等待飞行指令";
  if (state.command && state.command.stepIndex !== shownStep) {
    showEvidence(state.command.stepIndex);
  }
  for (const [index, item] of [...ui.plan.children].entries()) {
    if (state.total && index === state.index) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  }
}

const scene = new DroneScene(ui.aircraft, { onUpdate: updateFlight });

function stopRun(keepPosition = true, clearOutput = false) {
  revision++;
  clearTimeout(timer);
  cancelPython();
  commands = [];
  origin = undefined;
  evidence = [];
  shownStep = -1;
  ui.plan.replaceChildren();
  ui.error.hidden = true;
  ui.error.textContent = "";
  for (const row of ui.editor.querySelectorAll(".error-line")) row.classList.remove("error-line");
  for (const { input } of slots) input.removeAttribute("aria-invalid");
  if (clearOutput) {
    ui.output.textContent = idleOutput;
  }
  scene.reset({ keepPosition });
  flightEvidence(ui, null, "等待代码结果", "", "填一空，观察本步实际计算出的结果和飞行动作。");
}

function updateScore() {
  const filled = slots.filter(({ input }) => input.value.trim()).length;
  ui.score.textContent = filled + " / " + slots.length + " 空已填";
  ui.progress.textContent = completed.size + " / " + lessons.length + " 关完成";
  [...ui.missions.children].forEach((button, index) => {
    button.setAttribute("aria-label", lessons[index].name + (completed.has(index) ? "，已完成" : ""));
    button.lastChild.hidden = !completed.has(index);
    if (index === current) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
}

function scheduleRun(index) {
  stopRun(index !== undefined, index === undefined);
  if (ui.auto.checked && fillsNow().some(value => value?.trim())) {
    status("等待输入", "停顿后自动运行当前填写的代码。");
    timer = setTimeout(() => execute(index), 600);
  } else {
    status("等待运行", "按代码顺序填写空格，再运行代码。");
  }
}

function drawEditor() {
  focused = null;
  slots = [];
  ui.hint.textContent = idleHint;
  const rows = [];
  function addRows(code, stage) {
    for (const line of code.split("\n")) {
      const row = element("div", undefined, "code-line");
      const lineNumber = rows.length + 1;
      row.dataset.line = String(lineNumber);
      const number = element("span", lineNumber, "line-no");
      number.setAttribute("aria-hidden", "true");
      const text = element("span", undefined, "code-text");
      if (line.trimStart().startsWith("#")) text.classList.add("code-comment");
      if (line.includes("[[blank]]")) {
        const { hint } = lesson().steps[stage];
        const label = "第 " + (stage + 1) + " 空";
        const input = element("input");
        input.dataset.slot = String(stage);
        input.value = fillsNow()[stage] || "";
        input.placeholder = label;
        input.maxLength = 20;
        input.autocomplete = "off";
        input.autocapitalize = "off";
        input.spellcheck = false;
        input.setAttribute("aria-label", label + "。" + hint);
        input.onfocus = () => {
          focused = input;
          ui.hint.textContent = label + " · " + hint;
        };
        input.oninput = () => {
          fillsNow()[stage] = input.value;
          completed.delete(current);
          save();
          updateScore();
          scheduleRun(stage);
        };
        text.append(...line.split("[[blank]]").flatMap((part, index) => index ? [input, part] : [part]));
        slots.push({ key: stage, number: stage + 1, line: lineNumber, input });
      } else {
        text.textContent = line;
      }
      row.append(number, text);
      rows.push(row);
    }
  }
  addRows(scenarioSetup(lesson(), variant));
  lesson().steps.forEach(({ code }, index) => addRows("\n" + code, index));
  ui.editor.replaceChildren(...rows);
}

function selectLesson(index) {
  current = index;
  ui["lesson-title"].textContent = lesson().title;
  ui.goal.textContent = lesson().goal;
  ui.scenario.replaceChildren(...lesson().scenarios.map(([name], i) => new Option(name, i)));
  loadScenario(0);
}

function loadScenario(index) {
  variant = index;
  previousPlan = [];
  drawEditor();
  updateScore();
  scheduleRun();
}

function displayError(mode, message, line, stage = null) {
  ui.error.textContent = message;
  ui.error.hidden = false;
  status(mode, "查看右侧反馈，检查对应的代码行。", "error");
  flightEvidence(ui, stage, mode, "", "无人机保持当前位置。修改相应空格后再试。", "blocked");
  if (line) ui.editor.querySelector('[data-line="' + line + '"]')?.classList.add("error-line");
}

function commandFrom([action, value, other, point]) {
  switch (action) {
    case "move": return {
      action, x: value, y: other, speed: 13,
      label: point ? "飞往 " + point : "飞往 (" + value + ", " + other + ")",
    };
    case "altitude": return { action, height: value, speed: 8, label: value ? "调整至 " + value + " m" : "降落至 0 m" };
    case "spin": return { action, turns: value, direction: "right", speed: 160, label: "自旋 " + value + " 圈" };
    case "figure8": return { action, loops: value, scale: 15, speed: 12, label: value === 0.5 ? "半圈 8 字" : "整圈 8 字" };
    default: throw new Error("飞行指令类型无效。");
  }
}

function showEvidence(index) {
  const [, value, flight] = evidence[index];
  const stage = slots[index];
  const labels = flight.map(commandFrom).map(command => command.label);
  flightEvidence(ui, stage, lesson().steps[index].title, value, "本空动作 · " + labels.join(" → "));
  shownStep = index;
}

function showPlan(plan, from) {
  commands = plan.map(({ move, stepIndex }) => ({ ...commandFrom(move), stepIndex }));
  origin = from;
  ui.plan.replaceChildren(...commands.map(command => element("li", command.label)));
  scene.play(commands, { from });
}

async function execute(requested) {
  stopRun();
  const run = revision;
  const limit = requested === undefined ? slots.length : requested + 1;
  const replacements = [];
  for (const stage of slots.slice(0, limit)) {
    const value = stage.input.value.trim().replace(/\s+/g, " ");
    if (!value) break;
    const [allowed, instruction] = tokenRules[lesson().steps[stage.key].kind];
    if (!allowed.test(value)) {
      stage.input.setAttribute("aria-invalid", "true");
      displayError("检查填写格式", instruction, stage.line, stage);
      return;
    }
    replacements.push(value);
  }
  if (!replacements.length || (requested !== undefined && replacements.length < limit)) {
    status("等待填空", "先补全前面第一个还未填完的语句。");
    flightEvidence(ui, null, "等待前面的空格", "", "按顺序补全语句，当前空才能执行。", "blocked");
    return;
  }
  const last = slots[replacements.length - 1];
  flightEvidence(ui, last, lesson().steps[last.key].title, "", "正在运行本空及前面的完整语句。", "working");
  status("运行 Python", "正在核对代码结果和飞行指令。");
  const { source, lineMap } = compileAttempt(scenarioSetup(lesson(), variant), lesson().steps, replacements);
  const result = await runPython(source, {
    entry: "uav_list_manager.py",
    onStatus: event => {
      if (run === revision && event.stage === "loading") {
        status("加载 Python", "首次加载后，浏览器会缓存运行资源。");
      }
    },
  });
  if (run !== revision) return;
  if (!result.ok) {
    if (lesson().steps[last.key].kind === "exception" && result.errorType === "TypeError") {
      displayError("Python 报错", result.error, last.line, last);
    } else {
      const line = lineMap.get(result.line);
      displayError("Python 报错", result.error, line, slots.find(stage => stage.line === line) || last);
    }
    return;
  }
  const observations = result.events.findLast(event => event.type === "result")?.scope.observations;
  if (!Array.isArray(observations) || !observations.length) {
    displayError("未生成结果", "Python 没有返回本次运行的结果。");
    return;
  }
  const stage = slots[observations.length - 1];
  const [passed, value, ownPlan] = observations.at(-1);
  const title = lesson().steps[stage.key].title;
  ui.output.textContent = observations.map(([, rendered], i) => (i + 1) + ". " + lesson().steps[i].title + "  " + rendered).join("\n");
  if (!passed) {
    flightEvidence(ui, stage, title, value, "运行结果与任务目标不符，无人机保持当前位置。", "blocked");
    status("检查运行结果", "对照本空的提示和右侧清单，再改一次。", "error");
    stage.input.setAttribute("aria-invalid", "true");
    return;
  }
  const flight = observations.flatMap(([, , moves], stepIndex) => moves.map(move => ({ move, stepIndex })));
  const plan = flight.map(({ move }) => move);
  const fresh = newCommands(previousPlan, plan);
  const motion = requested === undefined ? flight : flight.slice(-Math.max(fresh.length, ownPlan.length));
  const from = requested !== undefined && scene.state.z > 0 ? { ...scene.state } : undefined;
  try {
    evidence = observations;
    showPlan(motion, from);
    previousPlan = plan;
  } catch (error) {
    stopRun();
    displayError("检查飞行指令", error.message, stage.line, stage);
    return;
  }
  if (replacements.length === slots.length) {
    completed.add(current);
    save();
    updateScore();
    status("本情境通过", "可切换任务情境，观察同一段代码如何改变飞行。");
  } else {
    status("阶段飞行", "观察本空的实际结果和动作，然后继续填写。");
  }
}

lessons.forEach(({ name }, index) => {
  const button = element("button", undefined, "mission");
  button.type = "button";
  const flag = element("small", "✓");
  flag.setAttribute("aria-hidden", "true");
  button.append(element("span", name), flag);
  button.onclick = () => selectLesson(index);
  ui.missions.append(button);
});

ui.scenario.onchange = () => loadScenario(Number(ui.scenario.value));
ui.auto.onchange = () => {
  if (!ui.auto.checked) clearTimeout(timer);
  else scheduleRun();
};
ui.run.onclick = () => execute();
ui.editor.onkeydown = event => {
  if (event.key === "Enter" && !event.isComposing && event.target.dataset.slot !== undefined) {
    event.preventDefault();
    execute(Number(event.target.dataset.slot));
  }
};
ui["hint-button"].onclick = () => {
  (focused || slots.find(({ input }) => !input.value.trim())?.input || slots[0]?.input)?.focus();
};
ui.clear.onclick = () => {
  fills[current] = [];
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
