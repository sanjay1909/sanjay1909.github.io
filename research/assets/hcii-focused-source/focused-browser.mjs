import { DEFAULT_MODEL, SOURCES, runScenario } from './demo-core.mjs';
import { createTrail } from './trail.mjs';
const $=id=>document.getElementById(id);
const kind=document.body.dataset.paper==='chatbot'?'chatbot':'evidence';
let apiKey='',controller=null,busy=false,playing=false,epoch=0,playToken=0,baseline=null,lastResult=null;
const text=(id,value)=>{if($(id))$(id).textContent=value;};
const status=value=>text('demo-status',value);
function settings(){return {question:$('demo-question').value.trim(),current:$('customer-current')?.value.trim()||'Delta Airlines',mode:$('run-mode').value,model:$('model-id').value.trim()||DEFAULT_MODEL,excluded:[...document.querySelectorAll('[data-source]')].filter(n=>!n.checked).map(n=>n.dataset.source)};}
function viewFor(phase,s,{result=null,activity=[],consulted=[],base=null,customer=s.current}={}){return {phase,settings:{...s,excluded:[...s.excluded]},result,activity:[...activity],consulted:consulted.map(x=>({...x})),liveCustomer:customer,baseline:base};}
let trail=createTrail({kind,initialState:viewFor('ready',settings())});
function lineage(s=trail.state()){const entries=new Map(s.entries.map(e=>[e.id,e]));const line=[];let id=s.head;while(id){const entry=entries.get(id);if(!entry)break;line.unshift(entry);id=entry.parentId;}return line;}
function lock(){
  const disabled=busy||playing;
  for(const n of document.querySelectorAll('.request-pane input,.request-pane select,.request-pane textarea,.request-pane button,[data-run],#apply-action,#compare-run,#export-run,#download-session,#open-session,#new-session,#path-switch,#switch-path'))n.disabled=disabled;
  $('forget-key').disabled=false;
  $('compare-run')&&($('compare-run').disabled=disabled||!baseline);
  $('export-run').disabled=disabled||!lastResult;
  $('apply-action')&&($('apply-action').disabled=disabled||lastResult?.decision?.action!=='reset');
  $('cancel-run').hidden=!busy;$('stop-replay').hidden=!playing;
}
function sourceRow(source,result){const li=document.createElement('li'),label=document.createElement('strong'),body=document.createElement('span');label.textContent=source.label;body.textContent=source.text;li.append(label,body);const rank=result?.ranking?.find(r=>r.id===source.id);if(rank&&Number.isFinite(rank.score)){const meter=document.createElement('meter');meter.min=0;meter.max=1;meter.value=rank.score;meter.setAttribute('aria-label',`Illustrative alignment for ${source.label}: ${rank.score.toFixed(3)}`);const note=document.createElement('small');note.textContent=`Illustrative alignment · ${rank.score.toFixed(3)} · correlational`;li.append(meter,note);}return li;}
function renderResult(view){
  const result=view.result;lastResult=result;baseline=view.baseline;
  const started=view.phase!=='ready';$('empty-result').hidden=started;$('result-panel').hidden=!started;
  text('session-customer',view.liveCustomer);
  text('result-mode',result?(result.mode==='sample'?'Scripted sample · real AgentFootprint execution':`Recorded live Anthropic output · ${result.model}`):view.phase==='ready'?'':`Recorded progress · ${view.phase}`);
  text('result-question',view.settings.question);
  const resultHeading=$('result-panel').querySelector('h3');if(resultHeading)resultHeading.textContent=result?(kind==='evidence'?'Recommendation':'Context decision'):'Recorded progress';
  text('answer-text',result?(result.decision?.explanation??result.answer):view.phase==='failed'||view.phase==='cancelled'?'This run has no completed answer.':view.activity.at(-1)||'Run requested. Waiting for recorded activity…');
  text('recorded-events',result?`${result.eventCount} events captured by AgentFootprint`:'The final result is available only after the run completes.');
  text('decision-action',result?.decision?.action??'—');text('decision-customer',result?.decision?.customer??view.liveCustomer);
  if($('recorded-evidence')){const list=$('recorded-evidence');list.replaceChildren();const sources=result?.consulted??view.consulted;const ranked=[...sources].sort((a,b)=>(result?.ranking?.find(r=>r.id===b.id)?.score??-1)-(result?.ranking?.find(r=>r.id===a.id)?.score??-1));for(const source of ranked)list.append(sourceRow(source,result));if(!sources.length){const li=document.createElement('li');li.textContent=result?'No evidence tools were consulted.':'No evidence returned yet at this recorded step.';list.append(li);}}
  text('comparison-note',view.baseline&&result&&result.excluded.join('|')!==view.baseline.excluded.join('|')?'This is one rerun with unchecked sources removed. A difference between two answers does not prove a causal effect.':'Uncheck an evidence source and compare to rerun the original question. Replay itself makes no model call.');
  text('activity-log',view.activity.join('\n')||'No agent activity recorded yet.');
  document.body.dataset.phase=view.phase;
}
function renderHistory(){const snap=trail.state(),line=lineage(snap),i=line.findIndex(e=>e.id===snap.cursor),disabled=busy||playing;
  text('current-path',snap.currentPath);text('step-total',snap.entries.length);
  const list=$('trail-list');list.replaceChildren();for(const entry of snap.entries){const li=document.createElement('li');li.className=`trail-entry ${entry.id===snap.cursor?'is-current':''} ${line.some(x=>x.id===entry.id)?'':'off-path'}`;const b=document.createElement('button');b.type='button';b.disabled=disabled;b.setAttribute('aria-current',entry.id===snap.cursor?'step':'false');const id=document.createElement('small');id.textContent=entry.id;const label=document.createElement('span');label.textContent=entry.label;b.append(id,label);b.addEventListener('click',()=>navigate(entry.id));li.append(b);list.append(li);}
  const active=list.querySelector('.is-current');if(active){const top=active.offsetTop-list.offsetTop;if(top<list.scrollTop)list.scrollTop=top;else if(top+active.offsetHeight>list.scrollTop+list.clientHeight)list.scrollTop=top+active.offsetHeight-list.clientHeight;}
  const sel=$('path-switch'),old=sel.value;sel.replaceChildren();for(const path of snap.paths){const opt=document.createElement('option');opt.value=path.name;opt.textContent=path.name;sel.append(opt);}sel.value=snap.paths.some(p=>p.name===old)?old:snap.currentPath;
  const range=$('time-travel-slider');range.max=String(Math.max(0,line.length-1));range.value=String(Math.max(0,i));range.disabled=disabled||line.length<2||i<0;const entry=line[i];range.setAttribute('aria-valuetext',entry?`Step ${i+1} of ${line.length}: ${entry.label}`:'Outside the current path');text('time-travel-readout',entry?`${i+1} / ${line.length} · ${entry.id}`:'Outside current path · use Latest');
  const beats=$('time-travel-beats');beats.replaceChildren();for(const [index,entry]of line.entries()){const b=document.createElement('button');b.type='button';b.className=`time-beat ${index===i?'is-current':''}`;b.style.left=`${line.length<2?0:index/(line.length-1)*100}%`;b.disabled=disabled;b.title=`${entry.id} · ${entry.label}`;b.setAttribute('aria-label',`Restore step ${index+1}: ${entry.label}`);b.addEventListener('click',()=>navigate(entry.id));beats.append(b);}
  $('previous-step').disabled=disabled||i<=0;$('next-step').disabled=disabled||i<0||i>=line.length-1;$('first-step').disabled=disabled;$('latest-step').disabled=disabled;$('play-trail').disabled=disabled||line.length<2;
}
function show(view,{historical=false}={}){
  $('demo-question').value=view.settings.question;if($('customer-current'))$('customer-current').value=view.liveCustomer;
  for(const box of document.querySelectorAll('[data-source]'))box.checked=!view.settings.excluded.includes(box.dataset.source);
  if(historical){$('run-mode').value='sample';if(view.settings.mode==='sample')$('model-id').value=view.settings.model;}
  renderResult(view);if(historical&&view.baseline?.mode==='live')baseline=null;
  lock();renderHistory();
}
function record(label,view){const snap=trail.record(label,view);show(snap.current);return snap;}
function navigate(id){if(busy||playing)return;const snap=trail.seek(id);show(snap.current,{historical:true});status(`Time travel: ${snap.entries.find(e=>e.id===id).label}. Display restored; no model call.`);}
function errorMessage(error){const m=String(error?.message??'');if(m.includes('KEY_REQUIRED'))return 'Add your own Anthropic key before running live, or choose the scripted sample.';if(m.includes('INVALID_DECISION'))return 'The model returned no valid action. The current customer was kept.';if(m.includes('CALL_LIMIT'))return 'The run reached its six-request limit.';if(/timed out/i.test(m))return 'The run timed out and was stopped. A request already sent may still be billed.';if(/abort|cancel/i.test(m))return 'Run stopped. A request already sent may still be billed.';if(/401|403/.test(m))return 'Anthropic rejected the request. Check your key and model access.';if(/429/.test(m))return 'Anthropic reported a usage limit. Try the scripted sample.';if(/404/.test(m))return 'This model is unavailable to your account. Check its model ID.';return 'The run could not complete. Your recorded steps remain available.';}
async function run(comparison=false){
  if(busy||playing)return;
  if(trail.state().entries.length>185){status('This trail is nearly full. Download it, then start a new session before another run.');return;}
  const previous=comparison?baseline:null;if(comparison&&!previous)return;
  const s=settings();if(previous){s.question=previous.question;s.mode=previous.mode;s.model=previous.model;}
  if(!s.question||s.question.length>2000){status('Enter a question of up to 2,000 characters.');return;}
  if(!/^[a-zA-Z0-9._:-]{1,100}$/.test(s.model)){status('Use a valid Anthropic model ID.');return;}
  if(s.mode==='live'&&!apiKey){status(errorMessage(Error('KEY_REQUIRED')));return;}
  if(previous&&s.excluded.length===previous.excluded.length&&s.excluded.every(x=>previous.excluded.includes(x))){status('Change the evidence selection before comparing.');return;}
  if(previous&&previous.excluded.some(x=>!s.excluded.includes(x))){status('Start a new baseline with Run example before restoring previously unavailable evidence.');return;}
  const token=++epoch;controller=new AbortController();busy=true;let activity=[],consulted=[],started=false,captureFailed=false;
  try{
    record(s.mode==='sample'?'Run requested · scripted sample':'Run requested · live Anthropic',viewFor('started',s));started=true;
    status(s.mode==='sample'?'Running the scripted sample through AgentFootprint…':'Running live. Your question and selected fictional data are sent to Anthropic using your API credits.');
    const result=await runScenario({kind,mode:s.mode,key:apiKey,model:s.model,question:s.question,current:s.current,excluded:s.excluded,signal:controller.signal,onRecord:event=>{if(token!==epoch||captureFailed)return;activity=event.activity;consulted=event.consulted;try{record(event.label,viewFor('activity',s,{activity,consulted}));}catch(error){captureFailed=true;controller?.abort(error);}}});
    if(token!==epoch)return;if(captureFailed){status('The saved trail is full. The latest valid step was kept. Download it and start a new session.');return;}const base=previous??{question:s.question,mode:s.mode,model:s.model,excluded:[...s.excluded]};
    record(comparison?'Comparison completed':'Answer completed',viewFor('completed',s,{result,activity:result.activity,consulted:result.consulted,base}));if(document.body.dataset.pane==='request'){document.body.dataset.pane='result';for(const tab of document.querySelectorAll('[data-pane-tab]'))tab.setAttribute('aria-pressed',String(tab.dataset.paneTab==='result'));}status('Run complete. Inspect the result, compare, or travel through its recorded steps.');
  }catch(error){if(token===epoch){if(started&&!captureFailed){try{record(/abort|cancel/i.test(String(error?.message))?'Run stopped':'Run failed',viewFor(/abort|cancel/i.test(String(error?.message))?'cancelled':'failed',s,{activity,consulted}));}catch{captureFailed=true;}}status(captureFailed||/TRAIL_.*LIMIT/.test(String(error?.message))?'The saved trail is full. The latest valid step was kept. Download it and start a new session.':errorMessage(error));}}
  finally{if(token===epoch){controller=null;busy=false;lock();renderHistory();}}
}
function stop(){if(!busy)return;const old=trail.state().current,wasRun=Boolean(controller);controller?.abort(new Error('User cancelled'));++epoch;controller=null;busy=false;try{if(wasRun)record('Run stopped',{...old,phase:'cancelled',result:null,baseline:null});status(wasRun?'Run stopped. Any request already sent may still be billed.':'Session import cancelled. The existing trail was kept.');}catch{status('Run stopped. The latest valid recorded step was kept.');}finally{lock();renderHistory();}}

