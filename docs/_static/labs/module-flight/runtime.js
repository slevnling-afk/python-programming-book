/** Real CPython/Pyodide. A newer attempt always cancels the older worker. */
export const runtimeReady = typeof Worker !== 'undefined';
let active = null;
export function cancelPython() { active?.cancel(); }

export function runPython(code, { files = {}, entry = 'main.py', installCommand = null, onEvent, onOutput, onStatus } = {}) {
  cancelPython();
  if (!runtimeReady) return Promise.resolve({ ok:false, events:[], output:'', error:'当前浏览器不支持 Web Worker，请使用新版 Edge 或 Chrome。', errorType:'BrowserError', imports:[], modules:[] });
  return new Promise(resolve => {
    const events = [], imports = [];
    let output = '', worker, timer, finished = false;
    const finish = result => {
      if (finished) return;
      finished = true; clearTimeout(timer); worker?.terminate();
      if (active?.worker === worker) active = null;
      resolve({ events, imports, output, modules:[], ...result });
    };
    const timeout = (ms, text) => { clearTimeout(timer); timer = setTimeout(() => finish({ok:false,errorType:'TimeLimitError',error:text}),ms); };
    try {
      worker = new Worker(new URL('./python-worker.js', import.meta.url));
      active = { worker, cancel:() => finish({ok:false,cancelled:true,errorType:'CancelledError',error:'本次运行已被新的操作取消。'}) };
      timeout(90000,'Python 环境加载超过 90 秒，请检查网络后重试。首次需要加载约 14 MB 的随页运行资源。');
      worker.onmessage = ({ data }) => {
        if (finished) return;
        if (data.kind === 'output') {
          output += data.text; events.push({type:'output',text:data.text});
          try { onOutput?.(data.text); } catch {}
        } else if (data.kind === 'event') {
          events.push(data.event); if (data.event.type === 'import') imports.push(data.event);
          try { onEvent?.(data.event); } catch {}
        } else if (data.kind === 'status') {
          if (data.stage === 'running') timeout(7000,'代码运行超过时间限制，已停止。请检查循环或递归是否能够结束。');
          try { onStatus?.({stage:data.stage,message:data.message}); } catch {}
        } else if (data.kind === 'done') finish(data.result);
      };
      worker.onerror = event => { event.preventDefault(); finish({ok:false,errorType:'WorkerError',error:'Python 环境启动失败：'+event.message}); };
      worker.postMessage({code:String(code),files,entry,installCommand});
    } catch (error) { finish({ok:false,errorType:'WorkerError',error:'无法启动 Python 环境，请通过网站地址打开实验室。\n'+error.message}); }
  });
}
