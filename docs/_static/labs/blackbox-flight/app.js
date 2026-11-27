import { FlightView } from './flight-view.js';
import { lessons } from './lessons.js';
import { cancelPython, prewarmPython, runPython } from '../file-read-flight/runtime.js';

const $ = id => document.getElementById(id);
const storageKey = 'uav-blackbox-flight-v1';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch {}
const records = saved.records || {};
let index = Math.max(0, lessons.findIndex(lesson => lesson.id === saved.current));
let scenarioIndex = 0;
let fileName = '';
let fileSnapshots = null;
let showOutputFiles = false;
let fileEvents = [];
let activeEvent = -1;
let displayBytes = true;
let displayedSource = null;
let selected = null;
let revision = 0;
let timer;
let playable = false;
let activeQueue = -1;
const current = () => lessons[index];
const record = () => records[current().id] ||= { values: {}, done: false };
const answers = () => record().values;
const fixtureFiles = () => current().scenarios[scenarioIndex].files;
const stageMarker = /^\s*#\s*@stage\b/;

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
    const literal = blank.integer ? /^[+-]?\d+$/ : /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
    return literal.test(value.trim()) &&
      number >= blank.numeric[0] && number <= blank.numeric[1];
  }
  return [blank.answer, ...(blank.accepted || [])].some(answer => sameCode(value, answer));
}

function updateProgress() {
  const done = lessons.filter(lesson => records[lesson.id]?.done).length;
  $('courseProgress').textContent = done + ' / ' + lessons.length + ' 关完成';
  const filled = current().blanks.filter(blank => answers()[blank.id]?.trim()).length;
  $('blankProgress').textContent = filled + ' / ' + current().blanks.length + ' 空';
  const ready = readyStages();
  $('editor').querySelectorAll('.stage-heading').forEach((heading, i) => {
    heading.classList.toggle('stage-ready', i < ready);
    heading.classList.toggle('stage-next', i === ready);
    heading.querySelector('span').textContent = i < ready ? '可运行' : i === ready ? '当前段' : '';
  });
  Array.from($('missions').children).forEach((button, i) => {
    button.firstElementChild.textContent = String(i + 1).padStart(2, '0') + (records[lessons[i].id]?.done ? ' ✓' : '');
  });
}

function stages(lesson = current()) {
  const lines = lesson.code.split('\n');
  const sections = [];
  let start = 0;
  const add = end => {
    const text = lines.slice(start, end).join('\n');
    if (!text.trim()) return;
    sections.push({
      start,
      end,
      ids: Array.from(text.matchAll(/\{\{(\w+)\}\}/g), match => match[1]),
      label: lesson.stages?.[sections.length]?.label
    });
  };
  lines.forEach((line, i) => {
    if (stageMarker.test(line)) {
      add(i);
      start = i + 1;
    }
  });
  add(lines.length);
  return sections;
}

function readyStages(sections = stages()) {
  let count = 0;
  let hasCompletedBlank = false;
  for (const section of sections) {
    if (!section.ids.every(id => answers()[id]?.trim())) break;
    if (section.ids.length) hasCompletedBlank = true;
    count++;
  }
  return hasCompletedBlank ? count : 0;
}

function pendingText() {
  const sections = stages();
  const ready = readyStages(sections);
  if (ready === sections.length) return '所有空格已填写，可以运行完整代码。';
  const pending = sections.findIndex((section, i) => i >= ready && section.ids.some(id => !answers()[id]?.trim()));
  if (pending < 0) return '请先填写本关代码。';
  const remaining = sections[pending].ids.filter(id => !answers()[id]?.trim()).length;
  return '第 ' + (pending + 1) + ' 段还有 ' + remaining + ' 空。填完本段后即可预演。';
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
  const sections = new Map(stages().map((section, i) => [section.start, { ...section, number: i + 1 }]));
  $('editor').replaceChildren(...current().code.split('\n').map((line, i) => {
    if (stageMarker.test(line)) return document.createDocumentFragment();
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
        clearTimeout(timer);
        const runnable = runnableCode();
        if (runnable?.code === displayedSource) {
          say(pendingText());
          return;
        }
        invalidate();
        if (!runnable) {
          say(pendingText());
          return;
        }
        say($('auto').checked ? '正在准备预演。' + pendingText() : pendingText());
        if ($('auto').checked) timer = setTimeout(() => execute(), 650);
      };
      styleBlank(input, blank);
      body.append(input);
      position = match.index + match[0].length;
    }
    appendCode(body, line.slice(position));
    row.append(body);
    const section = sections.get(i);
    if (!section) return row;
    const fragment = document.createDocumentFragment();
    const heading = node('div', undefined, 'stage-heading');
    heading.append(document.createTextNode('第 ' + section.number + ' 段' + (section.label ? ' · ' + section.label : '')), node('span'));
    fragment.append(heading, row);
    return fragment;
  }));
  updateProgress();
}

