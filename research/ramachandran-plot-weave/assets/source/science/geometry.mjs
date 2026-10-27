// Deterministic backbone geometry for the curated demonstration fixture.
// This is a small PDB ATOM reader, not a general mmCIF/structure-validation tool.
export const AMINO_ACIDS = Object.freeze({ ALA:'A', ARG:'R', ASN:'N', ASP:'D', CYS:'C', GLN:'Q', GLU:'E', GLY:'G', HIS:'H', ILE:'I', LEU:'L', LYS:'K', MET:'M', PHE:'F', PRO:'P', SER:'S', THR:'T', TRP:'W', TYR:'Y', VAL:'V' });
const BACKBONE = ['N','CA','C'];
const dot = (a,b) => a.reduce((sum,v,i) => sum+v*b[i],0);
const sub = (a,b) => a.map((v,i) => v-b[i]);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const norm = a => Math.sqrt(dot(a,a));
const distance = (a,b) => norm(sub(a,b));

/** Signed torsion in degrees, normalized to [-180, 180); null if degenerate. */
export function dihedralDegrees(p0,p1,p2,p3) {
  if (![p0,p1,p2,p3].every(p => Array.isArray(p) && p.length===3 && p.every(Number.isFinite))) return null;
  const b0=sub(p0,p1), central=sub(p2,p1), b2=sub(p3,p2), length=norm(central);
  if (length<1e-12) return null;
  const axis=central.map(v=>v/length);
  const v=b0.map((n,i)=>n-dot(b0,axis)*axis[i]);
  const w=b2.map((n,i)=>n-dot(b2,axis)*axis[i]);
  if (norm(v)<1e-12 || norm(w)<1e-12) return null;
  const degrees=Math.atan2(dot(cross(axis,v),w),dot(v,w))*180/Math.PI;
  return ((degrees+180)%360+360)%360-180;
}

function chooseBackbone(atoms) {
  const backbone=atoms.filter(a=>BACKBONE.includes(a.name));
  const labels=[...new Set(backbone.map(a=>a.altLoc).filter(Boolean))];
  const candidates=(labels.length?labels:['']).map(label=>{
    const chosen={};
    for(const name of BACKBONE) {
      const matches=backbone.filter(a=>a.name===name && (a.altLoc===label || a.altLoc===''));
      matches.sort((a,b)=>(b.altLoc===label)-(a.altLoc===label) || b.occupancy-a.occupancy || a.serial-b.serial);
      if(matches[0]) chosen[name]=matches[0];
    }
    const complete=Object.keys(chosen).length;
    const occupancy=Object.values(chosen).reduce((n,a)=>n+a.occupancy,0)/(complete||1);
    return {label,chosen,complete,occupancy};
  });
  candidates.sort((a,b)=>b.complete-a.complete || b.occupancy-a.occupancy || (a.label==='A'?-1:b.label==='A'?1:a.label.localeCompare(b.label)));
  return candidates[0];
}

/**
 * Preserve atom/model/chain/residue/insertion/conformer identities.
 * ATOM records for the twenty canonical amino acids only. At a disordered
 * backbone choose one conformer, never mix A/B atoms: greatest completeness,
 * then mean occupancy, then A, then lexical order; blank atoms are shared.
 * A peptide is split by MODEL/chain/TER or C(i)-N(i+1) distance >= 1.8 Å,
 * following Bio.PDB.PPBuilder's default connectivity radius.
 */
