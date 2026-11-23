const WORKER_URL = new URL('./python-worker.js', import.meta.url);
let workerState = null;
let currentJob = null;
let nextId = 0;

const failure = (errorType, error, extra = {}) => ({
  ok: false, output: '', commands: [], values: {}, line: null, errorType, error, ...extra,
});

function notify(callback, stage, message) {
  try { callback?.({ stage, message }); } catch { /* UI observers cannot interrupt Python. */ }
}

function finish(job, result) {
  if (currentJob !== job) return;
  currentJob = null;
  clearTimeout(job.timer);
  job.resolve(result);
}

function dispose(state, result) {
  if (workerState !== state) return;
  workerState = null;
  clearTimeout(state.timer);
  state.worker.terminate();
  state.resolveReady(false);
  if (currentJob?.state === state) finish(currentJob, result);
}

function getWorker() {
  if (workerState) return workerState;
  const worker = new Worker(WORKER_URL);
  const state = { worker, ready: false, resolveReady: null, timer: null };
  state.readyPromise = new Promise(resolve => { state.resolveReady = resolve; });
  workerState = state;
  worker.onmessage = ({ data }) => {
    if (workerState !== state) return;
    if (data.kind === 'ready') {
      state.ready = true;
      clearTimeout(state.timer);
      state.resolveReady(true);
    } else if (data.kind === 'boot-error') {
      dispose(state, failure('WorkerError', data.message));
    } else if (data.kind === 'result' && currentJob?.id === data.id) {
      finish(currentJob, data.result);
    }
  };
  worker.onerror = event => {
    event.preventDefault?.();
    dispose(state, failure('WorkerError', 'Python 环境启动失败。请通过教材站点打开实验室后重试。'));
  };
  worker.onmessageerror = () => dispose(state, failure('WorkerError', '无法读取 Python 的运行结果，请重试。'));
  state.timer = setTimeout(() => dispose(state, failure('TimeLimitError', 'Python 环境加载超时，请检查网络后重试。')), 75000);
  try {
    worker.postMessage({ kind: 'warm' });
  } catch (error) {
    dispose(state, failure('WorkerError', '无法加载 Python 运行环境。'));
    throw error;
  }
  return state;
}

export async function prewarmPython({ onStatus } = {}) {
  if (typeof Worker !== 'function') return false;
  try {
    const state = getWorker();
    if (!state.ready) notify(onStatus, 'loading', '正在加载教材站内置的 Python 环境。');
    const ready = await state.readyPromise;
    if (ready) notify(onStatus, 'ready', 'Python 环境就绪。');
    return ready;
  } catch {
    return false;
  }
}

export function cancelPython() {
  const job = currentJob;
  if (!job) return;
  const result = failure('CancelledError', '本次运行已取消。', { cancelled: true });
  // An executing worker cannot handle cancellation until Python returns. A
  // worker that is still loading can be reused by the next queued attempt.
  if (job.started) dispose(job.state, result);
  else finish(job, result);
}

export function runPython(source, watch = [], { onStatus } = {}) {
  cancelPython();
  if (typeof Worker !== 'function') {
    return Promise.resolve(failure('BrowserError', '当前浏览器不支持 Web Worker，请使用新版 Edge 或 Chrome。'));
  }
  const code = String(source ?? '');
  if (code.length > 60000) return Promise.resolve(failure('ValueError', '代码超过 60,000 字符，请缩短后再运行。'));
  const names = Array.isArray(watch) ? watch.filter(name => typeof name === 'string' && /^[A-Za-z_]\w{0,79}$/.test(name)).slice(0, 30) : [];
  let state;
  try {
    state = getWorker();
  } catch {
    return Promise.resolve(failure('WorkerError', '无法启动 Python 环境，请通过教材站点打开实验室。'));
  }
  return new Promise(resolve => {
    const job = { id: ++nextId, state, resolve, started: false, timer: null };
    currentJob = job;
    if (!state.ready) notify(onStatus, 'loading', '首次加载 Python 需要等待几秒，之后可以连续试飞。');
    void state.readyPromise.then(ready => {
      if (currentJob !== job) return;
      if (!ready) {
        finish(job, failure('WorkerError', 'Python 环境加载失败，请重试。'));
        return;
      }
      job.started = true;
      job.timer = setTimeout(() => dispose(state, failure('TimeLimitError', '代码运行超过时间限制，请检查循环或数据量。')), 7000);
      notify(onStatus, 'running', '正在运行当前 Python 代码。');
      if (currentJob !== job) return;
      try {
        state.worker.postMessage({ kind: 'run', id: job.id, source: code, watch: names });
      } catch {
        dispose(state, failure('WorkerError', '未能发送 Python 代码，请重试。'));
      }
    });
  });
}
