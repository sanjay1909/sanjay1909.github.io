import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createInfoMapsSession, sha256JSON, sha256Text, MAX_TRAIL_COMMITS, MAX_SESSION_BYTES, MAX_INTENT_BYTES } from '../../runtime/infomaps-session.mjs';

const fixture = JSON.parse(readFileSync(new URL('../../data/corpus.json', import.meta.url), 'utf8'));
const tokens = row => ((row.title + ' ' + row.text).toLowerCase().match(/[a-z]+/g) ?? []).filter(token => token.length >= 2);
const checks = [];
const runtime = await createInfoMapsSession(fixture);
let state = await runtime.state();
assert.equal(fixture.metadata.synthetic, true);
assert.equal(await sha256Text(JSON.stringify(fixture.rows)), fixture.metadata.sourceSha256);
assert.equal(state.totalRows, 24); assert.equal(state.hasSelection, false); assert.equal(state.selectedRows.length, 24);
for (const row of state.selectedRows) { assert.equal(row.wordCount, tokens(row).length); assert.equal(Object.hasOwn(row, 'x'), false); assert.equal(Object.hasOwn(row, 'y'), false); }
for (const topic of fixture.metadata.topics) assert.equal(fixture.rows.filter(row => row.topic === topic).length, 6);
assert.equal(state.history.length, 1); assert.equal(state.history[0].source, 'system');
assert.equal(state.history[0].intent, '[system] Initial full-document view');
checks.push('synthetic 24-document corpus is hash-bound; all source fields and declared lexical counts survive native state, without invented projection coordinates');

const chosen = fixture.rows.slice(1, 4).map(row => row.id);
state = await runtime.selectIds(chosen, { source: 'table', intent: 'Choose three documents' });
assert.deepEqual(state.selectedIds, chosen); assert.equal(state.history.at(-1).parentId, state.initialCommit);
assert.equal(state.history.at(-1).source, 'table'); assert.equal(state.hasSelection, true);
state = await runtime.selectIds([], { source: 'search', intent: 'Query with no matches' });
assert.equal(state.selectedIds.length, 0); assert.equal(state.hasSelection, true);
state = await runtime.clear(); assert.equal(state.selectedIds.length, 24); assert.equal(state.hasSelection, false);
assert.equal(state.history.at(-1).intent, '[controls] Show all documents');
checks.push('real shared document-ID selections preserve native causes; no search matches is distinct from clearing to the full corpus');

const bus = fixture.rows.filter(row => tokens(row).includes('bus')).map(row => row.id);
const mobility = fixture.rows.filter(row => row.topic === 'Mobility').map(row => row.id);
const park = fixture.rows.filter(row => tokens(row).includes('park')).map(row => row.id);
assert(bus.length > 0); assert(park.length > 0); assert.equal(mobility.length, 6);
state = await runtime.selectIds(bus, { source: 'search', intent: 'Search token bus' });
const searchCommit = state.cursor;
state = await runtime.selectIds([chosen[0]], { source: 'map', intent: 'Pick a document on the year and token-count map' });
const mainTip = state.cursor;
await runtime.seek(searchCommit);
state = await runtime.selectIds(mobility, { source: 'topic', intent: 'Alternative Mobility topic' });
const alternative = state.currentPath;
assert.equal(state.paths.length, 2);
const compare = await runtime.compare('main', alternative);
assert.equal(compare.a.rows, 1); assert.equal(compare.b.rows, 6); assert.equal(compare.ancestor, searchCommit);
assert.equal((await runtime.state()).cursor, state.cursor);
state = await runtime.newPath('term-notes');
state = await runtime.selectIds(park, { source: 'terms', intent: 'Choose documents containing park' });
assert.equal(state.currentPath, 'term-notes');
checks.push('search, topic, map and term origins branch through the actual native library; read-only comparison preserves both prior route tips');

