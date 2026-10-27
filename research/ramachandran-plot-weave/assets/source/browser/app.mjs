import fixture from '../science/data/1crn-residues.json';
import { findMotif } from '../science/motif.mjs';
import { createRamachandranSession } from '../runtime/ramachandran-session.mjs';
import { AA_ORDER, angleOf, labelOf, renderPlot, renderHistogram, renderSequence, renderTable } from './render.mjs';

const $=id=>document.getElementById(id);
const rows=fixture.rows;
let runtime, snapshot, busy=false, playing=false, playbackToken=0;
const setText=(id,value)=>{const node=$(id);if(node)node.textContent=value;};
const status=message=>setText('rama-status',message);
const cleanIntent=value=>String(value??'').replace(/^\[[^\]]+\]\s*/,'');

function lineToHead() {
  const byId=new Map(snapshot.history.map(entry=>[entry.id,entry]));
  const path=[];let id=snapshot.head;const seen=new Set();
  while(id&&!seen.has(id)){seen.add(id);const entry=byId.get(id);if(!entry)break;path.unshift(entry);id=entry.parentId;}
  return path;
}
function errorText(error) {
  const code=String(error?.message??'');
  if(/TRAIL_LIMIT/.test(code))return 'This demo keeps up to 250 selection steps. Download your session before starting a new one.';
  if(/DATASET|CHECKSUM|FORMAT|TRAIL|REPLAY|RESIDUE|CURSOR|PATH_TIP|BASELINE/.test(code))return 'This saved session does not match the pinned protein data, format or valid exploration trail. The current session was kept.';
  if(/PATH_NAME/.test(code))return 'Use a path name of up to 60 letters, numbers, spaces, hyphens or underscores, starting with a letter or number.';
  return 'That action could not complete. Your existing session is still available; try a different selection or reload the example.';
}
async function act(work,message) {
  if(busy||playing)return;
  const focusId=document.activeElement?.id;
  setText('path-comparison','');
  busy=true;render();
  try{const result=await work();if(result)snapshot=result;else snapshot=await runtime.state();status(typeof message==='function'?message(snapshot):message??'Selection updated.');}
  catch(error){status(errorText(error));}
  finally{busy=false;render();if(focusId)$(focusId)?.focus({preventScroll:true});}
}
const choose=(ids,source,intent)=>act(()=>runtime.selectIds(ids,{source,intent}),`${ids.length} residue${ids.length===1?'':'s'} selected from ${source}.`);
const pick=(row,source)=>choose([row.id],source,`Select ${labelOf(row)}`);
const chooseType=aa=>choose(rows.filter(row=>row.oneLetter===aa).map(row=>row.id),'histogram',`Select amino-acid type ${aa}`);

