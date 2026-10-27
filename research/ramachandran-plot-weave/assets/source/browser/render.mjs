const NS = 'http://www.w3.org/2000/svg';
export const AA_ORDER = 'ACDEFGHIKLMNPQRSTVWY'.split('');
export const labelOf = row => `${row.chain || '∅'}:${row.resSeq}${row.insertionCode || ''} ${row.resName}`;
export const angleOf = value => value === null ? '—' : Number(value).toFixed(2);
function el(tag, attrs = {}, text) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}
const valid = row => Number.isFinite(row.phi) && Number.isFinite(row.psi);

export function renderPlot(svg, rows, snapshot, { onPick, onBrush, disabled = false } = {}) {
  const selected = new Set(snapshot.selectedIds);
  const left = 64, top = 28, side = 460;
  const x = a => left + (a + 180) / 360 * side;
  const y = a => top + (180 - a) / 360 * side;
  svg.setAttribute('viewBox', '0 0 560 540');
  svg.replaceChildren();
  svg.append(el('title', {}, 'Ramachandran plot for crambin, 1CRN'));
  svg.append(el('desc', {}, 'Phi is horizontal and psi vertical, from minus 180 to 180 degrees. Drag a rectangle to select residues, or select an individual point with the keyboard. Only complete angle pairs are plotted.'));
  svg.append(el('rect', { x:left, y:top, width:side, height:side, class:'plot-bg' }));
  for (const tick of [-180,-90,0,90,180]) {
    svg.append(el('line', { x1:x(tick), x2:x(tick), y1:top, y2:top+side, class:tick===0?'plot-zero':'plot-grid' }));
    svg.append(el('line', { x1:left, x2:left+side, y1:y(tick), y2:y(tick), class:tick===0?'plot-zero':'plot-grid' }));
    svg.append(el('text', { x:x(tick), y:top+side+23, 'text-anchor':'middle', class:'plot-tick' },String(tick)));
    svg.append(el('text', { x:left-11, y:y(tick)+4, 'text-anchor':'end', class:'plot-tick' },String(tick)));
  }
  svg.append(el('text', { x:left+side/2, y:532, 'text-anchor':'middle', class:'plot-axis' },'φ · phi (degrees)'));
  svg.append(el('text', { transform:'translate(17 258) rotate(-90)', 'text-anchor':'middle', class:'plot-axis' },'ψ · psi (degrees)'));
  for (const row of rows.filter(valid)) {
    const on = !snapshot.hasSelection || selected.has(row.id);
    const point = el('circle', { id:`plot-${row.sequenceIndex}`, cx:x(row.phi), cy:y(row.psi), r:5.5, class:`residue-point ${on?'is-selected':'is-muted'}`, 'data-row-id':row.id, tabindex:disabled?'-1':'0', role:'button', 'aria-label':`${labelOf(row)}, phi ${angleOf(row.phi)}, psi ${angleOf(row.psi)}. Select this residue.`, 'aria-pressed':String(snapshot.hasSelection&&selected.has(row.id)) });
    point.append(el('title', {}, `${labelOf(row)} · φ ${angleOf(row.phi)}° · ψ ${angleOf(row.psi)}°`));
    point.addEventListener('keydown', event => { if (!disabled && (event.key==='Enter'||event.key===' ')) { event.preventDefault();onPick?.(row); } });
    svg.append(point);
  }
  const brush = el('rect',{class:'brush-rect',visibility:'hidden'});svg.append(brush);
  let start = null, moved = false, targetId = null;
  // SVG can be letterboxed inside its CSS box. Use the screen transform so
  // brushing and the drawn points always share the same coordinate system.
  const rawPosition = event => {
    const point = svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  };
  const position = event => {
    const p=rawPosition(event);
    return {x:Math.max(left,Math.min(left+side,p.x)),y:Math.max(top,Math.min(top+side,p.y))};
  };
  svg.onpointerdown = event => {
    if(disabled||event.button!==0)return;
    const {x:rawX,y:rawY}=rawPosition(event);
    if(rawX<left||rawX>left+side||rawY<top||rawY>top+side)return;
    start=position(event);moved=false;targetId=event.target.getAttribute?.('data-row-id');
    svg.setPointerCapture(event.pointerId);
  };
  svg.onpointermove = event => {
    if(!start)return;const p=position(event);
    if(Math.hypot(p.x-start.x,p.y-start.y)>4)moved=true;
    if(moved){brush.setAttribute('visibility','visible');brush.setAttribute('x',Math.min(start.x,p.x));brush.setAttribute('y',Math.min(start.y,p.y));brush.setAttribute('width',Math.abs(p.x-start.x));brush.setAttribute('height',Math.abs(p.y-start.y));}
  };
  svg.onpointerup = event => {
    if(!start)return;const p=position(event), from=start;start=null;brush.setAttribute('visibility','hidden');
    if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);
    if(moved){const ids=rows.filter(valid).filter(row=>x(row.phi)>=Math.min(from.x,p.x)&&x(row.phi)<=Math.max(from.x,p.x)&&y(row.psi)>=Math.min(from.y,p.y)&&y(row.psi)<=Math.max(from.y,p.y)).map(row=>row.id);onBrush?.(ids);}
    else if(targetId){const row=rows.find(row=>row.id===targetId);if(row)onPick?.(row);}
  };
  svg.onpointercancel = () => {start=null;brush.setAttribute('visibility','hidden');};
}

