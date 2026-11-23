import { FlightView } from './flight-view.js';
import { lessons } from './lessons.js';
import { prewarmPython, runPython } from './runtime.js';

const $ = id => document.getElementById(id);
const storageKey = 'uav-batch-flight-v1';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch {}
const records = saved.records || {};
let index = Math.max(0, lessons.findIndex(lesson => lesson.id === saved.current));
let scenarioIndex = 0;
let selected = null;
let revision = 0;
let timer;
let playable = false;
let activeQueue = -1;
const current = () => lessons[index];
const record = () => records[current().id] ||= { values: {}, done: false };
const answers = () => record().values;
const hasInput = () => current().blanks.some(blank => answers()[blank.id]?.trim());

const scene = new FlightView($('canvas'), { onUpdate: updateFlight });

function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({ records, current: current().id })); } catch {}
}

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function say(text, error = false) {
  $('coach').textContent = text;
  $('coach').classList.toggle('error', error);
}

function sameCode(value, answer) {
  const parts = source => source.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s]/g)?.join('') || '';
  return parts(value.trim()) === parts(answer.trim());
}

function accepted(blank, value) {
  if (!value?.trim()) return false;
  if (blank.numeric) {
    const number = Number(value);
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()) &&
      number >= blank.numeric[0] && number <= blank.numeric[1];
  }
  return [blank.answer, ...(blank.accepted || [])].some(answer => sameCode(value, answer));
}

function updateProgress() {
  const done = lessons.filter(lesson => records[lesson.id]?.done).length;
  $('courseProgress').textContent = done + ' / ' + lessons.length + ' 关完成';
  const filled = current().blanks.filter(blank => answers()[blank.id]?.trim()).length;
  $('blankProgress').textContent = filled + ' / ' + current().blanks.length + ' 空';
  Array.from($('missions').children).forEach((button, i) => {
    button.firstElementChild.textContent = String(i + 1).padStart(2, '0') + (records[lessons[i].id]?.done ? ' ✓' : '');
  });
}

function renderTabs() {
  $('missions').replaceChildren(...lessons.map((lesson, i) => {
    const button = node('button');
    if (i === index) button.setAttribute('aria-current', 'step');
    button.append(node('span'), document.createTextNode(lesson.shortTitle || lesson.title));
    button.onclick = () => load(i);
    return button;
  }));
}