const bundle = await runtime.exportSession();
assert.equal(bundle.format, 'infomaps-vizfootprint-session');
assert.deepEqual(bundle.config.viewIds, ['documents', 'map', 'terms', 'table']);
assert.equal(bundle.config.syntheticData, true); assert.equal(bundle.data.metadata.synthetic, true);
assert(bundle.log.every(record => record.viewId === 'documents' && record.field === 'id' && record.kind === 'match'));
const reopened = await runtime.replaySession(JSON.stringify(bundle));
const replayed = await reopened.state();
const withoutReplayMarker = history => history.map(entry => { const { replayed, ...cause } = entry.cause; return { ...entry, cause }; });
assert(replayed.history.every(entry => entry.cause.replayed === true));
assert.deepEqual(withoutReplayMarker(replayed.history), withoutReplayMarker(state.history));
assert.deepEqual(replayed.paths, state.paths); assert.deepEqual(replayed.selectedRows, state.selectedRows);
assert.equal(replayed.dataFingerprint, state.dataFingerprint);
const second = await reopened.replaySession(await reopened.exportSession());
state = await second.selectIds(bus, { source: 'search', intent: 'Continue after replay' });
assert.equal(state.history.at(-1).parentId, replayed.cursor); assert(!bundle.log.some(record => record.id === state.cursor));
checks.push('fresh native replay restores actual IDs, causes, rows and visible named paths; re-exported replay continues with new canonical IDs');

state = await runtime.seek(searchCommit);
assert.equal(state.currentPath, null); assert.equal(state.head, bundle.head);
const detached = await runtime.replaySession(await runtime.exportSession());
const detachedState = await detached.state();
assert.equal(detachedState.cursor, searchCommit); assert.equal(detachedState.head, bundle.head); assert.equal(detachedState.currentPath, null);
assert.deepEqual(detachedState.selectedIds, bus);
state = await detached.resetCursor(); assert.equal(state.cursor, state.initialCommit); assert.equal(state.selectedRows.length, 24); assert.equal(state.hasSelection, false);
await detached.switchPath('main'); assert.equal((await detached.state()).cursor, mainTip);
checks.push('detached cursor/head, reset to the genuine initial clear and switching paths restore the library fold rather than copied UI flags');

const rechecksum = async value => { const { checksum, ...payload } = value; return { ...payload, checksum: await sha256JSON(payload) }; };
const alter = change => { const value = structuredClone(bundle); change(value); return value; };
async function refused(value, pattern, rehash = true) {
  const before = await runtime.state();
  await assert.rejects(runtime.replaySession(rehash ? await rechecksum(value) : value), pattern);
  assert.deepEqual(await runtime.state(), before);
}
await refused(alter(value => { value.data.rows[0].text += ' Altered.'; }), /CHECKSUM_MISMATCH/, false);
await refused(alter(value => { value.data.rows[0].text += ' Altered.'; }), /DATASET_MISMATCH/);
await refused(alter(value => { value.data.metadata.synthetic = false; }), /DATASET_MISMATCH/);
await refused(alter(value => { value.config.syntheticData = false; }), /DATASET_MISMATCH/);
await refused(alter(value => { value.format = 'weave-your-numbers-vizfootprint-session'; }), /UNSUPPORTED_REPLAY_FORMAT/, false);
await refused(alter(value => { value.unrecognized = true; }), /UNSUPPORTED_REPLAY_FIELD/);
await refused(alter(value => { value.log[1].predicateSQL = 'TRUE; DROP TABLE documents'; }), /INVALID_TRAIL_PREDICATE/);
await refused(alter(value => { value.log[1].value.values = ['doc-unknown']; }), /INVALID_TRAIL_SELECTION/);
await refused(alter(value => { value.log[1].actorMeta.label = 'Forged source'; }), /INVALID_TRAIL_VIEW/);
await refused(alter(value => { value.log[1].parent = value.log.at(-1).id; }), /INVALID_TRAIL_PARENT/);
for (const [key, value] of [['revertOf', 's999999'], ['replacedBy', 's999999'], ['extra', true], ['replayed', false], ['replayed', 'true'], ['replayed', null], ['computedBy', 'agent']]) {
  await refused(alter(copy => { copy.log[1].cause[key] = value; }), /INVALID_TRAIL_CAUSE/);
}
checks.push('checksum, full corpus/config identity, SQL descriptors, document IDs, native view identity, parents and closed provenance refuse tampering atomically');