function visibleFiles() {
  if (showOutputFiles && fileSnapshots) return fileSnapshots;
  return Object.fromEntries(Object.entries(fixtureFiles()).map(([path, content]) => {
    const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
    return [path, { bytes: Array.from(bytes.slice(0, 256)), size: bytes.length, truncated: bytes.length > 256 }];
  }));
}

const hex = (value, min = 2) => value.toString(16).toUpperCase().padStart(min, '0');
const relativePath = path => String(path || '').replace(/^\/flight-lab\//, '');

function renderByteGrid(bytes, event, size) {
  const start = event?.before;
  const end = event?.after;
  const showRange = Number.isInteger(start) && Number.isInteger(end) && end > start &&
    ['read', 'readline', 'readlines', 'iterate', 'write', 'writelines'].includes(event.operation);
  const rows = [];
  for (let offset = 0; offset < bytes.length; offset += 8) {
    const row = node('div', undefined, 'byte-row');
    row.append(node('code', hex(offset, 4), 'byte-address'));
    bytes.slice(offset, offset + 8).forEach((value, i) => {
      const address = offset + i;
      const cell = node('code', hex(value), 'byte-cell');
      cell.title = '偏移 ' + address + ' · 0x' + hex(value);
      if (showRange && address >= start && address < end) cell.classList.add('byte-range');
      if (address === end) cell.classList.add('byte-position');
      row.append(cell);
    });
    rows.push(row);
  }
  if (!rows.length) rows.push(node('p', '（空文件）', 'file-empty'));
  if (Number.isInteger(end) && end === size) rows.push(node('p', '位置 ' + end + ' · 文件末尾', 'file-empty'));
  $('bytesGrid').replaceChildren(...rows);
}

function showFiles() {
  const files = visibleFiles();
  const paths = Object.keys(files);
  if (!Object.hasOwn(files, fileName)) fileName = paths[0] || '';
  const file = files[fileName];
  $('beforeFiles').setAttribute('aria-pressed', String(!showOutputFiles));
  $('afterFiles').setAttribute('aria-pressed', String(showOutputFiles));
  $('afterFiles').disabled = fileSnapshots === null;
  $('files').replaceChildren(...paths.map(path => {
    const button = node('button', path);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(path === fileName));
    button.onclick = () => {
      fileName = path;
      activeEvent = -1;
      showFiles();
      $('files').children[paths.indexOf(path)].focus();
    };
    return button;
  }));
  $('fileEvents').querySelectorAll('button').forEach(button => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.event) === activeEvent));
  });
  $('dataTools').hidden = !file;
  $('data').hidden = !file || displayBytes;
  $('codecLabel').hidden = displayBytes;
  $('bytesGrid').hidden = Boolean(file) && !displayBytes;
  $('hexView').setAttribute('aria-pressed', String(displayBytes));
  $('textView').setAttribute('aria-pressed', String(!displayBytes));
  if (!file) {
    $('bytesGrid').replaceChildren(node('p', '目录为空，完成写入后可在这里检查字节。', 'file-empty'));
    $('cursorNote').hidden = true;
    return;
  }
  $('fileSize').textContent = file.size + ' 字节' + (file.truncated ? ' · 显示前 ' + file.bytes.length + ' 字节' : '');
  const event = fileEvents[activeEvent];
  const related = showOutputFiles && event && relativePath(event.path) === fileName ? event : null;
  const binaryPosition = related?.mode?.includes('b') ? related : null;
  if (displayBytes) {
    renderByteGrid(file.bytes, binaryPosition, file.size);
  } else {
    try {
      const encoding = $('codec').value;
      const decoder = new TextDecoder(encoding === 'utf-8-sig' ? 'utf-8' : encoding, {
        fatal: true, ignoreBOM: encoding !== 'utf-8-sig'
      });
      const text = decoder.decode(new Uint8Array(file.bytes), { stream: file.truncated });
      $('data').textContent = text.replace(/^\uFEFF/, '〈BOM〉') || '（空文件）';
    } catch {
      $('data').textContent = '当前编码无法解码这组字节。可以切换编码，或查看十六进制。';
    }
  }
  $('cursorNote').hidden = !related;
  if (related) {
    const displayPosition = value => value == null ? '—' : value;
    const positions = displayPosition(related.before) + ' → ' + displayPosition(related.after);
    let detail = '文本模式的位置由 Python 返回，可以传给 seek()。';
    if (!Number.isInteger(related.after)) detail = '该操作未返回下一读取位置。';
    else if (binaryPosition && related.after > file.size) detail = '该位置超出最终文件大小。';
    else if (binaryPosition && related.after === file.size) detail = '此时指针在文件末尾。';
    else if (binaryPosition && related.after >= file.bytes.length) detail = '该位置超出当前字节预览范围。';
    else if (binaryPosition) detail = '有边框的字节是下一读取位置。';
    $('cursorNote').textContent = '所选操作的位置 ' + positions + '。' + detail;
  }
}

