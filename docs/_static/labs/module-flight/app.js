import { lessons } from './lessons.js';
import { DroneScene } from './drone.js';
import { runPython, cancelPython } from './runtime.js';
import { makeZip } from './zip.js';

const $=id=>document.getElementById(id);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=value=>(String(value??'').trim().match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^"']+/g)||[]).map(s=>/^["']/.test(s)?s:s.replace(/\s+/g,'')).join('');
const KEY='module-flight-project-four-v1';
let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{}
let progress=saved.progress&&typeof saved.progress==='object'?saved.progress:{};
let index=Math.max(0,lessons.findIndex(l=>l.id===saved.current));
let scenarioId,focusId,revision=0,autoTimer,toastTimer,lastRun=null,paused=false,activeIndex=-1,scratch=null,traceEvents=[],traceIndex=-1,following=true,routePlan=null,miniTrail=[],activeFile=null,importEvents=[],inspectedFile=null;
const titles={move:'坐标飞行',altitude:'定高升降',spin:'原地自旋',figure8:'8 字飞行',route:'航点巡航',configure:'飞行配置',orbit:'环绕飞行',return:'返航降落',hold:'悬停等待'};
const mapCanvas=$('routeMap'),mapContext=mapCanvas.getContext('2d');
const scene=new DroneScene($('droneCanvas'),{onUpdate:updateFlight,onFinish:finishFlight});
const current=()=>lessons[index];
const entry=()=>current().entry||'main.py';
const fileList=()=>current().files;
const selectedFile=()=>fileList().find(file=>file.path===activeFile)||fileList()[0];
const record=()=>scratch||(progress[current().id]||=( {values:{},done:false} ));
const scenario=()=>current().scenarios.find(s=>s.id===scenarioId)||current().scenarios[0];
const filled=b=>Boolean(record().values[b.id]?.trim());
function matches(b){
 const value=record().values[b.id]?.trim()||'';
 if(b.numberRange)return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)&&Number.isFinite(Number(value))&&(!b.integer||Number.isInteger(Number(value)))&&Number(value)>=b.numberRange[0]&&Number(value)<=b.numberRange[1];
 return [b.answer,...(b.accepted||[])].some(a=>normalize(a)===normalize(value));
}
function persist(){try{localStorage.setItem(KEY,JSON.stringify({current:current().id,progress}));}catch{}}
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3000);}
function feedback(kind,title,text){$('feedback').className='feedback '+kind;$('feedback').innerHTML=`<i>${kind==='error'?'!':kind==='success'?'✓':'i'}</i><div><strong>${escape(title)}</strong><p>${escape(text)}</p></div>`;}
function highlight(code){
 const regex=/(#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:def|return|if|else|elif|for|in|is|not|and|or|None|True|False|global|lambda|try|except|import|from|as)\b|\b\d+(?:\.\d+)?\b|\b(?:print|int|float|type|round|len)\b)/g;
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
function renderFragment(code){
 return code.split('\n').filter(line=>!/^\s*#\s*@event\s+/.test(line)).map((line,n)=>{
  let text='',last=0;
  for(const m of line.matchAll(/\{\{([^}]+)\}\}/g)){text+=highlight(line.slice(last,m.index));const b=current().blanks.find(blank=>blank.id===m[1]),value=record().values[b.id]||'',number=current().blanks.indexOf(b)+1;
   text+=`<input class="blank" data-blank="${escape(b.id)}" value="${escape(value)}" aria-label="第 ${number} 空：${escape(b.hint)}" title="${escape(b.hint)}" placeholder="${String(number).padStart(2,'0')} · 填写" autocomplete="off" autocapitalize="off" spellcheck="false" style="width:${inputWidth(value,b)}px">`;last=m.index+m[0].length;}
  return `<div class="code-line"><span class="line-number">${n+1}</span><span class="code-content">${text+highlight(line.slice(last))||' '}</span></div>`;
 }).join('');
}
function renderFileNav(){
 $('fileNav').innerHTML=fileList().map(file=>{const ids=[...file.code.matchAll(/\{\{([^}]+)\}\}/g)].map(m=>m[1]);const count=ids.filter(id=>matches(current().blanks.find(b=>b.id===id))).length;return `<button data-file="${escape(file.path)}" class="file-tab${file.path===activeFile?' active':''}" title="${escape(file.path)}">${file.path.includes('/')?'<small>包 / </small>':''}${escape(file.path)}<em>${ids.length?count+'/'+ids.length:'参考'}</em></button>`;}).join('');
 $('fileNav').querySelectorAll('button').forEach(button=>button.onclick=()=>openFile(button.dataset.file));
}
function openFile(path){activeFile=path;renderEditor();if(traceEvents[traceIndex])inspectEvent(traceIndex);}
function renderEditor(){
 renderFileNav();$('activeFileName').textContent=selectedFile().path;$('editor').innerHTML=renderFragment(selectedFile().code);
 $('installPanel').hidden=!current().installCommand;
 $('installEditor').innerHTML=current().installCommand?renderFragment(current().installCommand):'';
 $('installStatus').textContent='安装目标：本页独立练习环境。下载工程后，可在电脑终端使用同样的命令。';
 document.querySelectorAll('.blank').forEach(input=>{
  input.addEventListener('focus',()=>{focusId=input.dataset.blank;document.querySelectorAll('.focus-line').forEach(l=>l.classList.remove('focus-line'));input.closest('.code-line').classList.add('focus-line');if(!$('hintBox').hidden)showHint();});
  input.addEventListener('input',()=>{invalidate();record().values[input.dataset.blank]=input.value;record().done=false;const b=current().blanks.find(b=>b.id===input.dataset.blank);input.style.width=inputWidth(input.value,b)+'px';updateProgress();updateFileCounts();persist();
   if($('autoRun').checked&&input.value.trim()){feedback('','输入已更新，即将运行整套工程','已填内容按实际执行，未填处暂用参考值。首次运行需要加载本地 Python 资源。');autoTimer=setTimeout(()=>execute(true),900);}else feedback('','代码已更新','继续补全各个文件，或点击运行完整工程。');
  });
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.ctrlKey&&!event.metaKey){event.preventDefault();execute(true);}});
 });updateProgress();
}
function updateFileCounts(){document.querySelectorAll('[data-file]').forEach(button=>{const file=fileList().find(file=>file.path===button.dataset.file),ids=[...file.code.matchAll(/\{\{([^}]+)\}\}/g)].map(m=>m[1]);button.querySelector('em').textContent=ids.length?ids.filter(id=>matches(current().blanks.find(b=>b.id===id))).length+'/'+ids.length:'参考';});}
function inputWidth(value,b){return Math.max(62,Math.min(290,Math.max(value.length,b.answer.length*.8)*7.3+12));}
function badge(text,kind=''){$('flightBadge').className='flight-badge '+kind;$('flightBadge').innerHTML='<i></i>'+escape(text);}
function resetView(){
 scene.reset();activeIndex=-1;resetTrace();$('currentFunction').textContent='等待调用';$('bindings').innerHTML='<p class="empty-state">运行后查看本次调用收到的实际参数。</p>';$('bindingNote').textContent=current()?.traceHint||'切换文件，比较导入方式、计算结果和飞行动作。';
 $('commandQueue').innerHTML='<p class="empty-state">你的下一次调用，将变成这里的一段航迹。</p>';$('queueCount').textContent='0 条指令';$('previewMode').textContent='等待输入';$('consoleStatus').textContent='READY';$('sceneCaption').textContent='从原点上方 10 m 开始，准备第一条指令。';$('consoleOutput').textContent='# 每次预演都会实际运行当前 Python 代码。\n# 未填写处在预演中暂用参考值。';badge('悬停待命');
 $('replayBtn').disabled=true;$('pauseBtn').disabled=true;$('pauseBtn').textContent='暂停';$('actionProgress').textContent='等待下发指令';$('flightProgress').style.width='0%';
 document.querySelectorAll('.active-line,.error-line').forEach(n=>n.classList.remove('active-line','error-line'));
}
function invalidate(){revision++;cancelPython();clearTimeout(autoTimer);lastRun=null;paused=false;resetView();$('runBtn').disabled=false;}
function load(n){
 scratch=null;index=n;activeFile=entry();record();$('scratchNotice').hidden=true;scenarioId=current().defaultScenario||current().scenarios[0].id;focusId=null;invalidate();$('hintBox').hidden=true;$('dataBox').hidden=true;$('dataBtn').setAttribute('aria-expanded','false');
 $('lessonKicker').textContent=current().kicker;$('lessonNumber').textContent=`MISSION ${String(n+1).padStart(2,'0')}`;$('lessonTitle').textContent=current().title;$('lessonDescription').textContent=current().description;$('objectiveText').textContent=current().objective;$('conceptText').textContent=current().concept;
 $('scenarioSelect').innerHTML=current().scenarios.map(s=>`<option value="${escape(s.id)}">${escape(s.label)}</option>`).join('');$('nextBtn').textContent=n===lessons.length-1?'再飞一轮 ↺':'下一关 →';renderNav();renderEditor();updateScenario();feedback('','本关目标',current().objective);persist();
}
function updateScenario(){const s=scenario();$('scenarioSelect').value=s.id;$('scenarioDescription').textContent=s.description;$('inputData').textContent=s.prelude||'# 本关实参直接写在代码的函数调用中。';}
function fillTemplate(template,scaffold,clean=false){
 let text=template.replace(/\{\{([^}]+)\}\}/g,(_,id)=>record().values[id]?.trim()||(scaffold?current().blanks.find(b=>b.id===id).answer:'____'));
 if(clean)text=text.split('\n').filter(line=>!/^\s*#\s*@event\s+/.test(line)).join('\n');return text;
}
function compose(scaffold,clean=false){
 const files=Object.fromEntries(fileList().map(file=>[file.path,fillTemplate(file.code,scaffold,clean)]));
 files[entry()]=(scenario().prelude||'')+'\n\n'+files[entry()];
 return {files,entry:entry(),code:files[entry()],installCommand:current().installCommand?fillTemplate(current().installCommand,scaffold,clean):null};
}
function knownFile(path){return fileList().find(file=>file.path===path||String(path||'').endsWith('/'+file.path))?.path||entry();}
function sourceLine(raw,path=entry()){
 const prelude=path===entry()?(scenario().prelude||'').split('\n').length+1:0;
 if(raw<=prelude)return null;
 const code=fileList().find(file=>file.path===path)?.code||'';
 return Math.max(1,code.split('\n').slice(0,raw-prelude).filter(line=>!/^\s*#\s*@event\s+/.test(line)).length);
}
function markLine(raw,path=entry(),error=false,reveal=false){
 path=knownFile(path);inspectedFile=path;
 if(reveal&&activeFile!==path)openFile(path);
 document.querySelectorAll('.active-line,.error-line').forEach(node=>node.classList.remove('active-line','error-line'));
 document.querySelectorAll('[data-file]').forEach(button=>button.classList.toggle('executing',button.dataset.file===path));
 const n=sourceLine(raw,path);if(n&&activeFile===path)$('editor').children[n-1]?.classList.add(error?'error-line':'active-line');
}
function format(value,type){
 if(value===null)return 'None';if(value===true)return 'True';if(value===false)return 'False';
 if(Array.isArray(value)){const body=value.map(v=>format(v,Array.isArray(v)?'tuple':undefined)).join(', ');return type==='list'?'['+body+']':'('+body+(value.length===1?',':'')+')';}
 if(value?.__kind__==='module')return '模块 '+value.name;
 if(value?.__kind__==='function')return value.name+'()';
 if(typeof value==='object')return '{'+Object.entries(value).map(([k,v])=>JSON.stringify(k)+': '+format(v)).join(', ')+'}';
 return typeof value==='string'?JSON.stringify(value):String(value);
}
function actionDescription(c){
 switch(c.action){case'move':return `到 (${c.x}, ${c.y})`;case'altitude':return `高度 → ${c.height} m`;case'spin':return `${c.direction==='left'?'左':'右'}旋 ${c.turns} 圈`;case'figure8':return `8 字 × ${c.loops} · ${c.scale} m`;case'route':return `${c.points?.length||0} 个航点`;case'configure':return Object.keys(c.params||{}).join(' / ');case'orbit':return `${c.radius} m · ${c.laps} 圈`;case'return':return `${c.height} m 高度返航`;case'hold':return c.message||'保持安全悬停';default:return c.action;}
}
function renderQueue(commands){$('queueCount').textContent=`${commands.length} 条指令`;$('commandQueue').innerHTML=commands.length?commands.map((c,n)=>`<div class="command-chip" data-command="${n}"><span>${String(n+1).padStart(2,'0')} / ${escape(titles[c.action]||c.action)}</span><strong>${escape(actionDescription(c))}</strong></div>`).join(''):'<p class="empty-state">代码没有产生飞行指令。检查函数是否被调用。</p>';}
function showBindings(c){
 $('currentFunction').textContent=c.functionName?c.functionName+'()':titles[c.action]||c.action;
 const keys=(c.parameterNames||Object.keys(c)).filter(k=>Object.hasOwn(c,k)&&!['action','line','types','functionName','parameterNames','scopeKinds','scopeValues','eventIndex'].includes(k));
 $('bindings').innerHTML=keys.map(k=>`<div class="binding"><span>${escape(k)}</span><code>${escape(format(c[k],c.types?.[k]))}</code><small>${escape(c.types?.[k]||'')}</small></div>`).join('');
 $('bindingNote').textContent=current().traceHint||'这里显示当前执行位置实际可读取的变量。';markLine(c.line,c.file);
}
function updateFlight(state){
 paintRouteMap(state);
 for(const key of ['x','y','z','yaw']){const node=$(key+'Value');if(node)node.innerHTML=`${Number(Number(state[key]||0).toFixed(1))}<em>${key==='yaw'?'°':'m'}</em>`;}
 if(!state.total)return;
 $('flightProgress').style.width=Math.max(0,Math.min(100,(state.totalProgress||0)*100))+'%';
 $('actionProgress').textContent=`${Math.min(state.index+1,state.total)} / ${state.total} · ${titles[state.action]||'飞行指令'}`;
 if(state.index!==activeIndex&&state.command){activeIndex=state.index;if(following){showBindings(state.command);inspectEvent(state.command.inspectIndex??state.command.eventIndex);}document.querySelectorAll('.command-chip').forEach((chip,n)=>{chip.classList.toggle('active',n===activeIndex);chip.classList.toggle('done',n<activeIndex);});const chip=$('commandQueue').children[activeIndex];if(chip)$('commandQueue').scrollLeft=Math.max(0,chip.offsetLeft-$('commandQueue').offsetLeft-12);}
 if(state.playing&&!state.done){badge(state.paused?'飞行暂停':'执行指令','flying');$('sceneCaption').textContent=`${titles[state.action]||'当前动作'} · ${actionDescription(state.command||{})}`;}
}
function paintRouteMap(state={}){
 const ctx=mapContext,w=148,h=108;ctx.clearRect(0,0,w,h);ctx.fillStyle='#132d3b';ctx.fillRect(0,0,w,h);ctx.fillStyle='#a4c0ca';ctx.font='9px "Microsoft YaHei",sans-serif';ctx.fillText('俯视航迹 · X / Y',9,14);
 const points=routePlan?.points||[{x:-10,y:-10},{x:10,y:10}],xs=points.map(p=>p.x),ys=points.map(p=>p.y);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),scale=Math.min(118/Math.max(8,maxX-minX),72/Math.max(8,maxY-minY));
 const project=p=>({x:74+(p.x-(minX+maxX)/2)*scale,y:64-(p.y-(minY+maxY)/2)*scale});
 const draw=(data,color,width)=>{if(!data.length)return;ctx.beginPath();data.forEach((p,n)=>{const q=project(p);n?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
 if(routePlan)draw(points,'#5aa7b9',1.3);
 const current={x:Number(state.x)||0,y:Number(state.y)||0};const last=miniTrail.at(-1);if(routePlan&&(!last||Math.hypot(last.x-current.x,last.y-current.y)>.1)){miniTrail.push(current);if(miniTrail.length>1600)miniTrail.shift();}
 draw(miniTrail,'#edb65e',1.6);const q=project(current);ctx.beginPath();ctx.arc(q.x,q.y,3.5,0,Math.PI*2);ctx.fillStyle='#ffe0a3';ctx.fill();
 mapCanvas.setAttribute('aria-label','俯视航迹：当前横坐标 '+current.x.toFixed(1)+'，纵坐标 '+current.y.toFixed(1));
}
function finishFlight(){paused=false;$('pauseBtn').textContent='暂停';$('pauseBtn').disabled=true;$('flightProgress').style.width='100%';badge('本轮飞行完成');$('sceneCaption').textContent='飞行完成。试着改变一个数值，比较新的航迹。';document.querySelectorAll('.command-chip').forEach(n=>{n.classList.remove('active');n.classList.add('done');});if(following&&traceEvents.length)inspectEvent(traceEvents.length-1);}
function resetTrace(){
 routePlan=null;miniTrail=[];paintRouteMap();traceEvents=[];traceIndex=-1;following=true;importEvents=[];inspectedFile=null;
 $('traceSelect').innerHTML='<option>等待执行记录</option>';$('traceSelect').disabled=true;$('prevTraceBtn').disabled=true;$('nextTraceBtn').disabled=true;$('callStack').textContent='运行后观察真实的模块加载顺序。';$('scoreValue').textContent=activeFile||entry();$('resultValue').textContent='等待模块结果';$('depthValue').textContent='0';$('followBtn').classList.add('active');$('importGraph').innerHTML='<p>导入一个模块，点亮一个工具。</p>';$('engineStatus').textContent='填写任意一个空格后，启动本页 Python 环境。';
}
function prepareTrace(events){
 traceEvents=events.filter(event=>!['output','install'].includes(event.type));
 importEvents=events.filter(event=>event.type==='import');renderImports();
 const names={enter:'进入函数',return:'返回结果',scope:'变量快照',result:'计算结果',command:'飞行指令',import:'导入模块'};
 $('traceSelect').innerHTML=traceEvents.map((event,n)=>`<option value="${n}">${String(n+1).padStart(2,'0')} · ${escape(event.file||event.caller||entry())} · ${escape(names[event.type]||event.type)}${event.type==='import'?' '+escape(event.name):''}</option>`).join('');$('traceSelect').disabled=!traceEvents.length;
 if(traceEvents.length)inspectEvent(0);
}
function renderImports(){
 const unique=[...new Set(importEvents.map(event=>event.name).filter(Boolean))];$('depthValue').textContent=String(unique.length);
 $('importGraph').innerHTML=importEvents.length?importEvents.map((event,n)=>`<button data-import-step="${n}" title="${escape(event.file||event.name||'')}"><i>${event.cached?'↻':'✓'}</i><span>${escape(event.name||event.file||'模块')}</span><small>${event.cached?'复用缓存':'实际加载'}</small></button>`).join(''):'<p>本次还没有模块导入。</p>';
 $('callStack').innerHTML='<span class="main-frame">'+escape(entry())+'</span>'+unique.map(name=>'<b>→</b><span>'+escape(name)+'</span>').join('');
 $('importGraph').querySelectorAll('button').forEach(button=>button.onclick=()=>{const event=importEvents[Number(button.dataset.importStep)];selectTrace(traceEvents.indexOf(event));});
}
function inspectEvent(n){
 const event=traceEvents[n];if(!event)return;traceIndex=n;$('traceSelect').value=String(n);$('prevTraceBtn').disabled=n<=0;$('nextTraceBtn').disabled=n>=traceEvents.length-1;
 const vars=Object.entries(event.scope||{}).filter(([key])=>!['action','message','__builtins__'].includes(key)&&!key.startsWith('__'));
 $('bindings').innerHTML=vars.length?vars.map(([name,value])=>`<div class="module-binding"><code>${escape(name)}</code><strong>${escape(format(value,event.types?.[name]))}</strong><small>${escape(event.types?.[name]||'')}</small></div>`).join(''):'<p class="empty-state">'+(event.type==='import'?'已加载 '+escape(event.name)+'，通过文件页签查看其中的定义。':'本步没有需要展示的变量。')+'</p>';
 const location=event.type==='import'?(event.caller||event.file):event.file;
 const source=knownFile(location);$('scoreValue').textContent=location||entry();$('currentFunction').textContent=source;
 const scope=event.scope||{},key=['result','distance','height','scale','turns','loops','version','bonus'].find(key=>Object.hasOwn(scope,key));$('resultValue').textContent=key?key+' = '+format(scope[key],event.types?.[key]):event.type==='import'?event.name:'查看模块变量';
 $('bindingNote').textContent=`第 ${n+1} / ${traceEvents.length} 个实际执行记录 · ${current().traceHint}`;markLine(event.line,source);
}
function selectTrace(n){following=false;$('followBtn').classList.remove('active');scene.setPaused(true);paused=true;$('pauseBtn').textContent='继续';badge('查看执行快照');inspectEvent(Math.max(0,Math.min(traceEvents.length-1,n)));}
async function execute(scaffold=false){
 clearTimeout(autoTimer);const missing=current().blanks.filter(b=>!filled(b));
 if(!scaffold&&missing.length){feedback('error',`还有 ${missing.length} 个空没有填写`,'请补全所有文件和安装命令；也可以先逐空预演。');const id=missing[0].id,file=fileList().find(file=>file.code.includes('{{'+id+'}}'));if(file)openFile(file.path);document.querySelector(`[data-blank="${id}"]`)?.focus();return;}
 const attempt=++revision;scene.reset();activeIndex=-1;resetTrace();lastRun=null;paused=false;$('runBtn').disabled=true;$('pauseBtn').disabled=true;$('replayBtn').disabled=true;$('consoleOutput').textContent='';$('consoleStatus').textContent='RUNNING';$('previewMode').textContent=scratch?'试飞草稿 · 不计通关':missing.length?'逐空预演 · 含参考值':'完整工程';badge('正在运行 Python');
 const job=compose(scaffold);
 const result=await runPython(job.code,{files:job.files,entry:job.entry,installCommand:job.installCommand,onStatus:status=>{if(attempt!==revision)return;$('engineStatus').textContent=status.message||status.stage;$('consoleStatus').textContent=String(status.stage||'RUNNING').toUpperCase();},onEvent:event=>{if(attempt!==revision)return;if(event.type==='import'){importEvents.push(event);renderImports();}if(event.type==='install')$('installStatus').textContent=event.message||(event.stage==='complete'?`geopy ${event.version||'2.4.1'} 已安装 · 已可导入并计算距离。`:'正在安装到网页练习环境…');}});
 if(attempt!==revision||result.cancelled)return;
 $('runBtn').disabled=false;$('consoleOutput').textContent=result.output||'# 本次没有 print 输出。';$('consoleStatus').textContent=result.ok?'PYTHON OK':result.errorType||'ERROR';$('engineStatus').textContent=result.ok?'CPython 执行完成 · 飞行数据来自本次真实模块计算':'执行已停止 · 检查模块路径、名字和错误所在文件';prepareTrace(result.events||[]);
 if(!result.ok){if(traceEvents.length)inspectEvent(traceEvents.length-1);$('consoleOutput').textContent+='\n'+(result.error||'Python 执行失败');feedback('error','工程运行遇到 '+(result.errorType||'错误'),result.error||'检查导入路径、函数名和空格缩进。');badge('检查工程','error');$('sceneCaption').textContent='修正工程后再下发飞行指令。';$('commandQueue').innerHTML='<p class="empty-state">本次运行出错，没有下发飞行指令。</p>';$('queueCount').textContent='0 条指令';if(result.line)markLine(result.line,result.file,true);return;}
 const commands=(result.events||[]).filter(event=>event.type==='command').map(event=>({...event.scope,types:event.types||{},line:event.line,file:event.file,functionName:event.functionName,eventIndex:traceEvents.indexOf(event)}));
 renderQueue(commands);if(!commands.length){badge('没有飞行指令');feedback('','工程执行完成，尚无动作','检查主程序是否实际调用了导入的工具。');return;}
 try{routePlan=scene.play(commands);miniTrail=[];paintRouteMap(scene.state);}catch(error){scene.reset();feedback('error','Python 已运行，飞行参数需调整',error.message);badge('调整数值','error');return;}
 lastRun={commands};$('pauseBtn').disabled=Boolean(scene.state?.done);$('pauseBtn').textContent='暂停';$('replayBtn').disabled=false;
 if(current().blanks.every(matches)&&!missing.length&&!scratch){record().done=true;persist();updateProgress();feedback('success','模块组装完成，飞行指令已下发','导入与计算已实际执行。继续改变绿色数值，设计另一场飞行。');}
 else if(scratch)feedback('','参考工程已运行 · 不计通关','可以修改不同文件中的数值自由试飞，原有练习保留。');
 else if(missing.length)feedback('','逐空预演已运行',`本次 ${missing.length} 处未填空暂用参考值。完成各文件填空后，可运行完整工程。`);
 else feedback('','工程已运行，继续核对知识点','当前动作来自实际代码，有些填空与本关目标不符，可查看提示。');
}
function showHint(){
 const b=current().blanks.find(b=>b.id===focusId)||current().blanks.find(b=>!matches(b))||current().blanks[0];focusId=b.id;$('hintBox').hidden=false;
 $('hintBox').innerHTML=`<strong>${escape(b.hint)}</strong><br>${escape(b.explanation)}${b.numberRange?`<br>数值探索范围：<code>${escape(b.numberRange.join(' ～ '))}</code>。换个数值，观察飞行变化。`:''}`;
}
function answerDialog(){$('answerContent').innerHTML=current().blanks.map((b,n)=>`<div class="answer-item"><span>第 ${n+1} 空 · ${escape(b.hint)}</span><br><strong>${escape(b.answer)}</strong><p>${escape(b.explanation)}${b.numberRange?' · 可探索范围 '+b.numberRange.join(' ～ '):''}</p></div>`).join('');$('answerDialog').showModal();}
function downloadProject(){
 const project=compose(false,true),files={...project.files};
 files['README_run.txt']='模块三 · 项目四 · '+current().title+'\n\n请先解压整个 ZIP，保留包目录与 __init__.py。\n在解压后的工程根目录打开终端：\n'+(project.installCommand?project.installCommand+'\n':'')+'python '+project.entry+'\n\n代码中如有 ____，请先补全。网页负责三维演示，下载工程可运行并查看模块计算与指令输出。\n';
 const url=URL.createObjectURL(new Blob([makeZip(files)],{type:'application/zip'})),link=document.createElement('a');link.href=url;link.download='module-flight-'+current().id+'.zip';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已下载本关完整工程，包含全部文件和运行说明');
}
$('runBtn').onclick=()=>execute(false);$('hintBtn').onclick=showHint;$('answerBtn').onclick=answerDialog;
$('fillAnswerBtn').onclick=()=>{invalidate();current().blanks.forEach(b=>record().values[b.id]=b.answer);record().done=false;renderEditor();persist();$('answerDialog').close();execute(false);};
$('resetBtn').onclick=()=>{record().values={};record().done=false;invalidate();renderEditor();$('hintBox').hidden=true;persist();feedback('',scratch?'试飞草稿已清空':'本关填空已清空',scratch?'原有练习保留，可返回我的填空继续学习。':current().objective);};
$('nextBtn').onclick=()=>load((index+1)%lessons.length);$('scenarioSelect').onchange=()=>{scenarioId=$('scenarioSelect').value;invalidate();updateScenario();feedback('','飞行情境已切换',scenario().description);if(current().blanks.some(filled)&&$('autoRun').checked)execute(true);};
$('dataBtn').onclick=()=>{const open=$('dataBox').hidden;$('dataBox').hidden=!open;$('dataBtn').setAttribute('aria-expanded',String(open));};
$('autoRun').onchange=()=>{if(!$('autoRun').checked)clearTimeout(autoTimer);};
$('pauseBtn').onclick=()=>{paused=!paused;scene.setPaused(paused);$('pauseBtn').textContent=paused?'继续':'暂停';badge(paused?'飞行暂停':'执行指令','flying');};
$('replayBtn').onclick=()=>{if(!lastRun)return;activeIndex=-1;paused=false;following=true;$('followBtn').classList.add('active');$('pauseBtn').disabled=false;$('pauseBtn').textContent='暂停';document.querySelectorAll('.command-chip').forEach(n=>n.classList.remove('active','done'));miniTrail=[];routePlan=scene.play(lastRun.commands);paintRouteMap(scene.state);};
$('speedSelect').onchange=()=>scene.setPlaybackRate(Number($('speedSelect').value));$('cameraBtn').onclick=()=>scene.resetCamera();
$('motionEnabled').onchange=()=>scene.setMotionEnabled($('motionEnabled').checked);
document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{scene.setView(button.dataset.view);document.querySelectorAll('[data-view]').forEach(other=>other.classList.toggle('active',other===button));});
$('traceSelect').onchange=()=>selectTrace(Number($('traceSelect').value));$('prevTraceBtn').onclick=()=>selectTrace(traceIndex-1);$('nextTraceBtn').onclick=()=>selectTrace(traceIndex+1);
$('followBtn').onclick=()=>{following=true;paused=false;scene.setPaused(false);$('pauseBtn').textContent='暂停';$('followBtn').classList.add('active');if(lastRun&&activeIndex>=0)inspectEvent(lastRun.commands[activeIndex].inspectIndex??lastRun.commands[activeIndex].eventIndex);};
function startDemo(){load(lessons.findIndex(lesson=>lesson.id==='10'));scratch={values:Object.fromEntries(current().blanks.map(blank=>[blank.id,blank.answer])),done:false};$('scratchNotice').hidden=false;renderEditor();execute(false);document.querySelector('.lab-grid').scrollIntoView({block:'start',behavior:'smooth'});}
$('demoBtn').onclick=startDemo;$('exitScratchBtn').onclick=()=>load(index);
$('guideBtn').onclick=()=>$('guideDialog').showModal();document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$('sourceBtn').onclick=()=>{if(inspectedFile)openFile(inspectedFile);};
$('downloadBtn').onclick=()=>downloadProject();
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();execute(false);}});
window.addEventListener('pagehide',event=>{if(!event.persisted){cancelPython();scene.destroy();}});
$('lessonSummary').textContent=`${lessons.length} 个任务 / ${lessons.reduce((n,l)=>n+l.blanks.length,0)} 处填空`;
load(index);
scene.setPlaybackRate(Number($('speedSelect').value));scene.setMotionEnabled($('motionEnabled').checked);
if(location.hash==='#demo')startDemo();
