const VALID=/^[ACDEFGHIKLMNPQRSTVWY]+$/;

/** Literal one-letter amino-acid subsequence search; overlapping matches kept.
 * Always search the complete fixture. If a caller supplies a filtered subset,
 * gaps in segmentIndex still prevent joining non-neighbouring residues.
 */
export function findMotif(rows,input) {
  const query=String(input??'').trim().toUpperCase();
  const empty={query,matches:[],rowIds:[],error:null};
  if(!query) return empty;
  if(query.length>100 || !VALID.test(query)) return {...empty,error:'Use 1–100 canonical one-letter amino-acid codes (A C D E F G H I K L M N P Q R S T V W Y); no wildcards.'};
  const groups=[];let current=[];
  for(const row of [...rows].sort((a,b)=>a.sequenceIndex-b.sequenceIndex)) {
    const prior=current.at(-1);
    if(prior && (row.model!==prior.model || row.chain!==prior.chain || row.segmentId!==prior.segmentId || row.segmentIndex!==prior.segmentIndex+1)) {groups.push(current);current=[];}
    current.push(row);
  }
  if(current.length) groups.push(current);
  const matches=[];
  for(const group of groups) {
    const sequence=group.map(r=>r.oneLetter).join('');
    for(let start=0;start<=sequence.length-query.length;start++) {
      if(sequence.slice(start,start+query.length)!==query) continue;
      const hit=group.slice(start,start+query.length);
      matches.push({segmentId:hit[0].segmentId,startIndex:hit[0].sequenceIndex,endIndex:hit.at(-1).sequenceIndex,rowIds:hit.map(r=>r.id),sequence:query,startResidue:hit[0].resSeq,endResidue:hit.at(-1).resSeq,chain:hit[0].chain,model:hit[0].model});
    }
  }
  return {query,matches,rowIds:[...new Set(matches.flatMap(m=>m.rowIds))],error:null};
}
