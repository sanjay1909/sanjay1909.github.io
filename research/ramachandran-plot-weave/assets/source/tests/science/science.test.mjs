import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dihedralDegrees,parsePdbBackbone } from '../../science/geometry.mjs';
import { findMotif } from '../../science/motif.mjs';
const fixture=JSON.parse(readFileSync(new URL('../../science/data/1crn-residues.json',import.meta.url),'utf8'));
const pdb=readFileSync(new URL('../../science/data/1CRN.pdb',import.meta.url),'utf8');

test('fixture regeneration preserves source, unique identities, and missing terminal angles',()=>{
  const actual=parsePdbBackbone(pdb,{sourceId:'1CRN'});
  assert.deepEqual(actual,fixture.rows);
  assert.equal(createHash('sha256').update(pdb).digest('hex'),fixture.metadata.sourceSha256);
  assert.equal(actual.length,46);assert.equal(new Set(actual.map(r=>r.id)).size,46);
  assert.equal(actual.filter(r=>r.plotAvailable).length,44);
  assert.equal(actual[0].phi,null);assert.equal(actual.at(-1).psi,null);
  assert.equal(actual.map(r=>r.oneLetter).join(''),'TTCCPSIVARSNFNVCRLPGTPEAICATYTGCIIIPGATCPGDYAN');
  for(const row of actual) for(const key of ['phi','psi']) assert.ok(row[key]===null || (Number.isFinite(row[key]) && row[key]>=-180 && row[key]<180));
});
test('signed torsion distinguishes handedness and preserves degenerate absence',()=>{
  assert.equal(dihedralDegrees([1,0,0],[0,0,0],[0,1,0],[0,1,1]),-90);
  assert.equal(dihedralDegrees([1,0,0],[0,0,0],[0,1,0],[0,1,-1]),90);
  assert.equal(dihedralDegrees([0,0,0],[0,0,0],[0,0,0],[0,1,1]),null);
  assert.equal(dihedralDegrees(undefined,[0,0,0],[0,1,0],[0,1,1]),null);
});
test('real sequence motifs return exact stable residue IDs, including overlaps',()=>{
  const pg=findMotif(fixture.rows,'pg');assert.equal(pg.error,null);assert.equal(pg.query,'PG');
  assert.deepEqual(pg.matches.map(m=>[m.startResidue,m.endResidue]),[[19,20],[36,37],[41,42]]);
  const cpg=findMotif(fixture.rows,'CPG');assert.deepEqual(cpg.matches.map(m=>[m.startResidue,m.endResidue]),[[40,42]]);
  const iii=findMotif(fixture.rows,'II');assert.deepEqual(iii.matches.map(m=>[m.startResidue,m.endResidue]),[[33,34],[34,35]]);
  assert.equal(iii.rowIds.length,3);
  assert.deepEqual(findMotif(fixture.rows,'WW').matches,[]);
  assert.equal(findMotif(fixture.rows,'').error,null);
  assert.ok(findMotif(fixture.rows,'P.*G').error);
});
test('motif matching cannot jump a removed residue, a chain boundary or a segment boundary',()=>{
  const rows=fixture.rows.slice(0,4).map((r,i)=>({...r,id:`test${i}`,oneLetter:'A',segmentIndex:i,sequenceIndex:i}));
  assert.equal(findMotif(rows,'AAA').matches.length,2);
  assert.equal(findMotif([rows[0],rows[2],rows[3]],'AAA').matches.length,0);
  assert.equal(findMotif(rows.map((r,i)=>i>=2?{...r,chain:'B'}:r),'AAA').matches.length,0);
  assert.equal(findMotif(rows.map((r,i)=>i>=2?{...r,segmentId:'new'}:r),'AAA').matches.length,0);
});
test('TER splits a peptide and missing coordinates do not become zero angles',()=>{
  const atomLines=pdb.split('\n').filter(l=>l.startsWith('ATOM'));
  const firstTwo=atomLines.filter(l=>Number(l.slice(22,26))<=2);
  const ter=firstTwo.findIndex(l=>Number(l.slice(22,26))===2);
  const split=[...firstTwo.slice(0,ter),'TER',...firstTwo.slice(ter)].join('\n');
  const rows=parsePdbBackbone(split,{sourceId:'split'});
  assert.equal(rows[0].psi,null);assert.equal(rows[1].phi,null);assert.notEqual(rows[0].segmentId,rows[1].segmentId);
  const missing=firstTwo.filter(l=>!(Number(l.slice(22,26))===1 && l.slice(12,16).trim()==='CA')).join('\n');
  assert.equal(parsePdbBackbone(missing)[0].psi,null);
});
test('insertion code and selected alternate-conformer identity survive parsing',()=>{
  const lines=pdb.split('\n').filter(l=>l.startsWith('ATOM') && Number(l.slice(22,26))===1 && ['N','CA','C'].includes(l.slice(12,16).trim()));
  const atom=(line,alt,occ,serial)=>line.slice(0,6)+String(serial).padStart(5)+line.slice(11,16)+alt+line.slice(17,26)+'A'+line.slice(27,54)+occ.toFixed(2).padStart(6)+line.slice(60);
  const alternate=lines.flatMap((l,i)=>[atom(l,'A',0.3,100+i),atom(l,'B',0.7,200+i)]).join('\n');
  const [row]=parsePdbBackbone(alternate,{sourceId:'alternate'});
  assert.equal(row.insertionCode,'A');assert.equal(row.altLoc,'B');
  assert.deepEqual(row.backboneAtomSerials,{N:200,CA:201,C:202});
  assert.ok(Object.values(row.backboneAtomAltLocs).every(x=>x==='B'));
});
test('blank coordinate fields are rejected rather than interpreted as zero',()=>{
  const line=pdb.split('\n').find(l=>l.startsWith('ATOM'));
  assert.throws(()=>parsePdbBackbone(line.slice(0,30)+'        '+line.slice(38)),/Invalid coordinate/);
});
test('a geometric peptide gap prevents fabricated torsions and motif continuity',()=>{
  const lines=pdb.split('\n').filter(l=>l.startsWith('ATOM') && Number(l.slice(22,26))<=2);
  const modified=lines.map(l=>Number(l.slice(22,26))===2&&l.slice(12,16).trim()==='N'?l.slice(0,30)+' 999.000'+l.slice(38):l).join('\n');
  const rows=parsePdbBackbone(modified);
  assert.equal(rows[0].psi,null);assert.equal(rows[1].phi,null);
  assert.equal(findMotif(rows,'TT').matches.length,0);
});