for (const invalid of ['s9007199254740992', 's9007199254740991', 's0', 's01', 's250']) {
  await refused(alter(copy => {
    const from = copy.log[0].id;
    for (const entry of copy.log) { if (entry.id === from) entry.id = invalid; if (entry.parent === from) entry.parent = invalid; }
    for (const path of copy.paths) if (path.tip === from) path.tip = invalid;
    for (const field of ['initialCommit', 'cursor', 'head']) if (copy[field] === from) copy[field] = invalid;
  }), /INVALID_TRAIL_ID/);
  const before = await runtime.state();
  const after = await runtime.selectIds(chosen, { source: 'table', intent: 'Continue after refused import' });
  assert.equal(after.history.at(-1).parentId, before.cursor); assert.equal(new Set(after.history.map(entry => entry.id)).size, after.history.length);
}
await assert.rejects(runtime.replaySession(' '.repeat(MAX_SESSION_BYTES + 1)), /INVALID_SESSION_SIZE/);
await refused(alter(value => { value.data.rows[0].wordCount = NaN; }), /INVALID_JSON_VALUE/, false);
await refused(alter(value => { value.hidden = undefined; }), /INVALID_JSON_VALUE/, false);
checks.push('unsafe and noncanonical IDs are refused before native replay; the original session continues while oversized and non-JSON values fail safely');

for (const intent of ['界'.repeat(600), '"'.repeat(600), '\\'.repeat(600), '\n'.repeat(600), '\u0000'.repeat(600)]) {
  const before = await runtime.state();
  await assert.rejects(runtime.selectIds(chosen, { source: 'map', intent }), /INVALID_INTENT/);
  assert.deepEqual(await runtime.state(), before);
  await refused(alter(copy => { copy.log[1].cause.intent = '[map] ' + intent; }), /INVALID_TRAIL_CAUSE/);
}
const afterRefusalParent = (await runtime.state()).cursor;
state = await runtime.selectIds(chosen, { source: 'map', intent: 'Continue after refused intent' });
assert.equal(state.history.at(-1).parentId, afterRefusalParent);
const unicodeBoundary = '界'.repeat(200);
assert.equal(new TextEncoder().encode(unicodeBoundary).length, MAX_INTENT_BYTES);
const unicode = await createInfoMapsSession(fixture);
state = await unicode.selectIds(chosen, { source: 'map', intent: unicodeBoundary });
assert.equal(state.history.at(-1).intent, '[map] ' + unicodeBoundary);
const unicodeReplay = await unicode.replaySession(await unicode.exportSession());
assert.equal((await unicodeReplay.state()).history.at(-1).intent, '[map] ' + unicodeBoundary);
checks.push('creation and recomputed-checksum imports share the raw/JSON-encoded intent byte budget; exact 600-byte Unicode survives native replay');

async function invalidFixture(change, pattern) { const value = structuredClone(fixture); change(value); await assert.rejects(createInfoMapsSession(value), pattern); }
await invalidFixture(value => { value.schemaVersion = 2; }, /INVALID_DATASET_VERSION/);
await invalidFixture(value => { value.rows.pop(); }, /INVALID_DATASET/);
await invalidFixture(value => { value.metadata.synthetic = false; }, /INVALID_SOURCE_METADATA/);
await invalidFixture(value => { value.metadata.tokenization = 'stemming and embeddings'; }, /INVALID_CORPUS_LEXICON/);
await invalidFixture(value => { value.metadata.keywords.push('unknown'); }, /INVALID_CORPUS_LEXICON/);
await invalidFixture(value => { value.rows[0].x = 0.5; }, /INVALID_DOCUMENT_FIELDS/);
await invalidFixture(value => { value.rows[0].id = 'arbitrary'; }, /INVALID_DOCUMENT_ID/);
await invalidFixture(value => { value.rows[0].topic = 'Unknown'; }, /INVALID_DOCUMENT_TOPIC/);
await invalidFixture(value => { value.rows[0].year = 2026; }, /INVALID_DOCUMENT_YEAR/);
await invalidFixture(value => { value.rows[0].title = 'x'.repeat(161); }, /INVALID_DOCUMENT_TEXT/);
await invalidFixture(value => { value.rows[0].wordCount++; }, /INVALID_DOCUMENT_WORD_COUNT/);
await invalidFixture(value => { const first = value.rows[0], other = value.rows.find(row => row.topic === first.topic && row.year !== first.year); other.year = first.year; }, /INVALID_DOCUMENT_TOPIC_YEAR/);
await invalidFixture(value => { value.rows[0].text = value.rows[0].text.replace(/[a-z]/i, letter => letter === 'z' ? 'y' : 'z'); }, /SOURCE_METADATA_HASH_MISMATCH/);
await invalidFixture(value => { value.rows[0].wordCount = NaN; }, /INVALID_JSON_VALUE/);
checks.push('constructor validation binds exact corpus size/schema, synthetic metadata/lexicon, stable IDs, topic/year grid, text bounds, recomputed lexical counts and the actual row hash');