export function renderHistogram(svg, rows, snapshot, onType, disabled = false) {
  const selected=new Set(snapshot.selectedIds);
  const counts=AA_ORDER.map(aa=>({aa,total:rows.filter(r=>r.oneLetter===aa).length,picked:rows.filter(r=>r.oneLetter===aa&&selected.has(r.id)).length}));
  const max=Math.max(...counts.map(c=>c.total),1), baseline=155, step=25;
  svg.setAttribute('viewBox','0 0 540 205');svg.replaceChildren();
  svg.append(el('title',{},'Amino-acid composition: full protein and current selection'));
  for(const [i,count] of counts.entries()) {
    const gx=20+i*step;
    const group=el('g',{role:count.total?'button':'img',tabindex:!disabled&&count.total?'0':'-1','aria-label':`${count.aa}: ${count.total} total, ${count.picked} selected. Select this amino-acid type.`,class:count.total?'hist-target':''});
    group.append(el('rect',{x:gx,y:baseline-count.total/max*120,width:18,height:count.total/max*120,class:'hist-total'}));
    group.append(el('rect',{x:gx,y:baseline-count.picked/max*120,width:18,height:count.picked/max*120,class:'hist-picked'}));
    group.append(el('text',{x:gx+9,y:baseline+20,'text-anchor':'middle',class:'plot-tick'},count.aa));
    group.append(el('text',{x:gx+9,y:baseline-count.total/max*120-8,'text-anchor':'middle',class:'plot-tick'},`${count.picked}/${count.total}`));
    if(count.total){group.addEventListener('click',()=>{if(!disabled)onType(count.aa);});group.addEventListener('keydown',e=>{if(!disabled&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onType(count.aa);}});}
    svg.append(group);
  }
  svg.append(el('text',{x:270,y:199,'text-anchor':'middle',class:'plot-axis'},'selected / full-protein count'));
}

export function renderSequence(container, rows, snapshot, onPick, disabled = false) {
  const selected=new Set(snapshot.selectedIds);container.replaceChildren();
  for(const row of rows){const button=document.createElement('button');button.id=`sequence-${row.sequenceIndex}`;button.type='button';button.className=`sequence-letter ${!snapshot.hasSelection||selected.has(row.id)?'is-selected':'is-muted'}`;button.disabled=disabled;button.textContent=row.oneLetter;button.setAttribute('aria-label',`${labelOf(row)}. ${valid(row)?'Both angles defined':'One terminal angle is undefined'}. Select residue.`);button.title=`${labelOf(row)} · φ ${angleOf(row.phi)}° · ψ ${angleOf(row.psi)}°`;button.addEventListener('click',()=>onPick(row));container.append(button);}
}

export function renderTable(body, rows, snapshot, onToggle, onPick, disabled = false) {
  const selected=new Set(snapshot.selectedIds);body.replaceChildren();
  for(const row of rows){const tr=document.createElement('tr');tr.className=selected.has(row.id)?'row-selected':'row-muted';
    const checkCell=document.createElement('td');const checkbox=document.createElement('input');checkbox.id=`check-${row.sequenceIndex}`;checkbox.type='checkbox';checkbox.checked=selected.has(row.id);checkbox.disabled=disabled;checkbox.setAttribute('aria-label',`Include ${labelOf(row)} in selection`);checkbox.addEventListener('change',()=>onToggle(row,checkbox.checked));checkCell.append(checkbox);tr.append(checkCell);
    const nameCell=document.createElement('td');const button=document.createElement('button');button.type='button';button.className='table-residue';button.textContent=labelOf(row);button.disabled=disabled;button.addEventListener('click',()=>onPick(row));nameCell.append(button);tr.append(nameCell);
    for(const value of [row.oneLetter,angleOf(row.phi),angleOf(row.psi)]){const td=document.createElement('td');td.textContent=value;tr.append(td);}body.append(tr);
  }
}