function appendCode(parent, source) {
  const tokens = /#.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:for|in|if|else|def|return|and|or|not|lambda|True|False|None|print|len|list|zip|map|filter|set|round|range|enumerate|str)\b|\b\d+(?:\.\d+)?\b/g;
  let position = 0;
  for (const match of source.matchAll(tokens)) {
    parent.append(document.createTextNode(source.slice(position, match.index)));
    const value = match[0];
    const kind = value.startsWith('#') ? 'comment' : /^["']/.test(value) ? 'str' : /^\d/.test(value) ? 'number' : 'keyword';
    parent.append(node('span', value, 'token ' + kind));
    position = match.index + value.length;
  }
  parent.append(document.createTextNode(source.slice(position)));
}

function styleBlank(input, blank) {
  const value = input.value;
  input.style.width = Math.min(34, Math.max(5, value.length + 2, blank.answer.length + 2)) + 'ch';
  input.classList.toggle('good', accepted(blank, value));
  input.classList.toggle('check', Boolean(value.trim()) && !accepted(blank, value));
}

function renderEditor() {
  const fields = new Map(current().blanks.map((blank, i) => [blank.id, { ...blank, order: i + 1 }]));
  $('editor').replaceChildren(...current().code.split('\n').map((line, i) => {
    const row = node('div', undefined, 'code-line');
    row.dataset.line = i + 1;
    row.append(node('span', String(i + 1), 'line-number'));
    const body = node('div', undefined, 'line-body');
    let position = 0;
    for (const match of line.matchAll(/\{\{(\w+)\}\}/g)) {
      appendCode(body, line.slice(position, match.index));
      const blank = fields.get(match[1]);
      const input = node('input', undefined, 'blank');
      input.type = 'text';
      input.value = answers()[blank.id] || '';
      input.placeholder = '空 ' + blank.order;
      input.spellcheck = false;
      input.autocomplete = 'off';
      input.autocapitalize = 'off';
      input.setAttribute('aria-label', '第 ' + blank.order + ' 空');
      input.dataset.blank = blank.id;
      input.onfocus = () => { selected = blank; };
      input.oninput = () => {
        answers()[blank.id] = input.value;
        persist();
        styleBlank(input, blank);
        updateProgress();
        invalidate();
        if (!hasInput()) {
          say('请先填写至少一个空格。');
          return;
        }
        say($('auto').checked ? '已记录修改，正在准备预演。' : '已记录修改，点击“运行代码”查看飞行结果。');
        if ($('auto').checked) timer = setTimeout(() => execute(), 650);
      };
      styleBlank(input, blank);
      body.append(input);
      position = match.index + match[0].length;
    }
    appendCode(body, line.slice(position));
    row.append(body);
    return row;
  }));
  updateProgress();
}

function getData() {
  return current().scenarios?.[scenarioIndex]?.data ?? current().data ?? '';
}

function invalidate() {
  revision++;
  clearTimeout(timer);
  $('run').disabled = !hasInput();
  playable = false;
  scene.reset();
  renderQueue([]);
  $('values').replaceChildren();
  $('output').classList.remove('error');
  $('output').textContent = '# 运行结果将在这里显示。';
  $('resultMode').textContent = '待运行';
  $('editor').querySelectorAll('.error-line').forEach(line => line.classList.remove('error-line'));
}

function load(next) {
  index = next;
  scenarioIndex = 0;
  selected = null;
  invalidate();
  $('topic').textContent = current().topic;
  $('missionTitle').textContent = current().title;
  $('description').textContent = current().description;
  $('challenge').textContent = current().challenge;
  $('concept').textContent = current().concept;
  $('data').textContent = getData();
  $('scenarioWrap').hidden = !current().scenarios?.length;
  $('scenario').replaceChildren(...(current().scenarios || []).map((scenario, i) => {
    const option = node('option', scenario.label);
    option.value = i;
    return option;
  }));
  $('next').textContent = index < lessons.length - 1 ? '下一关 →' : '回到第一关 ↺';
  renderTabs();
  renderEditor();
  if ($('missions').scrollWidth > $('missions').clientWidth) {
    const button = $('missions').children[index];
    $('missions').scrollLeft = Math.max(0, button.offsetLeft - $('missions').offsetLeft - 8);
  }
  say('先填写一个空格。需要帮助时，可以点击“提示”。');
  persist();
}

function commandLabel(command, previousHeight) {
  switch (command.action) {
    case 'move': return '飞往 (' + command.x + ', ' + command.y + ')';
    case 'altitude': return (command.height > previousHeight ? '升至 ' : command.height < previousHeight ? '降至 ' : '保持 ') + command.height + ' m';
    case 'spin': return (command.direction === 'left' ? '左' : '右') + '旋 ' + command.turns + ' 圈';
    case 'figure8': return '8 字 ' + command.loops + ' 圈';
    case 'orbit': return '环绕 ' + command.laps + ' 圈 · ' + command.radius + ' m';
    case 'route': return '巡航 ' + command.points.length + ' 个航点';
    case 'return': return '返航降落';
    case 'configure': return '设置飞行参数';
    default: return String(command.action);
  }
}

function renderQueue(commands) {
  activeQueue = -1;
  let lastHeight = 10;
  $('queue').replaceChildren(...commands.map((command, i) => {
    const label = commandLabel(command, lastHeight);
    lastHeight = command.action === 'return' ? 0 : command.height ?? command.params?.height ?? lastHeight;
    return node('li', (i + 1) + ' · ' + label);
  }));
  $('queueCount').textContent = commands.length + ' 条';
  $('queueEmpty').hidden = commands.length > 0;
  $('queueEmpty').textContent = '填一个空，看看数据怎样生成飞行指令。';
}

function updateFlight(state) {
  for (const [key, unit] of [['x', 'm'], ['y', 'm'], ['z', 'm'], ['yaw', '°']]) {
    const value = Math.abs(state[key]) < 0.045 ? 0 : state[key];
    const formatted = value.toFixed(key === 'yaw' ? 0 : 1) + ' ';
    const element = $(key);
    if (element.firstChild.textContent !== formatted) element.replaceChildren(document.createTextNode(formatted), node('small', unit));
  }
  $('flightProgress').value = state.totalProgress || 0;
  $('pause').disabled = !state.playing;
  $('pause').textContent = state.paused ? '继续' : '暂停';
  $('replay').disabled = !playable;
  const label = !playable ? '等待指令' : state.paused ? '已暂停' : state.playing ? '执行 ' + (state.index + 1) + ' / ' + state.total : '回放完成';
  if ($('flightStatus').textContent !== label) $('flightStatus').textContent = label;
  const activated = state.playing ? state.index : -1;
  if (activated !== activeQueue) {
    $('queue').children[activeQueue]?.classList.remove('active');
    $('queue').children[activated]?.classList.add('active');
    activeQueue = activated;
  }
}

function renderValues(values) {
  $('values').replaceChildren(...Object.entries(values || {}).map(([name, value]) => {
    const line = node('div');
    const term = node('dt', name);
    term.append(node('small', value.type));
    line.append(term, node('dd', value.repr));
    return line;
  }));
}

async function execute({ jump = false } = {}) {
  invalidate();
  if (!hasInput()) {
    say('请先填写至少一个空格。');
    return;
  }
  const token = revision;
  const lesson = current();
  const empty = lesson.blanks.filter(blank => !answers()[blank.id]?.trim()).length;
  const matched = lesson.blanks.every(blank => accepted(blank, answers()[blank.id]));
  const blanks = new Map(lesson.blanks.map(blank => [blank.id, blank]));
  const data = getData();
  const code = lesson.code.replace(/\{\{(\w+)\}\}/g, (_, id) => answers()[id]?.trim() || blanks.get(id).answer);
  $('run').disabled = true;
  $('resultMode').textContent = '运行中';
  say(empty ? '预演：暂用参考值补齐剩余 ' + empty + ' 空。' : '正在运行 Python。');
  let result;
  try {
    result = await runPython(data + '\n\n' + code, lesson.watch, { onStatus: ({ stage }) => {
      if (token === revision) $('resultMode').textContent = stage === 'loading' ? '加载 Python' : '运行中';
    } });
  } catch (error) {
    result = { ok: false, error: error.message };
  }
  if (token !== revision) return;
  $('run').disabled = false;
  if (result.cancelled) {
    $('resultMode').textContent = '已取消';
    say('本次执行已取消，可以重新运行。');
    return;
  }
  renderValues(result.values);
  $('output').textContent = [result.output, result.error].filter(Boolean).join('\n') || '# 本次代码没有 print() 输出。';
  if (!result.ok) {
    $('resultMode').textContent = '运行错误';
    $('output').classList.add('error');
    const line = result.line - data.split('\n').length - 1;
    if (line > 0) $('editor').querySelector('[data-line="' + line + '"]')?.classList.add('error-line');
    say('Python 运行失败。' + (line > 0 ? '请查看代码第 ' + line + ' 行及右侧错误信息。' : '请查看右侧错误信息。'), true);
    return;
  }
  const commands = result.commands || [];
  $('resultMode').textContent = empty ? '部分预演' : '实际运行';
  try {
    playable = commands.length > 0;
    renderQueue(commands);
    scene.play(commands);
  } catch (error) {
    playable = false;
    scene.reset();
    renderQueue([]);
    say('指令格式或范围需调整：' + error.message, true);
    return;
  }
  if (matched) {
    record().done = true;
    persist();
    updateProgress();
  }
  if (!commands.length) {
    $('flightStatus').textContent = '无飞行动作';
    $('queueEmpty').textContent = '处理结果未生成飞行指令。试试调整条件或切换情境。';
  }
  if (matched) say('本关完成。试试换一个情境或数值，预测它会怎样改变航迹。');
  else if (empty) say('预演已运行，剩余 ' + empty + ' 空暂用参考值。补齐后可完成本关。');
  else say('Python 已运行。可点一个待核对的空格，再按“提示”检查本关知识点。');
  if (jump && matchMedia('(max-width: 720px)').matches) $('flightPanel').scrollIntoView({ block: 'start' });
}

$('toggleData').onclick = () => {
  $('data').hidden = !$('data').hidden;
  $('toggleData').setAttribute('aria-expanded', String(!$('data').hidden));
  $('toggleData').textContent = $('data').hidden ? '▸ 查看原始日志' : '▾ 收起原始日志';
};
$('scenario').onchange = () => {
  scenarioIndex = Number($('scenario').value);
  $('data').textContent = getData();
  invalidate();
  if (!hasInput()) say('情境已换好，填写一个空格后就可以预演。');
  else if ($('auto').checked) execute();
  else say('情境已换好，运行同一段代码观察差异。');
};
$('auto').onchange = () => { clearTimeout(timer); };
$('run').onclick = () => execute({ jump: true });
$('hint').onclick = () => {
  const blank = selected || current().blanks.find(item => !accepted(item, answers()[item.id])) || current().blanks[0];
  say('第 ' + (current().blanks.findIndex(item => item.id === blank.id) + 1) + ' 空：' + blank.hint);
  $('editor').querySelector('[data-blank="' + blank.id + '"]')?.focus();
};
$('reset').onclick = () => {
  record().values = {};
  record().done = false;
  persist();
  invalidate();
  selected = null;
  renderEditor();
  say('本关填空已清空。');
};
$('pause').onclick = () => scene.setPaused($('pause').textContent === '暂停');
$('replay').onclick = () => { if (playable) scene.replay(); };
$('rate').onchange = () => scene.setPlaybackRate(Number($('rate').value));
$('camera').onclick = () => scene.resetCamera();
$('topView').onclick = () => scene.topView();
$('next').onclick = () => { load((index + 1) % lessons.length); $('missionTitle').scrollIntoView({ block: 'nearest' }); };
document.addEventListener('keydown', event => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    execute({ jump: true });
  }
});
window.addEventListener('pagehide', event => { if (!event.persisted) scene.destroy(); });
scene.setPlaybackRate(Number($('rate').value));
load(index);
prewarmPython().catch(() => {});