function renderMotif() {
  const current=snapshot.history.find(entry=>entry.id===snapshot.cursor);
  const match=current?.source==='motif'?/^Motif ([A-Z]+)\b/.exec(cleanIntent(current.intent)):null;
  $('motif-matches').replaceChildren();
  if(!match){setText('motif-result','Search a literal amino-acid sequence. Matches become a shared selection.');return;}
  const result=findMotif(rows,match[1]);$('motif-query').value=match[1];
  const selected=new Set(snapshot.selectedIds);const matchingSelected=result.rowIds.filter(id=>selected.has(id)).length;
  setText('motif-result',`${result.matches.length} occurrence${result.matches.length===1?'':'s'} · ${matchingSelected}/${result.rowIds.length} matching residues selected`);
  for(const item of result.matches){const button=document.createElement('button');button.type='button';button.className='motif-match';button.disabled=busy||playing;button.textContent=`Chain ${item.chain}: ${item.startResidue}–${item.endResidue}`;button.addEventListener('click',()=>choose(item.rowIds,'motif',`Motif ${result.query} occurrence ${item.chain}:${item.startResidue}–${item.endResidue}`));$('motif-matches').append(button);}
}
function renderHistory() {
  const list=$('trail-list');list.replaceChildren();
  for(const entry of snapshot.history){const li=document.createElement('li');li.className=`trail-entry ${entry.current?'is-current':''} ${entry.onPath?'on-path':'off-path'}`;
    const button=document.createElement('button');button.type='button';button.disabled=busy||playing;button.setAttribute('aria-current',entry.current?'step':'false');
    const lead=document.createElement('span');lead.className='trail-id';lead.textContent=entry.id;
    const words=document.createElement('span');const title=document.createElement('strong');title.textContent=cleanIntent(entry.intent);const sub=document.createElement('small');sub.textContent=`${entry.source} · ${entry.selectedCount}/${rows.length} residues${entry.paths?.length?' · '+entry.paths.join(', '):''}`;words.append(title,sub);button.append(lead,words);
    button.addEventListener('click',()=>act(()=>runtime.seek(entry.id),`Showing recorded step ${entry.id}. Selecting from here creates a new path.`));li.append(button);list.append(li);}
  const names=snapshot.paths.map(path=>path.name);
  for(const id of ['path-switch','compare-a','compare-b']){const select=$(id);const previous=select.value;select.replaceChildren();for(const path of snapshot.paths){const option=document.createElement('option');option.value=path.name;option.textContent=path.name;select.append(option);}select.value=names.includes(previous)?previous:snapshot.currentPath??names[0]??'';}
  if(snapshot.paths.length>1&&$('compare-a').value===$('compare-b').value)$('compare-b').value=names.find(name=>name!==$('compare-a').value);
  setText('current-path',snapshot.currentPath??'Earlier step · detached cursor');
}
function render() {
  if(!snapshot)return;
  const disabled=busy||playing;
  const selected=new Set(snapshot.selectedIds);
  setText('selected-count',snapshot.selectedIds.length);
  setText('plotted-count',rows.filter(row=>selected.has(row.id)&&row.plotAvailable).length);
  setText('step-count',snapshot.history.length);
  setText('selection-summary',snapshot.hasSelection?`${snapshot.selectedIds.length} of 46 residues selected`:'All 46 residues · no active subset');
  renderPlot($('rama-plot'),rows,snapshot,{disabled,onPick:row=>pick(row,'scatter'),onBrush:ids=>choose(ids,'scatter','Brush φ/ψ region')});
  renderHistogram($('rama-histogram'),rows,snapshot,chooseType,disabled);
  renderSequence($('rama-sequence'),rows,snapshot,row=>pick(row,'sequence'),disabled);
  renderTable($('residue-table-body'),rows,snapshot,(row,checked)=>{const ids=new Set(snapshot.selectedIds);checked?ids.add(row.id):ids.delete(row.id);choose([...ids],'table',`${checked?'Include':'Remove'} ${labelOf(row)} in table selection`);},row=>pick(row,'table'),disabled);
  renderMotif();renderHistory();
  for(const control of document.querySelectorAll('[data-session-control]'))control.disabled=disabled;
  $('stop-replay').hidden=!playing;
  const line=lineToHead(),index=line.findIndex(entry=>entry.id===snapshot.cursor);
  $('step-back').disabled=disabled||index<=0;
  $('step-forward').disabled=disabled||index<0||index>=line.length-1;
  $('play-trail').disabled=disabled||line.length<2;
  $('compare-paths').disabled=disabled||snapshot.paths.length<2;
  $('save-path').disabled=disabled||snapshot.paths.length>=25;
  const slider=$('time-travel-slider');
  if(slider){
    slider.max=String(Math.max(0,line.length-1));slider.value=String(Math.max(0,index));slider.disabled=disabled||line.length<2||index<0;
    const beat=line[index];setText('time-travel-readout',beat?`${index+1} / ${line.length} · ${beat.id}`:'Outside the current path');
    slider.setAttribute('aria-valuetext',beat?`Step ${index+1} of ${line.length}: ${cleanIntent(beat.intent)}`:'Outside the current path');
    const beats=$('time-travel-beats');beats.replaceChildren();
    for(const [i,entry] of line.entries()){const marker=document.createElement('button');marker.type='button';marker.className=`time-beat ${i===index?'is-current':''}`;marker.style.left=`${line.length<2?0:i/(line.length-1)*100}%`;marker.disabled=disabled;marker.title=`${entry.id} · ${cleanIntent(entry.intent)}`;marker.setAttribute('aria-label',`Restore step ${i+1}: ${cleanIntent(entry.intent)}`);marker.setAttribute('aria-current',i===index?'step':'false');marker.addEventListener('click',()=>act(()=>runtime.seek(entry.id),`Time travel: ${cleanIntent(entry.intent)}`));beats.append(marker);}
  }

  document.querySelectorAll('#motif-matches button').forEach(button=>button.disabled=disabled);
}

