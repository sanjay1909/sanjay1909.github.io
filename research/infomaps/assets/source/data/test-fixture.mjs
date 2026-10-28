import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { authoredNotes, generateFixture, rowsSha256 } from './generate-fixture.mjs';
import { tokenize, wordCount, searchDocuments, termCounts } from './text.mjs';

const fixture = JSON.parse(readFileSync(new URL('./corpus.json', import.meta.url), 'utf8'));
const { rows, metadata } = fixture;
const allIds = rows.map(row => row.id);
test('authored input generates the exact pinned corpus and actual-row hash', () => {
  assert.deepEqual(generateFixture(), fixture); assert.deepEqual(generateFixture(structuredClone(authoredNotes)), fixture);
  assert.equal(metadata.sourceSha256, rowsSha256(rows));
  const changed = structuredClone(rows); changed[0].title += ' draft';
  assert.notEqual(rowsSha256(changed), metadata.sourceSha256);
  assert.equal(fixture.schemaVersion, 1); assert.equal(metadata.synthetic, true); assert.equal(metadata.generatorVersion, '1.0.0');
});
test('24 stable document IDs cover each topic/year pair with independent word counts', () => {
  assert.equal(rows.length, 24); assert.equal(new Set(allIds).size, 24);
  assert.deepEqual(allIds, Array.from({length:24},(_,i)=>'doc-'+String(i+1).padStart(2,'0')));
  assert.deepEqual(metadata.topics, ['Mobility','Housing','Green space','Energy']);
  assert.deepEqual(metadata.keywords, ['bus','housing','park','water','bicycle','rent','trees','energy','station','flood','garden','solar']);
  assert.equal(metadata.tokenization, 'lowercase ASCII alphabetic tokens of length >=2; title and text; no stemming');
  for (const topic of metadata.topics) assert.deepEqual(rows.filter(row=>row.topic===topic).map(row=>row.year), [2020,2021,2022,2023,2024,2025]);
  for (const row of rows) {
    assert.deepEqual(Object.keys(row), ['id','title','topic','year','text','wordCount']);
    const independentlySplit = (row.title+' '+row.text).split(/[^A-Za-z]+/).filter(part=>part.length>=2);
    assert.equal(row.wordCount, independentlySplit.length); assert.equal(wordCount(row.title+' '+row.text), row.wordCount);
    const bodyWords = row.text.split(/[^A-Za-z]+/).filter(part=>part.length>=2).length;
    assert(bodyWords>=45 && bodyWords<=90);
  }
  assert.equal(new Set(rows.map(row=>row.year+'/'+row.wordCount)).size, 24);
});
test('tokenization retains stopwords and repetitions, ignores digits/short runs, and does not stem', () => {
  assert.deepEqual(tokenize('A BUS, housing! BUS 7 solar-panel'), ['bus','housing','bus','solar','panel']);
  assert.equal(wordCount('the bus and the park'), 5);
  assert.deepEqual(searchDocuments(rows,'BUS housing bus a').tokens, ['bus','housing']);
  assert.deepEqual(searchDocuments(rows,'bus housing').rowIds, ['doc-01','doc-02','doc-07','doc-08','doc-11','doc-19','doc-22']);
  assert.equal(searchDocuments(rows,'park').rowIds.length, 11);
  assert.deepEqual(searchDocuments(rows,'parks').rowIds, []);
  assert.deepEqual(searchDocuments(rows,'par').rowIds, []);
  assert.deepEqual(searchDocuments(rows,'   ').rowIds, allIds);
  assert.deepEqual(searchDocuments(rows,'a 1').rowIds, allIds);
  assert.deepEqual(searchDocuments(rows,'nonexistent solar').rowIds, []);
});
test('bus, solar and housing have fixed independently enumerated matches across all four topics', () => {
  const expected = {
    bus:['doc-01','doc-02','doc-03','doc-04','doc-05','doc-06','doc-07','doc-08','doc-11','doc-13','doc-16','doc-19','doc-22'],
    solar:['doc-05','doc-09','doc-10','doc-14','doc-16','doc-17','doc-19','doc-20','doc-21','doc-22','doc-23','doc-24'],
    housing:['doc-01','doc-02','doc-07','doc-08','doc-09','doc-10','doc-11','doc-12','doc-14','doc-15','doc-17','doc-19','doc-20','doc-22','doc-23','doc-24'],
  };
  for (const [term, ids] of Object.entries(expected)) {
    const independent = rows.filter(row=>new RegExp('(^|[^A-Za-z])'+term+'([^A-Za-z]|$)','i').test(row.title+' '+row.text)).map(row=>row.id);
    assert.deepEqual(independent,ids); assert.deepEqual(searchDocuments(rows,term).rowIds,ids);
    assert.equal(new Set(rows.filter(row=>ids.includes(row.id)).map(row=>row.topic)).size,4);
  }
});
test('term bars use document frequency, count repetitions/selected IDs once and independently match every keyword', () => {
  const repeated = tokenize(rows[0].title+' '+rows[0].text).filter(term=>term==='bus').length;
  assert(repeated>1);
  assert.deepEqual(termCounts(rows,['doc-01','doc-01'],['BUS']), [{term:'bus',selected:1,total:13}]);
  for (const item of termCounts(rows,searchDocuments(rows,'bus housing').rowIds,metadata.keywords)) {
    const re = new RegExp('(^|[^A-Za-z])'+item.term+'([^A-Za-z]|$)','i');
    const total = rows.filter(row=>re.test(row.title+' '+row.text));
    assert.equal(item.total,total.length); assert.equal(item.selected,total.filter(row=>searchDocuments(rows,'bus housing').rowIds.includes(row.id)).length);
  }
  assert.deepEqual(termCounts(rows,[],['bus','solar','housing']), [{term:'bus',selected:0,total:13},{term:'solar',selected:0,total:12},{term:'housing',selected:0,total:16}]);
});
test('text helpers do not mutate corpus rows or caller selections', () => {
  const before=structuredClone(rows),ids=['doc-01','doc-01'];
  searchDocuments(rows,'solar');termCounts(rows,ids,metadata.keywords);
  assert.deepEqual(rows,before);assert.deepEqual(ids,['doc-01','doc-01']);
});