function runnableCode() {
  const sections = stages();
  const ready = readyStages(sections);
  if (!ready) return null;
  const code = current().code.split('\n').slice(0, sections[ready - 1].end).join('\n')
    .replace(/\{\{(\w+)\}\}/g, (_, id) => answers()[id].trim());
  return { code, ready, total: sections.length };
}

function invalidate() {
  revision++;
  clearTimeout(timer);
  cancelPython();
  displayedSource = null;
  fileSnapshots = null;
  showOutputFiles = false;
  fileEvents = [];
  activeEvent = -1;
  $('run').disabled = !readyStages();
  playable = false;
  scene.reset();
  renderQueue([]);
  $('values').replaceChildren();
  $('fileEvents').replaceChildren();
  showFiles();
  $('output').classList.remove('error');
  $('output').textContent = '# 运行结果将在这里显示。';
  $('resultMode').textContent = '待运行';
  $('editor').querySelectorAll('.error-line').forEach(line => line.classList.remove('error-line'));
}

function load(next) {
  index = next;
  scenarioIndex = 0;
  fileName = '';
  displayBytes = true;
  $('codec').value = 'utf-8';
  selected = null;
  invalidate();
  $('topic').textContent = current().topic;
  $('missionTitle').textContent = current().title;
  $('description').textContent = current().description;
  $('challenge').textContent = current().challenge;
  $('concept').textContent = current().concept;
  showFiles();
  $('scenarioWrap').hidden = current().scenarios.length < 2;
  $('scenario').replaceChildren(...current().scenarios.map((scenario, i) => {
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
  say(pendingText());
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
  $('queueEmpty').textContent = '完成一段代码，看看文件里的数据怎样生成飞行指令。';
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

function renderFileEvents(events) {
  fileEvents = events || [];
  const names = { open: '打开', read: '读取', readline: '读一行', readlines: '读多行', iterate: '迭代一行', tell: '查看位置', seek: '移动指针', write: '写入', writelines: '写入多行', close: '关闭', cleanup: '环境清理' };
  const units = { characters: '字符', chars: '字符', bytes: '字节', lines: '行' };
  const paths = visibleFiles();
  const lastPointer = fileEvents.findLastIndex(event =>
    Number.isInteger(event.after) && Object.hasOwn(paths, relativePath(event.path))
  );
  activeEvent = lastPointer;
  if (lastPointer >= 0) fileName = relativePath(fileEvents[lastPointer].path);
  $('fileEvents').replaceChildren(...fileEvents.map((event, i) => {
    const count = event.count == null ? '' : ' · ' + event.count + ' ' + (units[event.unit] || event.unit || '');
    const position = event.before == null || event.after == null ? '' : ' · 文件位置 ' + event.before + ' → ' + event.after;
    const mode = event.operation === 'open' && event.mode ? ' (' + event.mode + ')' : '';
    const path = relativePath(event.path);
    const item = node('li');
    const status = event.error ? ' · ' + event.error : count + position;
    const detail = node('button');
    detail.type = 'button';
    detail.disabled = !Object.hasOwn(paths, path);
    detail.dataset.event = i;
    detail.setAttribute('aria-pressed', String(i === activeEvent));
    detail.append(node('strong', names[event.operation] || event.operation), node('code', path + mode), node('span', status));
    detail.onclick = () => {
      fileName = path;
      activeEvent = i;
      displayBytes = true;
      showOutputFiles = fileSnapshots !== null;
      $('logDock').hidden = false;
      $('toggleData').setAttribute('aria-expanded', 'true');
      $('toggleData').textContent = '▾ 收起文件检视';
      showFiles();
    };
    item.append(detail);
    return item;
  }));
  showFiles();
}

async function execute({ jump = false } = {}) {
  const runnable = runnableCode();
  invalidate();
  if (!runnable) {
    say(pendingText());
    return;
  }
  const token = revision;
  const lesson = current();
  const { code, ready, total } = runnable;
  displayedSource = code;
  const complete = ready === total;
  const matched = complete && lesson.blanks.every(blank => accepted(blank, answers()[blank.id]));
  $('run').disabled = true;
  $('resultMode').textContent = '运行中';
  say(complete ? '正在运行完整代码。' : '正在预演已完成的前 ' + ready + ' 段。');
  let result;
  try {
    result = await runPython(code, lesson.watch, { files: fixtureFiles(), captureFiles: true, onStatus: ({ stage }) => {
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
  fileSnapshots = result.fileSnapshots ?? null;
  showOutputFiles = fileSnapshots !== null;
  renderValues(result.values);
  renderFileEvents(result.fileEvents);
  $('output').textContent = [result.output, result.error].filter(Boolean).join('\n') || '# 本次代码没有 print() 输出。';
  if (!result.ok) {
    $('resultMode').textContent = '运行错误';
    $('output').classList.add('error');
    const line = result.line;
    if (line > 0) $('editor').querySelector('[data-line="' + line + '"]')?.classList.add('error-line');
    say('Python 运行失败。' + (line > 0 ? '请查看代码第 ' + line + ' 行及右侧错误信息。' : '请查看右侧错误信息。'), true);
    return;
  }
  const commands = result.commands || [];
  $('resultMode').textContent = complete ? '完整运行' : '已预演 ' + ready + ' / ' + total + ' 段';
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
    $('queueEmpty').textContent = complete ? '这次读取没有生成飞行指令。可以检查读取结果或切换情境。' :
      '这段代码尚未生成飞行指令。查看读取结果，再继续完成下一段。';
  }
  if (matched) say('本关完成。试试换一个情境或数值，预测它会怎样改变航迹。');
  else if (!complete) say('已运行前 ' + ready + ' 段。' + pendingText());
  else say('Python 已运行。可点一个待核对的空格，再按“提示”检查本关知识点。');
  if (jump && matchMedia('(max-width: 720px)').matches) $('flightPanel').scrollIntoView({ block: 'start' });
}

$('toggleData').onclick = () => {
  $('logDock').hidden = !$('logDock').hidden;
  $('toggleData').setAttribute('aria-expanded', String(!$('logDock').hidden));
  $('toggleData').textContent = $('logDock').hidden ? '▸ 查看文件检视' : '▾ 收起文件检视';
};
$('hexView').onclick = () => { displayBytes = true; showFiles(); };
$('textView').onclick = () => { displayBytes = false; showFiles(); };
$('codec').onchange = showFiles;
$('beforeFiles').onclick = () => { showOutputFiles = false; activeEvent = -1; showFiles(); };
$('afterFiles').onclick = () => { showOutputFiles = true; showFiles(); };
$('scenario').onchange = () => {
  scenarioIndex = Number($('scenario').value);
  fileName = '';
  invalidate();
  if (!readyStages()) say('情境已换好。' + pendingText());
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
$('camera').onclick = () => {
  scene.resetCamera();
  $('camera').setAttribute('aria-pressed', 'true');
  $('topView').setAttribute('aria-pressed', 'false');
};
$('topView').onclick = () => {
  scene.topView();
  $('camera').setAttribute('aria-pressed', 'false');
  $('topView').setAttribute('aria-pressed', 'true');
};
$('next').onclick = () => { load((index + 1) % lessons.length); $('missionTitle').scrollIntoView({ block: 'nearest' }); };
document.addEventListener('keydown', event => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    execute({ jump: true });
  }
});
window.addEventListener('pagehide', event => {
  if (!event.persisted) {
    cancelPython();
    scene.destroy();
  }
});
scene.setPlaybackRate(Number($('rate').value));
load(index);
prewarmPython().catch(() => {});
