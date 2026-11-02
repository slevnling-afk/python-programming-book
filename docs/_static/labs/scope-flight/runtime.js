/** Every attempt runs real Python in a fresh, disposable worker. */
export const runtimeReady = typeof Worker !== 'undefined';

export function runPython(code, { onEvent, onOutput } = {}) {
  const events = [];
  let output = '';
  const failure = (error, errorType = 'RuntimeError') => ({
    ok: false, output, error, errorType, events,
  });
  if (!runtimeReady) {
    return Promise.resolve(failure('当前浏览器不支持 Web Worker，请使用新版 Edge 或 Chrome。', 'BrowserError'));
  }
  return new Promise((resolve) => {
    let worker;
    let finished = false;
    let watchdog;
    const finish = (result) => {
      if (finished) return;
      finished = true;
      clearTimeout(watchdog);
      worker?.terminate();
      resolve({ ...result, output, events });
    };
    try {
      worker = new Worker(new URL('./python-worker.js', import.meta.url));
      watchdog = setTimeout(() => finish(failure('运行超过 4 秒，已停止。请检查循环是否能结束。', 'TimeLimitError')), 4000);
      worker.onmessage = ({ data }) => {
        if (finished) return;
        if (data.kind === 'output') {
          output += data.text;
          events.push({ type: 'output', text: data.text });
          try { onOutput?.(data.text); } catch { /* A UI observer cannot stop Python. */ }
        } else if (data.kind === 'event') {
          events.push(data.event);
          try { onEvent?.(data.event); } catch { /* Preserve the actual execution result. */ }
        } else if (data.kind === 'done') {
          finish({ ok: data.ok, error: data.error ?? null, errorType: data.errorType ?? null });
        }
      };
      worker.onerror = (event) => {
        event.preventDefault();
        finish(failure('Python 运行环境加载失败，请刷新网页重试。' + (event.message ? '\n' + event.message : ''), 'WorkerError'));
      };
      worker.postMessage({ code: String(code) });
    } catch (error) {
      finish(failure('无法启动 Python 运行环境。请通过网站地址打开实验室。\n' + error.message, 'WorkerError'));
    }
  });
}