async function searchMotif(query) {
  if(busy||playing)return;
  const result=findMotif(rows,query);
  if(result.error){status(result.error);return;}
  if(!result.query){status('Enter a motif, such as PG, CPG or II.');return;}
  if(!result.matches.length){setText('motif-result','No matching motif in this protein. The current selection was kept.');$('motif-matches').replaceChildren();status(`No matches for ${result.query}; selection unchanged.`);return;}
  await act(()=>runtime.selectIds(result.rowIds,{source:'motif',intent:`Motif ${result.query} · ${result.matches.length} occurrence${result.matches.length===1?'':'s'}`}),`${result.matches.length} motif occurrence${result.matches.length===1?'':'s'} found; ${result.rowIds.length} unique residues selected.`);
}
function download(name,text,type='application/json') {
  const url=URL.createObjectURL(new Blob([text],{type}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function play() {
  if(busy||playing)return;
  let line=lineToHead();if(line.length<2)return;
  const token=++playbackToken;playing=true;render();
  try{let index=line.findIndex(entry=>entry.id===snapshot.cursor);if(index<0||index===line.length-1){snapshot=await runtime.seek(line[0].id);index=0;render();}
    while(index<line.length-1&&token===playbackToken){await new Promise(resolve=>setTimeout(resolve,850));if(token!==playbackToken)break;snapshot=await runtime.seek(line[++index].id);render();status(`Replay ${index+1}/${line.length}: ${cleanIntent(line[index].intent)}`);}
  }catch(error){status(errorText(error));}
  finally{if(token===playbackToken){playing=false;render();}}
}

function bind() {
  $('time-travel-slider')?.addEventListener('input',event=>{const line=lineToHead(),i=Number(event.target.value),entry=line[i];if(entry){setText('time-travel-readout',`${i+1} / ${line.length} · ${entry.id}`);event.target.setAttribute('aria-valuetext',`Preview step ${i+1} of ${line.length}: ${cleanIntent(entry.intent)}; release to restore`);}});
  $('time-travel-slider')?.addEventListener('change',event=>{const line=lineToHead(),entry=line[Number(event.target.value)];if(entry)act(()=>runtime.seek(entry.id),`Time travel: ${cleanIntent(entry.intent)}`);});
  $('show-all').addEventListener('click',()=>act(()=>runtime.clear({source:'controls',intent:'Show the full protein'}),'All 46 residues shown.'));
  $('motif-form').addEventListener('submit',event=>{event.preventDefault();searchMotif($('motif-query').value);});
  document.querySelectorAll('[data-motif]').forEach(button=>button.addEventListener('click',()=>searchMotif(button.dataset.motif)));
  $('aa-select').replaceChildren(...AA_ORDER.map(aa=>{const option=document.createElement('option');option.value=aa;option.textContent=aa;return option;}));
  $('select-aa').addEventListener('click',()=>chooseType($('aa-select').value));
  $('start-trail').addEventListener('click',()=>act(()=>runtime.resetCursor(),'Showing the initial full-protein view.'));
  $('latest-trail').addEventListener('click',()=>act(()=>runtime.seek(snapshot.head),'Showing the latest step on this path.'));
  $('step-back').addEventListener('click',()=>{const line=lineToHead(),index=line.findIndex(entry=>entry.id===snapshot.cursor);if(index>0)act(()=>runtime.seek(line[index-1].id),'Showing previous recorded step.');});
  $('step-forward').addEventListener('click',()=>{const line=lineToHead(),index=line.findIndex(entry=>entry.id===snapshot.cursor);if(index>=0&&index<line.length-1)act(()=>runtime.seek(line[index+1].id),'Showing next recorded step.');});
  $('play-trail').addEventListener('click',play);
  $('stop-replay').addEventListener('click',()=>{++playbackToken;playing=false;render();status('Replay stopped at the current recorded step.');});
  $('path-form').addEventListener('submit',event=>{event.preventDefault();const name=$('path-name').value.trim();if(!name){status('Give this exploration path a name.');return;}act(()=>runtime.newPath(name),`Saved exploration path: ${name}.`);});
  $('switch-path').addEventListener('click',()=>act(()=>runtime.switchPath($('path-switch').value),'Switched to the selected path.'));
  $('compare-paths').addEventListener('click',()=>act(async()=>{const a=$('compare-a').value,b=$('compare-b').value;const result=await runtime.compare(a,b);const idsAt=tip=>{const entry=snapshot.history.find(row=>row.id===tip);return new Set(entry?.selectedIds??rows.map(row=>row.id));};const left=idsAt(result.a.tip),right=idsAt(result.b.tip);const shared=[...left].filter(id=>right.has(id));const describe=ids=>ids.length?ids.map(id=>labelOf(rows.find(row=>row.id===id))).join(', '):'none';const box=$('path-comparison');box.replaceChildren();for(const words of [`${a}: ${result.a.rows} residues · ${b}: ${result.b.rows} residues`,`${shared.length} residues shared by both selections.`,`Only in ${a}: ${describe([...left].filter(id=>!right.has(id)))}`,`Only in ${b}: ${describe([...right].filter(id=>!left.has(id)))}`]){const p=document.createElement('p');p.textContent=words;box.append(p);}return runtime.state();},'Path comparison completed from VizFootprint’s recorded branches.'));
  $('fresh-replay').addEventListener('click',()=>act(async()=>{const bundle=await runtime.exportSession();const fresh=await runtime.replaySession(bundle);runtime=fresh;return runtime.state();},'Fresh VizFootprint session reconstructed from the saved data, definition and trail.'));
  $('download-session').addEventListener('click',()=>act(async()=>{download('1crn-vizfootprint-session.json',JSON.stringify(await runtime.exportSession(),null,2));return runtime.state();},'Session downloaded with its pinned input data and exploration trail.'));
  $('download-selection').addEventListener('click',()=>{if(busy||playing)return;const fields=['id','chain','resSeq','resName','oneLetter','phi','psi'];const quote=value=>value===null?'':`"${String(value).replaceAll('"','""')}"`;download('1crn-selected-residues.csv',[fields.join(','),...snapshot.selectedRows.map(row=>fields.map(key=>quote(row[key])).join(','))].join('\n'),'text/csv');status('Selected residue rows downloaded. Undefined angles remain empty fields.');});
  $('open-session').addEventListener('change',async()=>{const file=$('open-session').files?.[0];if(!file)return;try{if(file.size>1000000)throw new Error('REPLAY_FILE_TOO_LARGE');const text=await file.text();await act(async()=>{const fresh=await runtime.replaySession(text);runtime=fresh;return runtime.state();},'Saved session replayed against the same pinned protein fixture.');}catch(error){status(errorText(error));}finally{$('open-session').value='';}});
  $('new-session').addEventListener('click',()=>act(async()=>{runtime=await createRamachandranSession(fixture);setText('path-comparison','');return runtime.state();},'New full-protein session started.'));
  $('theme-toggle').addEventListener('click',()=>{const light=document.documentElement.dataset.theme!=='light';document.documentElement.dataset.theme=light?'light':'dark';$('theme-toggle').setAttribute('aria-pressed',String(light));setText('theme-toggle',light?'Dark slate':'Light paper');});
  $('copy-citation').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('bibtex').textContent);setText('citation-status','Citation copied.');}catch{setText('citation-status','Select the citation text or download the BibTeX file.');}});
  window.addEventListener('pagehide',()=>{++playbackToken;playing=false;});
}

try { runtime=await createRamachandranSession(fixture);snapshot=await runtime.state();bind();render();status('Ready. Select residues in any view or try the PG motif.'); }
catch(error){status('The exploration could not start. Reload the page or read the data and source links below.');}