export function parsePdbBackbone(text,{sourceId='protein',bondLimit=1.8}={}) {
  if(typeof text!=='string') throw new TypeError('PDB text required');
  if(!Number.isFinite(bondLimit) || bondLimit<=0) throw new RangeError('Positive peptide bond limit required');
  let model=1, terSegment=0, lastGroup='';
  const groups=[];
  for(const line of text.split(/\r?\n/)) {
    const record=line.slice(0,6).trim();
    if(record==='MODEL') { model=Number.parseInt(line.slice(10,14).trim(),10); if(!Number.isInteger(model)) throw new Error('Invalid MODEL number'); terSegment=0;lastGroup='';continue; }
    if(record==='TER' || record==='ENDMDL') { terSegment++;lastGroup='';continue; }
    if(record!=='ATOM') continue;
    const resName=line.slice(17,20).trim(); if(!AMINO_ACIDS[resName]) continue;
    const chain=line.slice(21,22).trim(), resSeq=Number.parseInt(line.slice(22,26).trim(),10), insertionCode=line.slice(26,27).trim();
    const coordinateTokens=[line.slice(30,38).trim(),line.slice(38,46).trim(),line.slice(46,54).trim()];
    const xyz=coordinateTokens.map(Number);
    if(!Number.isInteger(resSeq) || coordinateTokens.some(t=>t==='') || !xyz.every(Number.isFinite)) throw new Error('Invalid coordinate or residue identity');
    const key=JSON.stringify([model,chain,resSeq,insertionCode,terSegment]);
    if(key!==lastGroup) {groups.push({model,chain,resSeq,insertionCode,resName,terSegment,atoms:[]});lastGroup=key;}
    const g=groups.at(-1);
    if(g.resName!==resName) throw new Error('Alternate residue names are outside this fixture reader');
    g.atoms.push({name:line.slice(12,16).trim(),serial:Number.parseInt(line.slice(6,11),10),altLoc:line.slice(16,17).trim(),occupancy:Number(line.slice(54,60))||0,xyz});
  }
  const selected=groups.map(g=>({...g,backbone:chooseBackbone(g.atoms)}));
  const rows=[];
  let segment=0, segmentIndex=0;
  for(let i=0;i<selected.length;i++) {
    const g=selected[i], prev=selected[i-1], next=selected[i+1];
    const connected=(a,b)=>{
      if(!a || !b || a.model!==b.model || a.chain!==b.chain || a.terSegment!==b.terSegment) return false;
      const c=a.backbone.chosen.C,n=b.backbone.chosen.N;
      return Boolean(c && n && (!c.altLoc || !n.altLoc || c.altLoc===n.altLoc) && distance(c.xyz,n.xyz)<bondLimit);
    };
    const previousConnected=connected(prev,g),nextConnected=connected(g,next);
    if(i && !previousConnected) {segment++;segmentIndex=0;}
    const here=g.backbone.chosen;
    const phi=previousConnected ? dihedralDegrees(prev.backbone.chosen.C.xyz,here.N?.xyz,here.CA?.xyz,here.C?.xyz) : null;
    const psi=nextConnected ? dihedralDegrees(here.N?.xyz,here.CA?.xyz,here.C?.xyz,next.backbone.chosen.N.xyz) : null;
    const missingReason=[];
    if(phi===null) missingReason.push(previousConnected?'Phi requires complete, nondegenerate backbone atoms':'Phi unavailable at segment start or broken peptide bond');
    if(psi===null) missingReason.push(nextConnected?'Psi requires complete, nondegenerate backbone atoms':'Psi unavailable at segment end or broken peptide bond');
    const enc=v=>encodeURIComponent(String(v));
    const id=[sourceId,g.model,g.chain,g.resSeq,g.insertionCode,g.backbone.label,segment].map(enc).join(':');
    rows.push({id,sourceId,model:g.model,chain:g.chain,resSeq:g.resSeq,insertionCode:g.insertionCode,altLoc:g.backbone.label,resName:g.resName,oneLetter:AMINO_ACIDS[g.resName],sequenceIndex:i,segmentIndex:segmentIndex++,segmentId:[sourceId,g.model,enc(g.chain),segment].join(':'),phi:phi===null?null:Number(phi.toFixed(6)),psi:psi===null?null:Number(psi.toFixed(6)),plotAvailable:phi!==null&&psi!==null,missingReason,backboneAtomSerials:Object.fromEntries(Object.entries(here).map(([name,a])=>[name,a.serial])),backboneAtomAltLocs:Object.fromEntries(Object.entries(here).map(([name,a])=>[name,a.altLoc])),availableAltLocs:[...new Set(g.atoms.map(a=>a.altLoc))].sort()});
  }
  return rows;
}