async function play(){if(busy||playing)return;const line=lineage();if(line.length<2)return;let index=line.findIndex(e=>e.id===trail.state().cursor);if(index<0||index===line.length-1)index=0;const token=++playToken;playing=true;show(trail.seek(line[index].id).current,{historical:true});try{while(index<line.length-1&&token===playToken){await new Promise(r=>setTimeout(r,650));if(token!==playToken)break;show(trail.seek(line[++index].id).current,{historical:true});status(`Replay ${index+1}/${line.length} · ${line[index].label}. No model call.`);}}finally{if(token===playToken){playing=false;lock();renderHistory();}}}
function download(name,data){const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function toolTab(name){document.body.dataset.historyTool=name;const pane=document.querySelector('.trail-pane');if(pane)pane.scrollTop=0;for(const n of document.querySelectorAll('[data-tool-tab]'))n.setAttribute('aria-pressed',String(n.dataset.toolTab===name));$('tools-replay').hidden=name!=='replay';$('tools-session').hidden=name!=='session';renderHistory();}
for(const b of document.querySelectorAll('[data-pane-tab]'))b.addEventListener('click',()=>{document.body.dataset.pane=b.dataset.paneTab;for(const n of document.querySelectorAll('[data-pane-tab]'))n.setAttribute('aria-pressed',String(n===b));});
for(const b of document.querySelectorAll('[data-tool-tab]'))b.addEventListener('click',()=>toolTab(b.dataset.toolTab));
$('time-travel-toggle').addEventListener('click',()=>{const p=$('time-travel-panel');p.hidden=!p.hidden;$('time-travel-toggle').setAttribute('aria-expanded',String(!p.hidden));if(!p.hidden)$('time-travel-slider').focus();renderHistory();});
$('time-travel-slider').addEventListener('input',event=>{const line=lineage(),i=Number(event.target.value),entry=line[i];if(entry){text('time-travel-readout',`${i+1} / ${line.length} · ${entry.id}`);event.target.setAttribute('aria-valuetext',`Preview step ${i+1}: ${entry.label}; release to restore`);}});
$('time-travel-slider').addEventListener('change',event=>{const entry=lineage()[Number(event.target.value)];if(entry)navigate(entry.id);});
$('first-step').addEventListener('click',()=>navigate(lineage()[0].id));$('latest-step').addEventListener('click',()=>navigate(trail.state().head));
$('previous-step').addEventListener('click',()=>{const line=lineage(),i=line.findIndex(e=>e.id===trail.state().cursor);if(i>0)navigate(line[i-1].id);});$('next-step').addEventListener('click',()=>{const line=lineage(),i=line.findIndex(e=>e.id===trail.state().cursor);if(i>=0&&i<line.length-1)navigate(line[i+1].id);});
$('play-trail').addEventListener('click',play);$('stop-replay').addEventListener('click',()=>{++playToken;playing=false;lock();renderHistory();status('Replay paused at this recorded step.');});
$('switch-path').addEventListener('click',()=>{if(busy||playing)return;const snap=trail.switchPath($('path-switch').value);show(snap.current,{historical:true});status('Recorded path opened. No model call.');});
document.querySelector('[data-run]').addEventListener('click',()=>run());$('compare-run')?.addEventListener('click',()=>run(true));$('cancel-run').addEventListener('click',stop);
for(const b of document.querySelectorAll('[data-example]'))b.addEventListener('click',()=>{if(busy||playing)return;$('demo-question').value=b.dataset.example;baseline=null;lock();status('Example selected. Select Run example to execute it.');});
for(const id of ['demo-question','customer-current','run-mode','model-id'])$(id)?.addEventListener(id==='run-mode'?'change':'input',()=>{baseline=null;lock();});
$('apply-action')?.addEventListener('click',()=>{if(busy||playing||lastResult?.decision?.action!=='reset')return;const old=trail.state().current,next=lastResult.decision.customer;record(`Customer switch applied · ${next}`,{...old,phase:'applied',settings:{...old.settings,current:next},liveCustomer:next});status(`Fictional session switched to ${next}. No external customer system is connected.`);});
$('connect-key').addEventListener('click',()=>{if(busy||playing)return;const value=$('api-key').value.trim();if(!value){status('Paste your own Anthropic key to enable live mode.');return;}apiKey=value;$('api-key').value='';$('run-mode').value='live';baseline=null;text('key-state','Key available in this tab only.');status('Live mode ready. No request is sent until you select Run example.');lock();});
$('forget-key').addEventListener('click',()=>{apiKey='';$('api-key').value='';try{if(busy)stop();}finally{++playToken;playing=false;apiKey='';$('api-key').value='';$('run-mode').value='sample';baseline=null;text('key-state','No key added.');lock();renderHistory();status('Key cleared. Scripted sample selected; recorded results remain available for replay.');}});
$('export-run').addEventListener('click',()=>{if(lastResult&&!busy&&!playing)download(`${kind}-recorded-run.json`,lastResult);});
$('download-session').addEventListener('click',()=>{if(busy||playing)return;download(`${kind}-recorded-session.json`,trail.exportBundle());status('Session downloaded without credentials. Replay restores recorded states without model calls.');});
$('open-session').addEventListener('change',async()=>{const file=$('open-session').files?.[0];if(!file||busy||playing)return;const token=++epoch;busy=true;lock();renderHistory();try{if(file.size>2000000)throw Error('too large');const saved=await file.text();if(token!==epoch)return;const fresh=trail.importBundle(saved);if(fresh.state().kind!==kind)throw Error('wrong demo');trail=fresh;show(trail.state().current,{historical:true});status('Saved display session opened. Scripted sample selected; no model request was sent.');}catch{if(token===epoch)status('This file is not a valid saved session for this demo. Your existing session was kept.');}finally{$('open-session').value='';if(token===epoch){busy=false;lock();renderHistory();}}});

$('new-session').addEventListener('click',()=>{if(busy||playing)return;$('run-mode').value='sample';baseline=null;lastResult=null;trail=createTrail({kind,initialState:viewFor('ready',settings())});show(trail.state().current);status('New session started. Download a trail before clearing it if you want to keep it.');});
$('theme-toggle').addEventListener('click',()=>{const light=document.documentElement.dataset.theme!=='light';document.documentElement.dataset.theme=light?'light':'dark';$('theme-toggle').setAttribute('aria-pressed',String(light));text('theme-toggle',light?'Dark slate':'Light paper');});
window.addEventListener('resize',()=>renderHistory());
window.addEventListener('pagehide',()=>{controller?.abort();++epoch;++playToken;});
show(trail.state().current);status('Ready. Run the scripted sample; time travel and replay make no model requests.');