const fresh = await createInfoMapsSession(fixture);
await Promise.all([fresh.selectIds([chosen[0]], { source: 'table', intent: 'First queued selection' }), fresh.selectIds([chosen[1]], { source: 'map', intent: 'Second queued selection' })]);
state = await fresh.state(); assert.deepEqual(state.selectedIds, [chosen[1]]); assert.equal(state.history.at(-1).parentId, state.history.at(-2).id);
const beforeUnknown = await fresh.state(); await assert.rejects(fresh.selectIds(['unknown']), /UNKNOWN_DOCUMENT_ID/); assert.deepEqual(await fresh.state(), beforeUnknown);
assert.equal(fresh._replayValidated, undefined);
checks.push('mutations serialize, unknown document IDs fail atomically, and no unvalidated restore entry is exposed');

const bounded = await createInfoMapsSession(fixture);
const allIds = fixture.rows.map(row => row.id);
const mixedBoundary = '界'.repeat(100) + '"'.repeat(80) + '\\'.repeat(40) + '\u0000'.repeat(10);
assert.equal(new TextEncoder().encode(JSON.stringify(mixedBoundary).slice(1, -1)).length, MAX_INTENT_BYTES);
for (let index = 1; index < MAX_TRAIL_COMMITS; index++) await bounded.selectIds(allIds, { source: 'controls', intent: mixedBoundary });
for (let index = 1; index < MAX_TRAIL_COMMITS; index++) await bounded.newPath('p' + String(index).padStart(3, '0') + 'x'.repeat(56));
const boundedExport = await bounded.exportSession();
const boundedBytes = new TextEncoder().encode(JSON.stringify(boundedExport)).length;
assert(boundedBytes <= MAX_SESSION_BYTES); assert.equal(boundedExport.paths.length, MAX_TRAIL_COMMITS); assert(boundedExport.paths.slice(1).every(path => path.name.length === 60));
const limitState = await bounded.state(); assert.equal(limitState.cursor, 's250'); assert.equal(limitState.history.length, 250);
await assert.rejects(bounded.clear(), /TRAIL_LIMIT/); assert.deepEqual(await bounded.state(), limitState);
const atLimit = await bounded.replaySession(boundedExport); assert.equal((await atLimit.state()).cursor, 's250');
const replayedBoundary = await atLimit.exportSession(); assert(replayedBoundary.log.every(entry => entry.cause.replayed === true));
const boundedReplayedBytes = new TextEncoder().encode(JSON.stringify(replayedBoundary)).length; assert(boundedReplayedBytes <= MAX_SESSION_BYTES);
const atLimitAgain = await atLimit.replaySession(JSON.stringify(replayedBoundary));
const boundedReExportBytes = new TextEncoder().encode(JSON.stringify(await atLimitAgain.exportSession())).length; assert(boundedReExportBytes <= MAX_SESSION_BYTES);
const finalLimitState = await atLimitAgain.state(); assert.equal(finalLimitState.cursor, 's250');
await assert.rejects(atLimitAgain.clear(), /TRAIL_LIMIT/); assert.deepEqual(await atLimitAgain.state(), finalLimitState);
checks.push('250 full-corpus commits with maximum escaped/Unicode intent bodies, 250 named paths and native replay markers remain reopenable below 1 MB');

const report = { passed: true, checks, dataset: 'synthetic document corpus', synthetic: fixture.metadata.synthetic, sourceSha256: fixture.metadata.sourceSha256, fingerprint: replayed.dataFingerprint, libraryCommit: bundle.config.vizfootprint.sourceCommit, footprintjs: bundle.config.footprintjs, foottrace: bundle.config.foottrace, nativeCommits: replayed.history.length, nativePaths: replayed.paths.length, selectedAfterReplay: replayed.selectedRows.length, maxIntentBytes: MAX_INTENT_BYTES, boundedIntentOrigin: 'controls', boundedPathCount: boundedExport.paths.length, boundedExportBytes: boundedBytes, boundedReplayedExportBytes: boundedReplayedBytes, boundedReExportBytes };
console.log(JSON.stringify(report, null, 2));
if (process.env.RUNTIME_TEST_OUTPUT) writeFileSync(process.env.RUNTIME_TEST_OUTPUT, JSON.stringify(report, null, 2) + '\n');
