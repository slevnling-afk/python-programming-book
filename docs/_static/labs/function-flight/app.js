import { lessons } from './lessons.js';
import { DroneScene } from './drone.js';
import { runPython } from './runtime.js';

const $ = id => document.getElementById(id);
const html = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize = value => (String(value??'').trim().match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^"']+/g)||[]).map(s=>/^["']/.test(s)?s:s.replace(/\s+/g,'')).join('');
const KEY = 'function-flight-project-one-v1';
let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{}
let progress=saved.progress||{};
let index=Math.max(0,lessons.findIndex(l=>l.id===saved.current));
let scenarioId,focusId=null,revision=0,autoTimer,toastTimer,lastRun=null,paused=false,demoRecord=null,axisReplay=false;
let pose={mode:'idle',pitch:0,roll:0,yaw:0,height:0,battery:72};
const scene=new DroneScene($('droneCanvas'),{onUpdate:paintLivePose});
const current=()=>lessons[index];
const record=()=>demoRecord||(progress[current().id]||=( {values:{},done:false} ));
const scenario=()=>current().scenarios.find(s=>s.id===scenarioId)||current().scenarios[0];
const filled=b=>Boolean(record().values[b.id]?.trim());
function matches(b){
  const value=record().values[b.id]?.trim()||'';
  if(b.numberRange){
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)&&Number.isFinite(Number(value))&&Number(value)>=b.numberRange[0]&&Number(value)<=b.numberRange[1];
  }
  return [b.answer,...(b.accepted||[])].some(a=>normalize(a)===normalize(value));
}
function persist(){try{localStorage.setItem(KEY,JSON.stringify({current:current().id,progress}));}catch{}}
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2800);}
function feedback(kind,title,body){$('feedback').className='feedback '+kind;$('feedback').innerHTML=`<i>${kind==='error'?'!':kind==='success'?'✓':'i'}</i><div><strong>${html(title)}</strong><p>${html(body)}</p></div>`;}
function highlight(code){
  const regex=/(#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:def|return|if|else|elif|for|in|is|not|and|or|None|True|False)\b|\b\d+(?:\.\d+)?\b|\b(?:print|int|float|type|round|len)\b)/g;
  let result='',last=0;
  for(const m of code.matchAll(regex)){
    result+=html(code.slice(last,m.index));const t=m[0];
    const kind=t[0]==='#'?'comment':/^["']/.test(t)?'string':/^\d/.test(t)?'number':/^(print|int|float|type|round|len)$/.test(t)?'function':'keyword';
    result+=`<span class="syntax-${kind}">${html(t)}</span>`;last=m.index+t.length;
  }
  return result+html(code.slice(last));
}
function updateProgress(){
  $('totalProgress').textContent=`${lessons.filter(l=>progress[l.id]?.done).length} / ${lessons.length} 完成`;
  $('blankCount').textContent=`${current().blanks.filter(matches).length} / ${current().blanks.length} 空`;
  document.querySelectorAll('.blank').forEach(input=>{
    const b=current().blanks.find(b=>b.id===input.dataset.blank),valid=filled(b)&&matches(b);
    input.classList.toggle('valid',valid&&!b.numberRange);input.classList.toggle('explore',valid&&!!b.numberRange);input.classList.toggle('invalid',filled(b)&&!valid);input.setAttribute('aria-invalid',String(filled(b)&&!valid));
  });
  document.querySelectorAll('.lesson-tab').forEach((tab,n)=>{tab.classList.toggle('done',!!progress[lessons[n].id]?.done);tab.querySelector('.check').textContent=progress[lessons[n].id]?.done?'✓':'·';});
}
function renderNav(){
  $('lessonNav').innerHTML=lessons.map((l,n)=>`<button class="lesson-tab${n===index?' active':''}" data-lesson="${n}" aria-current="${n===index?'step':'false'}"><span>${String(n+1).padStart(2,'0')}<i class="check">${progress[l.id]?.done?'✓':'·'}</i></span><strong>${html(l.shortTitle)}</strong></button>`).join('');
  $('lessonNav').querySelectorAll('button').forEach(b=>b.onclick=()=>load(Number(b.dataset.lesson)));
}
function renderEditor(){
  const lines=current().code.split('\n').filter(l=>!/^\s*#\s*@event\s+/.test(l));
  let number=0;
  $('editor').innerHTML=lines.map((line,n)=>{
    let content='',last=0;
    for(const m of line.matchAll(/\{\{([^}]+)\}\}/g)){
      content+=highlight(line.slice(last,m.index));const b=current().blanks.find(b=>b.id===m[1]),value=record().values[b.id]||'';number++;
      content+=`<input class="blank" data-blank="${html(b.id)}" value="${html(value)}" aria-label="第 ${number} 空：${html(b.hint)}" placeholder="${String(number).padStart(2,'0')} · 填写" autocomplete="off" autocapitalize="off" spellcheck="false" style="width:${Math.max(55,Math.min(285,Math.max(value.length,b.answer.length*.72)*7.1))}px">`;
      last=m.index+m[0].length;
    }
    content+=highlight(line.slice(last));return `<div class="code-line"><span class="line-number">${n+1}</span><span class="code-content">${content||' '}</span></div>`;
  }).join('');
  $('editor').querySelectorAll('input').forEach(input=>{
    input.addEventListener('focus',()=>{focusId=input.dataset.blank;document.querySelectorAll('.focus-line').forEach(l=>l.classList.remove('focus-line'));input.closest('.code-line').classList.add('focus-line');if(!$('hintBox').hidden)showHint();});
    input.addEventListener('input',()=>{
      document.querySelectorAll('[data-preset]').forEach(button=>button.classList.remove('selected'));
      invalidate();record().values[input.dataset.blank]=input.value;
      const b=current().blanks.find(b=>b.id===input.dataset.blank);
      input.style.width=Math.max(55,Math.min(285,Math.max(input.value.length,b.answer.length*.72)*7.1))+'px';updateProgress();persist();
      if($('autoRun').checked&&input.value.trim()){feedback('','输入已更新，即将逐空预演','已填写部分按实际输入运行；未填空暂用参考脚手架。');autoTimer=setTimeout(()=>execute(true),650);}
      else feedback('','代码已改动','继续填写，或填完后点击“运行完整代码”。');
    });
    input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.ctrlKey&&!event.metaKey){event.preventDefault();execute(true);}});
  });updateProgress();
}
function clearFlow(){document.querySelectorAll('[data-step]').forEach(n=>n.classList.remove('current','visited'));}
function markFlow(step){document.querySelectorAll('[data-step]').forEach(n=>n.classList.remove('current'));const n=document.querySelector(`[data-step="${step}"]`);if(n)n.classList.add('visited','current');}
function setBadge(mode,text){$('flightBadge').className='flight-badge '+mode;$('flightBadge').innerHTML='<i></i>'+html(text);}
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function updatePose(changes={}){
  pose={...pose,...changes};scene.setState(pose);
  for(const key of ['pitch','roll','yaw','height']){const v=finite(pose[key])?Number(pose[key].toFixed(2)):0;$(key+'Target').textContent=`目标 ${v}${key==='height'?' m':'°'}`;}
  $('poseReplayBtn').disabled=pose.mode!=='flying'||$('consoleStatus').textContent!=='FINISHED';
}
function paintLivePose(state){
  const values={};for(const key of ['pitch','roll','yaw','height']){const n=Number(state[key]);values[key]=Number.isFinite(n)?n:0;const value=Math.abs(values[key])<.05?0:Number(values[key].toFixed(1));$(key+'Value').innerHTML=`${value}<em>${key==='height'?'m':'°'}</em>`;}
  $('pitchNeedle').style.transform=`rotate(${-values.pitch}deg)`;$('rollNeedle').style.transform=`rotate(${values.roll}deg)`;$('yawNeedle').style.transform=`rotate(${-values.yaw}deg)`;
  $('heightNeedle').style.transform=`translateY(${-Math.min(22,values.height/60*22)}px)`;
  $('pitchMeaning').textContent=Math.abs(values.pitch)<.5?'水平':values.pitch>0?'机头上抬':'机头下压';$('rollMeaning').textContent=Math.abs(values.roll)<.5?'左右平衡':values.roll>0?'向右倾斜':'向左倾斜';$('yawMeaning').textContent=Math.abs(values.yaw)<.5?'朝向零位':values.yaw>0?'机头向右转':'机头向左转';$('heightMeaning').textContent=values.height>.5?'悬停高度':'地面待命';
  const phase={pitch:'① 俯仰：看机头抬高或压低',roll:'② 横滚：看左右机臂的高低',yaw:'③ 航向：看橙色机头的转向',transition:'正在从上一姿态过渡到代码目标'};
  $('motionStatus').textContent=state.paused?'姿态动画已暂停':state.playing?(phase[state.phase]||'姿态正在变化，注意水平参考面'):pose.mode==='flying'?'姿态已保持 · 可切换视角或逐轴重演':'地面待命 · 代码调用与返回过程将在下方显示';
  if(axisReplay&&state.phase==='complete'&&!state.paused){axisReplay=false;paused=false;$('pauseBtn').disabled=true;$('pauseBtn').textContent='暂停';$('consoleStatus').textContent='FINISHED';}
  document.querySelectorAll('[data-view]').forEach(button=>{const active=button.dataset.view===state.view;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
}
function resetView(){
  $('uavName').innerHTML='UAV–07 <small>SIM</small>';
  updatePose({mode:'idle',pitch:0,roll:0,yaw:0,height:0,battery:72});setBadge('','地面待命');clearFlow();
  document.querySelectorAll('.active-line,.error-line').forEach(l=>l.classList.remove('active-line','error-line'));
  $('sceneCaption').textContent='定义工具，准备你的第一次调用。';$('previewMode').textContent='等待输入';$('tracePosition').textContent='0 个执行事件';
  $('functionValue').textContent='—';$('returnValue').textContent='—';$('returnType').textContent='';$('traceExplanation').textContent='只定义函数时，函数体不会执行。';
  $('consoleOutput').textContent='# 补全左侧任意一个空格，开始观察。\n# 未填写的空会在预演中使用参考脚手架。';$('consoleStatus').textContent='READY';
  $('replayBtn').disabled=true;$('pauseBtn').disabled=true;$('pauseBtn').textContent='暂停';
}
function invalidate(){revision++;clearTimeout(autoTimer);paused=false;axisReplay=false;scene.setPaused(false);lastRun=null;resetView();$('runBtn').disabled=false;$('runBtn').innerHTML='<span>▶</span> 运行完整代码 <kbd>Ctrl ↵</kbd>';}
function updateScenario(){const s=scenario();$('scenarioSelect').value=s.id;$('scenarioDescription').textContent=s.description;$('inputData').textContent=s.prelude||'# 本关直接在代码中传入实参，无额外输入。';}
function load(n){
  demoRecord=null;index=n;record();scenarioId=current().defaultScenario||current().scenarios[0].id;focusId=null;
  invalidate();$('hintBox').hidden=true;$('dataBox').hidden=true;$('dataBtn').setAttribute('aria-expanded','false');
  $('demoNotice').hidden=true;$('poseChallenges').hidden=current().id!=='09';
  document.querySelectorAll('[data-preset]').forEach(button=>button.classList.remove('selected'));
  $('lessonKicker').textContent=current().kicker;$('lessonNumber').textContent=`MISSION ${String(n+1).padStart(2,'0')}`;$('lessonTitle').textContent=current().title;$('lessonDescription').textContent=current().description;$('conceptText').textContent=current().concept;
  $('scenarioSelect').innerHTML=current().scenarios.map(s=>`<option value="${html(s.id)}">${html(s.label)}</option>`).join('');
  $('nextBtn').textContent=n===lessons.length-1?'回到第一关 ↺':'下一关 →';
  renderNav();renderEditor();updateScenario();feedback('','本关目标',current().objective);persist();
}
function compose(scaffold,clean=false){
  let code=current().code.replace(/\{\{([^}]+)\}\}/g,(_,id)=>record().values[id]?.trim()||(scaffold?current().blanks.find(b=>b.id===id).answer:'____'));
  if(clean)code=code.split('\n').filter(l=>!/^\s*#\s*@event\s+/.test(l)).join('\n');
  return scenario().prelude+'\n\n'+code;
}
function location(raw){
  const dataLines=scenario().prelude.split('\n').length;
  if(raw<=dataLines)return {area:'data',line:raw};
  const codeIndex=raw-dataLines-2;
  return {area:'code',line:Math.max(1,current().code.split('\n').slice(0,codeIndex+1).filter(l=>!/^\s*#\s*@event\s+/.test(l)).length)};
}
function markLine(raw){
  document.querySelectorAll('.active-line').forEach(l=>l.classList.remove('active-line'));
  if(!raw)return;const loc=location(raw);
  if(loc.area==='code')$('editor').children[loc.line-1]?.classList.add('active-line');
}
function format(value){
  if(value===null)return 'None';if(value===true)return 'True';if(value===false)return 'False';
  if(Array.isArray(value))return '('+value.map(format).join(', ')+')';
  if(typeof value==='object')return JSON.stringify(value);
  if(typeof value==='string')return '"'+value+'"';
  return String(value);
}
function showReturn(value,type){$('returnValue').textContent=format(value);$('returnValue').title=format(value);$('returnType').textContent=type||'';}
function mainResult(event,source){
  const lines=source.split('\n');
  let depth=0;
  for(let p=(event.line||0)-2;p>=0;p--){
    const line=lines[p].trim();if(!line||line.startsWith('#'))continue;
    const plain=line.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,'');
    depth+=(plain.match(/[)\]}]/g)||[]).length-(plain.match(/[(\[{]/g)||[]).length;
    if(depth>0)continue;
    const m=line.match(/^([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*)\s*=(?!=)/);
    if(m){const names=m[1].split(',').map(n=>n.trim());if(names.every(name=>Object.hasOwn(event.scope||{},name)))return {value:names.length===1?event.scope[names[0]]:names.map(n=>event.scope[n]),type:names.length===1?event.types?.[names[0]]:'tuple'};}
    break;
  }
  for(const name of ['result','ok','x','cost','text','ret'])if(Object.hasOwn(event.scope||{},name))return {value:event.scope[name],type:event.types?.[name]};
  return null;
}
function functionName(event,source){
  const lines=source.split('\n'),line=(event.line||1)-1;
  if(event.type==='call'){
    for(let n=line+1;n<lines.length;n++){const text=lines[n].trim();if(!text||text.startsWith('#'))continue;const match=[...text.matchAll(/([A-Za-z_]\w*)\s*\(/g)].find(m=>!['print','type','round'].includes(m[1]));if(match)return match[1]+'()';break;}
  }
  for(let n=line;n>=0;n--){const m=lines[n].match(/^\s*def\s+(\w+)\s*\(/);if(m)return m[1]+'()';}
  return '主流程';
}
function applyEvent(event,source){
  if(event.type==='output'){$('consoleOutput').append(document.createTextNode(event.text));$('consoleOutput').scrollTop=$('consoleOutput').scrollHeight;return;}
  const s=event.scope||{};
  if(typeof s.uav_id==='string')$('uavName').innerHTML=html(s.uav_id)+' <small>SIM</small>';
  if(finite(s.battery_percent))pose.battery=s.battery_percent;
  markLine(event.line);
  if(['define','call','enter'].includes(event.type))$('functionValue').textContent=functionName(event,source);
  switch(event.type){
    case 'define':
      markFlow('define');updatePose({mode:'defined',pitch:0,roll:0,height:0});setBadge('','函数已定义');$('sceneCaption').textContent='工具已创建 · 函数体尚未执行';$('traceExplanation').textContent='def 创建函数，函数体里的语句等待调用后才执行。';break;
    case 'call':
      clearFlow();markFlow('define');markFlow('call');
      if(pose.mode!=='flying')updatePose({mode:'called'});
      setBadge(pose.mode==='flying'?'flying':'','正在调用');$('sceneCaption').textContent='实参传入 · 开始一次函数调用';$('traceExplanation').textContent='主流程发起调用，实际数据交给本次函数的形参。';break;
    case 'enter':
      markFlow('enter');$('sceneCaption').textContent='进入函数体 · 按顺序执行';$('traceExplanation').textContent='现在真正执行函数体；参数来自刚才这一次调用。';break;
    case 'return':
      markFlow('return');$('sceneCaption').textContent='结束本次函数调用 · 交回结果';$('traceExplanation').textContent='遇到 return 就结束当前调用；没有显式 return 则在函数末尾返回 None。';break;
    case 'result':{
      markFlow('result');const result=mainResult(event,source);if(result)showReturn(result.value,result.type);
      if(result?.value===null){updatePose({mode:'landed',height:0,pitch:0,roll:0});setBadge('','默认返回 None');}
      $('sceneCaption').textContent='回到调用位置 · 接收返回值';$('traceExplanation').textContent='调用方接收的是返回对象；控制台的打印内容和返回值可以不同。';break;
    }
    case 'notice':
    case 'status':
      if(pose.mode!=='flying')updatePose({mode:'called',height:0,pitch:0,roll:0});
      $('sceneCaption').textContent=event.type==='status'?`状态输出 · 电量 ${s.battery_percent??'—'}%`:'通知已打印 · 飞行许可还需要单独判断';$('traceExplanation').textContent='这个函数负责打印。打印状态或起飞通知，并不会自动起飞。';break;
    case 'takeoff':
      updatePose({mode:'flying',pitch:0,roll:0,height:25});setBadge('flying','允许起飞');$('sceneCaption').textContent='返回值为真 → 主流程选择起飞演示';$('traceExplanation').textContent='调用方的 if 根据实际返回值，选择了起飞分支。';break;
    case 'blocked':
      updatePose({mode:'blocked',pitch:0,roll:0,height:0});setBadge('blocked','保持地面');$('sceneCaption').textContent='条件不通过 · 模型保持地面待命';$('traceExplanation').textContent='当前失败分支拒绝起飞。提前 return 后，后面的检查不会继续执行。';break;
    case 'attitude':
      updatePose({mode:'flying',pitch:finite(s.pitch)?s.pitch:0,roll:finite(s.roll)?s.roll:0,yaw:finite(s.yaw)?s.yaw:0,height:finite(s.height)?s.height:25});
      setBadge('flying','姿态已更新');$('sceneCaption').textContent=`实际返回 → 俯仰 ${pose.pitch}° / 横滚 ${pose.roll}° / 航向 ${pose.yaw}°`;$('traceExplanation').textContent='四项返回值已经按顺序接收。先改一个实参，观察对应轴；再组合三轴，用不同视角检验预测。';break;
    case 'log':{
      const log=s.log&&typeof s.log==='object'?s.log:{};
      const allowed=s.ok!==false;
      const height=finite(log.altitude_m)?log.altitude_m:finite(s.height)?s.height:0;
      updatePose({mode:allowed?'flying':'blocked',pitch:0,roll:0,height:allowed?height:0,battery:finite(log.battery_percent)?log.battery_percent:pose.battery});
      setBadge(allowed?'flying':'blocked',allowed?'日志数据回放':'禁止起飞');if(typeof s.text==='string')showReturn(s.text,'str');
      $('sceneCaption').textContent=allowed?`字符串简报已返回 · 回放日志高度 ${height}m`:'起飞判定为 False · 历史日志照常打印，模型留在地面';$('traceExplanation').textContent='make_log_brief 返回字符串；高度来自原日志，作为历史数据回放，不是函数直接控制飞行。';break;
    }
    case 'finish':
      if(pose.mode!=='flying'&&pose.mode!=='blocked'){updatePose({mode:'landed',pitch:0,roll:0,height:0});setBadge('','流程结束');}
      $('sceneCaption').textContent=pose.mode==='flying'?'保留实际返回的姿态 · 换个视角，或点击逐轴重演':pose.mode==='blocked'?'主流程结束 · 模型继续保持地面待命':'本次主流程结束 · 模型保持地面';
      break;
  }
}
async function execute(preview=false){
  clearTimeout(autoTimer);const missing=current().blanks.filter(b=>!filled(b));
  if(!preview&&missing.length){feedback('error',`还有 ${missing.length} 处待填写`,'完整运行需要填完代码；填写任一空格即可先预演。');$('editor').querySelector(`[data-blank="${missing[0].id}"]`)?.focus();return;}
  const token=++revision,partial=preview&&missing.length>0,demonstration=Boolean(demoRecord),source=compose(partial);paused=false;axisReplay=false;scene.setPaused(false);lastRun=null;
  $('runBtn').disabled=true;$('runBtn').innerHTML='<span>◌</span> 正在运行';$('replayBtn').disabled=true;$('pauseBtn').disabled=true;
  $('consoleOutput').textContent='';$('consoleStatus').textContent='RUNNING';$('previewMode').textContent=partial?'逐空预演 · 参考脚手架':'完整代码运行';clearFlow();
  feedback('',partial?'正在逐空预演':'正在运行完整 Python',partial?`本次未填的 ${missing.length} 处暂用参考脚手架；其余内容均按实际填写执行。`:'计算完成后，会按实际发生的调用和返回顺序回放。');
  const result=await runPython(source);if(token!==revision)return;
  if(result.error){result.displayError=result.error.replace(/\bon line (\d+)\b/g,(_,n)=>{const loc=location(Number(n));result.errorLocation=loc;return `（${loc.area==='data'?'输入数据':'左侧代码'}第 ${loc.line} 行）`;});}
  const wrong=current().blanks.filter(b=>filled(b)&&!matches(b));
  if(result.ok&&!partial&&!wrong.length&&!demonstration){record().done=true;persist();updateProgress();}
  if(!result.ok)feedback('error',`运行遇到 ${result.errorType||'错误'}`,wrong.length?`先检查 ${wrong.length} 处橙色填空，再对照终端定位。`:'对照终端中的代码行号，检查函数名、冒号、参数和返回值。');
  else if(wrong.length)feedback('',`程序已运行，还有 ${wrong.length} 处未达到本关目标`,'运行成功与填空目标匹配是两件事。点击空格后查看提示，或对照参考答案。');
  else if(demonstration)feedback('','试飞草稿运行成功 · 不计通关','左侧实参是真正运行的数据。可以继续改数字自由试飞；点击“返回我的填空”继续通关，原有练习保留。');
  else if(partial)feedback('success','这一处填写已匹配，预演完成',`当前匹配 ${current().blanks.filter(matches).length} / ${current().blanks.length} 空。未填空使用了脚手架，继续补全后运行完整代码。`);
  else feedback('success','本关完成 · 试着换一组数据',scenario().description+' '+(current().id==='09'?'四个数值探索空可以继续修改。':''));
  $('runBtn').disabled=false;$('runBtn').innerHTML='<span>▶</span> 运行完整代码 <kbd>Ctrl ↵</kbd>';
  lastRun={result,source,partial,demonstration};$('replayBtn').disabled=false;
  await replay(lastRun,token);
}
async function replay(run,token){
  paused=false;axisReplay=false;scene.setPaused(false);$('poseReplayBtn').disabled=true;$('pauseBtn').disabled=false;$('pauseBtn').textContent='暂停';$('consoleOutput').textContent='';$('consoleStatus').textContent='PLAYING';clearFlow();
  updatePose({mode:'idle',pitch:0,roll:0,yaw:0,height:0,battery:72});$('uavName').innerHTML='UAV–07 <small>SIM</small>';$('functionValue').textContent='—';$('returnValue').textContent='—';$('returnType').textContent='';
  $('previewMode').textContent=run.demonstration?'试飞草稿 · 不计通关':run.partial?'逐空预演 · 参考脚手架':'完整代码运行';
  const events=[];for(const e of run.result.events||[]){if(e.type==='output'&&events.at(-1)?.type==='output')events.at(-1).text+=e.text;else events.push({...e});}
  const count=events.filter(e=>e.type!=='output').length;let at=0;
  const reduced=!$('motionEnabled').checked;
  for(const event of events){
    if(token!==revision)return;
    while(paused&&token===revision)await new Promise(r=>setTimeout(r,80));if(token!==revision)return;
    applyEvent(event,run.source);if(event.type!=='output'){$('tracePosition').textContent=`${++at} / ${count} 个执行事件`;}
    const delay=reduced?15:(event.type==='output'?55:['attitude','takeoff','log'].includes(event.type)?1800:270);
    await waitForPlayback(delay,token);
  }
  if(token!==revision)return;
  if(!run.result.ok){
    const span=document.createElement('span');span.className='console-error';span.textContent='\n'+(run.result.displayError||run.result.error)+'\n';$('consoleOutput').append(span);
    const loc=run.result.errorLocation;if(loc?.area==='data'){$('dataBox').hidden=false;$('dataBtn').setAttribute('aria-expanded','true');}else if(loc?.area==='code')$('editor').children[loc.line-1]?.classList.add('error-line');
    updatePose({mode:'error',pitch:0,roll:0,height:0});setBadge('error','代码需要检查');$('sceneCaption').textContent=run.result.errorType==='SyntaxError'?'源码未通过解析 · 函数尚未执行':'执行中断 · 对照终端检查本次代码';
  }
  $('consoleStatus').textContent=run.result.ok?'FINISHED':'ERROR';$('pauseBtn').disabled=true;$('pauseBtn').textContent='暂停';$('consoleOutput').scrollTop=$('consoleOutput').scrollHeight;
  $('poseReplayBtn').disabled=!run.result.ok||pose.mode!=='flying';
}
async function waitForPlayback(milliseconds,token){let elapsed=0,last=performance.now();while(elapsed<milliseconds&&token===revision){await new Promise(resolve=>setTimeout(resolve,35));const now=performance.now();if(!paused)elapsed+=(now-last)*Number($('speedSelect').value);last=now;}}
function showHint(){const b=current().blanks.find(b=>b.id===focusId)||current().blanks.find(b=>!matches(b))||current().blanks[0];$('hintBox').hidden=false;$('hintBox').innerHTML=`<strong>第 ${current().blanks.indexOf(b)+1} 空</strong><br>${html(b.hint)}${matches(b)?'<br>✓ '+html(b.explanation):''}`;}
$('runBtn').onclick=()=>execute(false);
$('scenarioSelect').onchange=()=>{scenarioId=$('scenarioSelect').value;invalidate();updateScenario();if(current().blanks.some(filled))execute(true);else feedback('','情境已切换',scenario().description);};
$('dataBtn').onclick=()=>{$('dataBox').hidden=!$('dataBox').hidden;$('dataBtn').setAttribute('aria-expanded',String(!$('dataBox').hidden));};
$('hintBtn').onclick=showHint;
$('resetBtn').onclick=()=>{record().values={};record().done=false;if(demoRecord){invalidate();renderEditor();feedback('','试飞草稿已清空','可以重新填写并预演；返回我的填空后，原有练习仍然保留。');toast('已清空试飞草稿，原有练习保留');return;}persist();load(index);toast('当前关卡已重置');};
$('autoRun').onchange=()=>{clearTimeout(autoTimer);toast($('autoRun').checked?'已开启填空自动预演':'自动预演已关闭，填完后可手动运行');};
$('answerBtn').onclick=()=>{$('answerContent').innerHTML=current().blanks.map((b,n)=>`<div class="answer-row"><span>${String(n+1).padStart(2,'0')}</span><code>${html(b.answer)}</code><p>${html(b.explanation)}${b.numberRange?' 可探索范围：'+b.numberRange.join('～')+'。':''}</p></div>`).join('');$('answerDialog').showModal();};
$('fillAnswerBtn').onclick=()=>{invalidate();for(const b of current().blanks)record().values[b.id]=b.answer;renderEditor();persist();$('answerDialog').close();execute(false);};
$('guideBtn').onclick=()=>$('guideDialog').showModal();
document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>d.onclick=e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
$('cameraBtn').onclick=()=>scene.resetCamera();
$('replayBtn').onclick=()=>{if(lastRun)replay(lastRun,++revision);};
$('pauseBtn').onclick=()=>{paused=!paused;scene.setPaused(paused);$('pauseBtn').textContent=paused?'继续':'暂停';$('consoleStatus').textContent=paused?'PAUSED':axisReplay?'ATTITUDE REPLAY':'PLAYING';};
$('speedSelect').onchange=()=>scene.setPlaybackRate(Number($('speedSelect').value));
$('motionEnabled').onchange=()=>{scene.setMotionEnabled($('motionEnabled').checked);toast($('motionEnabled').checked?'已启用课堂姿态动画':'已切换为静态姿态，可继续修改角度观察');};
$('poseReplayBtn').onclick=()=>{paused=false;axisReplay=true;scene.setPaused(false);scene.replayAttitude();$('pauseBtn').disabled=false;$('pauseBtn').textContent='暂停';$('consoleStatus').textContent='ATTITUDE REPLAY';$('motionStatus').textContent='逐轴重演同一组实际返回值';};
document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>scene.setView(button.dataset.view));
function startPoseDemo(preset='combo'){
  const values={pitch:[30,0,0,35],roll:[0,-30,0,35],yaw:[0,0,120,35],combo:[28,-28,90,35],level:[0,0,0,35]}[preset]||[28,-28,90,35];
  load(lessons.findIndex(lesson=>lesson.id==='09'));
  demoRecord={values:Object.fromEntries(current().blanks.map(blank=>[blank.id,blank.answer])),done:false};
  ['pitch','roll','yaw','height'].forEach((key,n)=>demoRecord.values['l09_'+key]=String(values[n]));
  $('demoNotice').hidden=false;renderEditor();scene.setView(preset==='pitch'?'side':preset==='roll'?'front':preset==='yaw'?'top':'iso');
  document.querySelectorAll('[data-preset]').forEach(button=>button.classList.toggle('selected',button.dataset.preset===preset));
  execute(false);document.querySelector('.lab-grid').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
$('experienceBtn').onclick=()=>startPoseDemo();document.querySelectorAll('[data-preset]').forEach(button=>button.onclick=()=>startPoseDemo(button.dataset.preset));
$('exitDemoBtn').onclick=()=>load(index);
$('nextBtn').onclick=()=>{load((index+1)%lessons.length);$('lessonNav').querySelector('.active')?.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});};
$('downloadBtn').onclick=()=>{const missing=current().blanks.some(b=>!filled(b));const code='# -*- coding: utf-8 -*-\n# '+current().title+'\n# '+(missing?'未填空以 ____ 保留，请补全后运行。':'项目一：函数的定义、调用与返回值。')+'\n'+compose(false,true)+'\n';const url=URL.createObjectURL(new Blob([code],{type:'text/x-python;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='uav_toolbox_'+current().id+'.py';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&!document.querySelector('dialog[open]')){e.preventDefault();execute(false);}});
window.addEventListener('pagehide',event=>{if(!event.persisted)scene.destroy();});
scene.setPlaybackRate(Number($('speedSelect').value));scene.setMotionEnabled($('motionEnabled').checked);
load(index);
if(location.hash==='#attitude-demo')startPoseDemo();
window.addEventListener('hashchange',()=>{if(location.hash==='#attitude-demo')startPoseDemo();});
