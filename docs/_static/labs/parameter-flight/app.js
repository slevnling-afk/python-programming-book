import { lessons } from './lessons.js';
import { DroneScene } from './drone.js';
import { runPython } from './runtime.js';

const $=id=>document.getElementById(id);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=value=>(String(value??'').trim().match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^"']+/g)||[]).map(s=>/^["']/.test(s)?s:s.replace(/\s+/g,'')).join('');
const KEY='parameter-flight-project-two-v1';
let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{}
let progress=saved.progress&&typeof saved.progress==='object'?saved.progress:{};
let index=Math.max(0,lessons.findIndex(l=>l.id===saved.current));
let scenarioId,focusId,revision=0,autoTimer,toastTimer,lastRun=null,paused=false,activeIndex=-1;
const titles={move:'坐标飞行',altitude:'定高升降',spin:'原地自旋',figure8:'8 字飞行',route:'航点巡航',configure:'飞行配置',orbit:'环绕飞行',return:'返航降落'};
const scene=new DroneScene($('droneCanvas'),{onUpdate:updateFlight,onFinish:finishFlight});
const current=()=>lessons[index];
const record=()=>progress[current().id]||=( {values:{},done:false} );
const scenario=()=>current().scenarios.find(s=>s.id===scenarioId)||current().scenarios[0];
const filled=b=>Boolean(record().values[b.id]?.trim());
function matches(b){
 const value=record().values[b.id]?.trim()||'';
 if(b.numberRange)return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)&&Number.isFinite(Number(value))&&Number(value)>=b.numberRange[0]&&Number(value)<=b.numberRange[1];
 return [b.answer,...(b.accepted||[])].some(a=>normalize(a)===normalize(value));
}
function persist(){try{localStorage.setItem(KEY,JSON.stringify({current:current().id,progress}));}catch{}}
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3000);}
function feedback(kind,title,text){$('feedback').className='feedback '+kind;$('feedback').innerHTML=`<i>${kind==='error'?'!':kind==='success'?'✓':'i'}</i><div><strong>${escape(title)}</strong><p>${escape(text)}</p></div>`;}
function highlight(code){
 const regex=/(#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:def|return|if|else|elif|for|in|is|not|and|or|None|True|False)\b|\b\d+(?:\.\d+)?\b|\b(?:print|int|float|type|round|len)\b)/g;
 let result='',last=0;
 for(const m of code.matchAll(regex)){result+=escape(code.slice(last,m.index));const t=m[0],kind=t[0]==='#'?'comment':/^["']/.test(t)?'string':/^\d/.test(t)?'number':/^(print|int|float|type|round|len)$/.test(t)?'function':'keyword';result+=`<span class="syntax-${kind}">${escape(t)}</span>`;last=m.index+t.length;}
 return result+escape(code.slice(last));
}
function updateProgress(){
 $('totalProgress').textContent=`${lessons.filter(l=>progress[l.id]?.done).length} / ${lessons.length} 任务完成`;
 $('blankCount').textContent=`${current().blanks.filter(matches).length} / ${current().blanks.length} 空`;
 document.querySelectorAll('.blank').forEach(input=>{const b=current().blanks.find(b=>b.id===input.dataset.blank),valid=filled(b)&&matches(b);input.classList.toggle('valid',valid&&!b.numberRange);input.classList.toggle('explore',valid&&!!b.numberRange);input.classList.toggle('invalid',filled(b)&&!valid);input.setAttribute('aria-invalid',String(filled(b)&&!valid));});
 document.querySelectorAll('.lesson-tab').forEach((tab,n)=>{tab.classList.toggle('done',!!progress[lessons[n].id]?.done);tab.querySelector('.check').textContent=progress[lessons[n].id]?.done?'✓':'·';});
}
function renderNav(){
 $('lessonNav').innerHTML=lessons.map((l,n)=>`<button class="lesson-tab${n===index?' active':''}" data-lesson="${n}" aria-current="${n===index?'step':'false'}"><span>MISSION ${String(n+1).padStart(2,'0')}<i class="check">${progress[l.id]?.done?'✓':'·'}</i></span><strong>${escape(l.shortTitle)}</strong></button>`).join('');
 $('lessonNav').querySelectorAll('button').forEach(b=>b.onclick=()=>load(Number(b.dataset.lesson)));
}
function renderEditor(){
 let number=0;
 $('editor').innerHTML=current().code.split('\n').filter(l=>!/^\s*#\s*@event\s+/.test(l)).map((line,n)=>{
  let text='',last=0;
  for(const m of line.matchAll(/\{\{([^}]+)\}\}/g)){text+=highlight(line.slice(last,m.index));const b=current().blanks.find(b=>b.id===m[1]),value=record().values[b.id]||'';number++;
   text+=`<input class="blank" data-blank="${escape(b.id)}" value="${escape(value)}" aria-label="第 ${number} 空：${escape(b.hint)}" title="${escape(b.hint)}${b.numberRange?' · 可探索 '+b.numberRange.join(' 至 '):''}" placeholder="${String(number).padStart(2,'0')} · 填写" autocomplete="off" autocapitalize="off" spellcheck="false" style="width:${inputWidth(value,b)}px">`;last=m.index+m[0].length;}
  return `<div class="code-line"><span class="line-number">${n+1}</span><span class="code-content">${text+highlight(line.slice(last))||' '}</span></div>`;
 }).join('');
 $('editor').querySelectorAll('input').forEach(input=>{
  input.addEventListener('focus',()=>{focusId=input.dataset.blank;document.querySelectorAll('.focus-line').forEach(l=>l.classList.remove('focus-line'));input.closest('.code-line').classList.add('focus-line');if(!$('hintBox').hidden)showHint();});
  input.addEventListener('input',()=>{invalidate();record().values[input.dataset.blank]=input.value;record().done=false;const b=current().blanks.find(b=>b.id===input.dataset.blank);input.style.width=inputWidth(input.value,b)+'px';updateProgress();persist();
   if($('autoRun').checked&&input.value.trim()){feedback('','输入已更新，即将逐空预演','已填内容实际运行，未填处暂用参考值。预演后可以继续改参数。');autoTimer=setTimeout(()=>execute(true),800);}else feedback('','代码已更新','继续补全空格，或点击“运行完整代码”。');
  });
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.ctrlKey&&!event.metaKey){event.preventDefault();execute(true);}});
 });updateProgress();
}
function inputWidth(value,b){return Math.max(62,Math.min(290,Math.max(value.length,b.answer.length*.8)*7.3+12));}
function badge(text,kind=''){$('flightBadge').className='flight-badge '+kind;$('flightBadge').innerHTML='<i></i>'+escape(text);}
function resetView(){
 scene.reset();activeIndex=-1;$('currentFunction').textContent='等待调用';$('bindings').innerHTML='<p class="empty-state">运行后查看本次调用收到的实际参数。</p>';$('bindingNote').textContent=current()?.traceHint||'改变实参，比较参数绑定和飞行动作。';
 $('commandQueue').innerHTML='<p class="empty-state">你的下一次调用，将变成这里的一段航迹。</p>';$('queueCount').textContent='0 条指令';$('previewMode').textContent='等待输入';$('consoleStatus').textContent='READY';$('sceneCaption').textContent='从原点上方 10 m 开始，准备第一条指令。';$('consoleOutput').textContent='# 每次预演都会实际运行当前 Python 代码。\n# 未填写处在预演中暂用参考值。';badge('悬停待命');
 $('replayBtn').disabled=true;$('pauseBtn').disabled=true;$('pauseBtn').textContent='暂停';$('actionProgress').textContent='等待下发指令';$('flightProgress').style.width='0%';
 document.querySelectorAll('.active-line,.error-line').forEach(n=>n.classList.remove('active-line','error-line'));
}
function invalidate(){revision++;clearTimeout(autoTimer);lastRun=null;paused=false;resetView();$('runBtn').disabled=false;}
function load(n){
 index=n;record();scenarioId=current().defaultScenario||current().scenarios[0].id;focusId=null;invalidate();$('hintBox').hidden=true;$('dataBox').hidden=true;$('dataBtn').setAttribute('aria-expanded','false');
 $('lessonKicker').textContent=current().kicker;$('lessonNumber').textContent=`MISSION ${String(n+1).padStart(2,'0')}`;$('lessonTitle').textContent=current().title;$('lessonDescription').textContent=current().description;$('objectiveText').textContent=current().objective;$('conceptText').textContent=current().concept;
 $('scenarioSelect').innerHTML=current().scenarios.map(s=>`<option value="${escape(s.id)}">${escape(s.label)}</option>`).join('');$('nextBtn').textContent=n===lessons.length-1?'再飞一轮 ↺':'下一关 →';renderNav();renderEditor();updateScenario();feedback('','本关目标',current().objective);persist();
}
function updateScenario(){const s=scenario();$('scenarioSelect').value=s.id;$('scenarioDescription').textContent=s.description;$('inputData').textContent=s.prelude||'# 本关实参直接写在代码的函数调用中。';}
function compose(scaffold,clean=false){
 let code=current().code.replace(/\{\{([^}]+)\}\}/g,(_,id)=>record().values[id]?.trim()||(scaffold?current().blanks.find(b=>b.id===id).answer:'____'));
 if(clean)code=code.split('\n').filter(l=>!/^\s*#\s*@event\s+/.test(l)).join('\n');return (scenario().prelude||'')+'\n\n'+code;
}
function sourceLine(raw){
 const dataLines=(scenario().prelude||'').split('\n').length;
 if(raw<=dataLines)return null;
 return Math.max(1,current().code.split('\n').slice(0,raw-dataLines-1).filter(l=>!/^\s*#\s*@event\s+/.test(l)).length);
}
function markLine(raw,error=false){document.querySelectorAll('.active-line,.error-line').forEach(n=>n.classList.remove('active-line','error-line'));const n=sourceLine(raw);if(n)$('editor').children[n-1]?.classList.add(error?'error-line':'active-line');}
function format(value,type){
 if(value===null)return 'None';if(value===true)return 'True';if(value===false)return 'False';
 if(Array.isArray(value)){const body=value.map(v=>format(v,Array.isArray(v)?'tuple':undefined)).join(', ');return type==='list'?'['+body+']':'('+body+(value.length===1?',':'')+')';}
 if(typeof value==='object')return '{'+Object.entries(value).map(([k,v])=>JSON.stringify(k)+': '+format(v)).join(', ')+'}';
 return typeof value==='string'?JSON.stringify(value):String(value);
}
function actionDescription(c){
 switch(c.action){case'move':return `到 (${c.x}, ${c.y})`;case'altitude':return `高度 → ${c.height} m`;case'spin':return `${c.direction==='left'?'左':'右'}旋 ${c.turns} 圈`;case'figure8':return `8 字 × ${c.loops} · ${c.scale} m`;case'route':return `${c.points?.length||0} 个航点`;case'configure':return Object.keys(c.params||{}).join(' / ');case'orbit':return `${c.radius} m · ${c.laps} 圈`;case'return':return `${c.height} m 高度返航`;default:return c.action;}
}
function renderQueue(commands){$('queueCount').textContent=`${commands.length} 条指令`;$('commandQueue').innerHTML=commands.length?commands.map((c,n)=>`<div class="command-chip" data-command="${n}"><span>${String(n+1).padStart(2,'0')} / ${escape(titles[c.action]||c.action)}</span><strong>${escape(actionDescription(c))}</strong></div>`).join(''):'<p class="empty-state">代码没有产生飞行指令。检查函数是否被调用。</p>';}
function showBindings(c){
 $('currentFunction').textContent=c.functionName?c.functionName+'()':titles[c.action]||c.action;
 const keys=(c.parameterNames||Object.keys(c)).filter(k=>Object.hasOwn(c,k)&&!['action','line','types','functionName','parameterNames'].includes(k));
 $('bindings').innerHTML=keys.map(k=>`<div class="binding"><span>${escape(k)}</span><code>${escape(format(c[k],c.types?.[k]))}</code><small>${escape(c.types?.[k]||'')}</small></div>`).join('');
 $('bindingNote').textContent=current().traceHint||'这里展示本次函数调用已经绑定的实际参数，包括默认值。';markLine(c.line);
}
function updateFlight(state){
 for(const key of ['x','y','z','yaw']){const node=$(key+'Value');if(node)node.innerHTML=`${Number(Number(state[key]||0).toFixed(1))}<em>${key==='yaw'?'°':'m'}</em>`;}
 if(!state.total)return;
 $('flightProgress').style.width=Math.max(0,Math.min(100,(state.totalProgress||0)*100))+'%';
 $('actionProgress').textContent=`${Math.min(state.index+1,state.total)} / ${state.total} · ${titles[state.action]||'飞行指令'}`;
 if(state.index!==activeIndex&&state.command){activeIndex=state.index;showBindings(state.command);document.querySelectorAll('.command-chip').forEach((chip,n)=>{chip.classList.toggle('active',n===activeIndex);chip.classList.toggle('done',n<activeIndex);});const chip=$('commandQueue').children[activeIndex];if(chip)$('commandQueue').scrollLeft=Math.max(0,chip.offsetLeft-$('commandQueue').offsetLeft-12);}
 if(state.playing&&!state.done){badge(state.paused?'飞行暂停':'执行指令','flying');$('sceneCaption').textContent=`${titles[state.action]||'当前动作'} · ${actionDescription(state.command||{})}`;}
}
function finishFlight(){paused=false;$('pauseBtn').textContent='暂停';$('pauseBtn').disabled=true;$('flightProgress').style.width='100%';badge('本轮飞行完成');$('sceneCaption').textContent='飞行完成。试着改变一个数值，比较新的航迹。';document.querySelectorAll('.command-chip').forEach(n=>{n.classList.remove('active');n.classList.add('done');});}
async function execute(scaffold=false){
 clearTimeout(autoTimer);
 const missing=current().blanks.filter(b=>!filled(b));
 if(!scaffold&&missing.length){feedback('error',`还有 ${missing.length} 个空没有填写`,'可以先逐空预演；补全所有空格后，再运行完整代码。');$('editor').querySelector(`[data-blank="${missing[0].id}"]`)?.focus();return;}
 const run=++revision;scene.reset();activeIndex=-1;lastRun=null;paused=false;$('runBtn').disabled=true;$('pauseBtn').disabled=true;$('replayBtn').disabled=true;$('consoleOutput').textContent='';$('consoleStatus').textContent='RUNNING';$('previewMode').textContent=missing.length?'逐空预演 · 含参考值':'完整代码';badge('正在运行 Python');
 const code=compose(scaffold),result=await runPython(code);
 if(run!==revision)return;
 $('runBtn').disabled=false;$('consoleOutput').textContent=result.output||'# 本次没有 print 输出。';$('consoleStatus').textContent=result.ok?'PYTHON OK':result.errorType||'ERROR';
 if(!result.ok){$('consoleOutput').textContent+='\n'+(result.error||'Python 运行失败');feedback('error','Python 运行遇到错误',result.error||'请检查填写内容。');badge('检查代码','error');$('sceneCaption').textContent='修正代码后重新运行。';$('commandQueue').innerHTML='<p class="empty-state">本次运行出错，未下发飞行指令。</p>';$('queueCount').textContent='0 条指令';const line=result.line||Number((result.error||'').match(/line\s+(\d+)/)?.[1]);if(line)markLine(line,true);return;}
 const commands=result.events.filter(e=>e.type==='command').map(e=>({...e.scope,types:e.types||{},line:e.line,functionName:e.functionName,parameterNames:e.parameterNames}));
 renderQueue(commands);
 if(!commands.length){badge('尚无飞行指令');feedback('','代码运行完成，尚未产生动作','定义函数后，需要调用函数，函数体中的指令才会执行。');return;}
 try{scene.play(commands);}catch(error){scene.reset();badge('参数需要调整','error');feedback('error','代码已运行，飞行参数超出演示范围',error.message);$('consoleOutput').textContent+='\n# 飞行动作检查：'+error.message;return;}
 lastRun={commands};$('pauseBtn').disabled=false;$('pauseBtn').textContent='暂停';$('replayBtn').disabled=false;
 const valid=current().blanks.every(matches);
 if(!missing.length&&valid){record().done=true;persist();updateProgress();feedback('success','任务完成，飞行指令已下发','参数已正确绑定。现在可以改动绿色数值空，设计你的另一条航线。');}
 else if(missing.length)feedback('','逐空预演进行中',`已填 ${current().blanks.length-missing.length} 处；另 ${missing.length} 处暂用参考值。补全后运行完整代码，才能完成本关。`);
 else feedback('','代码已运行，继续核对知识点','当前飞行动作来自实际代码。有些填空与本关目标不符，点击对应空格查看提示。');
}
function showHint(){
 const b=current().blanks.find(b=>b.id===focusId)||current().blanks.find(b=>!matches(b))||current().blanks[0];focusId=b.id;$('hintBox').hidden=false;
 $('hintBox').innerHTML=`<strong>${escape(b.hint)}</strong><br>${escape(b.explanation)}${b.numberRange?`<br>数值探索范围：<code>${escape(b.numberRange.join(' ～ '))}</code>。换个数值，观察飞行变化。`:''}`;
}
function answerDialog(){$('answerContent').innerHTML=current().blanks.map((b,n)=>`<div class="answer-item"><span>第 ${n+1} 空 · ${escape(b.hint)}</span><br><strong>${escape(b.answer)}</strong><p>${escape(b.explanation)}${b.numberRange?' · 可探索范围 '+b.numberRange.join(' ～ '):''}</p></div>`).join('');$('answerDialog').showModal();}
$('runBtn').onclick=()=>execute(false);$('hintBtn').onclick=showHint;$('answerBtn').onclick=answerDialog;
$('fillAnswerBtn').onclick=()=>{invalidate();current().blanks.forEach(b=>record().values[b.id]=b.answer);record().done=false;renderEditor();persist();$('answerDialog').close();execute(false);};
$('resetBtn').onclick=()=>{record().values={};record().done=false;invalidate();renderEditor();$('hintBox').hidden=true;persist();feedback('','本关填空已清空',current().objective);};
$('nextBtn').onclick=()=>load((index+1)%lessons.length);$('scenarioSelect').onchange=()=>{scenarioId=$('scenarioSelect').value;invalidate();updateScenario();feedback('','飞行情境已切换',scenario().description);if(current().blanks.some(filled)&&$('autoRun').checked)execute(true);};
$('dataBtn').onclick=()=>{const open=$('dataBox').hidden;$('dataBox').hidden=!open;$('dataBtn').setAttribute('aria-expanded',String(open));};
$('autoRun').onchange=()=>{if(!$('autoRun').checked)clearTimeout(autoTimer);};
$('pauseBtn').onclick=()=>{paused=!paused;scene.setPaused(paused);$('pauseBtn').textContent=paused?'继续':'暂停';badge(paused?'飞行暂停':'执行指令','flying');};
$('replayBtn').onclick=()=>{if(!lastRun)return;activeIndex=-1;paused=false;$('pauseBtn').disabled=false;$('pauseBtn').textContent='暂停';document.querySelectorAll('.command-chip').forEach(n=>n.classList.remove('active','done'));scene.play(lastRun.commands);};
$('speedSelect').onchange=()=>scene.setPlaybackRate(Number($('speedSelect').value));$('cameraBtn').onclick=()=>scene.resetCamera();
$('guideBtn').onclick=()=>$('guideDialog').showModal();document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$('downloadBtn').onclick=()=>{const code=compose(false,true),blob=new Blob(['# 无人机指令飞行实验室 · '+current().title+'\n# 数值空可自由探索；请先补全所有 ____。\n'+code+'\n'],{type:'text/x-python;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='parameter-flight-'+String(index+1).padStart(2,'0')+'.py';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已下载本关 Python 代码');};
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();execute(false);}});
window.addEventListener('pagehide',event=>{if(!event.persisted)scene.destroy();});
$('lessonSummary').textContent=`${lessons.length} 个任务 / ${lessons.reduce((n,l)=>n+l.blanks.length,0)} 处填空`;
load(index);
