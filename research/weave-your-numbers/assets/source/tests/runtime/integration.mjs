import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createDiarySession, sha256JSON, sha256Text, MAX_TRAIL_COMMITS, MAX_SESSION_BYTES, MAX_INTENT_BYTES } from '../../runtime/diary-session.mjs';

const fixture = JSON.parse(readFileSync(new URL('../../data/synthetic-diary.json', import.meta.url), 'utf8'));
const checks = [];
const runtime = await createDiarySession(fixture);
let state = await runtime.state();
assert.equal(fixture.metadata.synthetic, true);
assert.equal(await sha256Text(JSON.stringify(fixture.rows)), fixture.metadata.sourceSha256);
assert.equal(state.totalRows, 56); assert.equal(state.hasSelection, false); assert.equal(state.selectedRows.length, 56);
assert.equal(state.selectedRows.filter(row => row.steps !== null).length, 54);
assert.equal(state.selectedRows.filter(row => row.sleepHours !== null && row.mood !== null).length, 52);
assert.equal(state.history.length, 1); assert.equal(state.history[0].source, 'system');
assert.equal(state.history[0].intent, '[system] Initial full-diary view');
checks.push('synthetic 56-day fixture is hash-bound; all rows survive selection, with 54 defined step counts and 52 complete sleep–mood pairs');

const chosen = fixture.rows.slice(1, 4).map(row => row.id);
state = await runtime.selectIds(chosen, { source: 'table', intent: 'Choose three recorded days' });
assert.deepEqual(state.selectedIds, chosen); assert.equal(state.history.at(-1).parentId, state.initialCommit);
assert.equal(state.history.at(-1).source, 'table'); assert.equal(state.hasSelection, true);
state = await runtime.selectIds([], { source: 'range', intent: 'Empty date interval' });
assert.equal(state.selectedIds.length, 0); assert.equal(state.hasSelection, true);
state = await runtime.clear(); assert.equal(state.selectedIds.length, 56); assert.equal(state.hasSelection, false);
assert.equal(state.history.at(-1).intent, '[controls] Show all recorded days');
checks.push('real shared day-ID selections preserve native causes; empty selection is distinct from clearing to every recorded day');

const firstWeek = fixture.rows.slice(0, 7).map(row => row.id);
const travel = fixture.rows.filter(row => row.context === 'Travel').map(row => row.id);
assert(travel.length > 0);
state = await runtime.selectIds(firstWeek, { source: 'range', intent: 'First week interval' });
const rangeCommit = state.cursor;
state = await runtime.selectIds([chosen[0]], { source: 'timeline', intent: 'Pick a day on the steps timeline' });
const mainTip = state.cursor;
await runtime.seek(rangeCommit);
state = await runtime.selectIds(travel, { source: 'context', intent: 'Alternative travel days' });
const alternative = state.currentPath;
assert.equal(state.paths.length, 2);
const compare = await runtime.compare('main', alternative);
assert.equal(compare.a.rows, 1); assert.equal(compare.b.rows, travel.length); assert.equal(compare.ancestor, rangeCommit);
assert.equal((await runtime.state()).cursor, state.cursor);
state = await runtime.newPath('sleep-mood-notes');
state = await runtime.selectIds(chosen, { source: 'scatter', intent: 'Brush sleep and mood' });
assert.equal(state.currentPath, 'sleep-mood-notes');
checks.push('date, context, timeline and scatter origins branch through the native library; path comparison is read-only and preserves old route tips');

const bundle = await runtime.exportSession();
assert.equal(bundle.format, 'weave-your-numbers-vizfootprint-session');
assert.deepEqual(bundle.config.viewIds, ['days', 'timeline', 'scatter', 'table']);
assert.equal(bundle.config.syntheticData, true); assert.equal(bundle.data.metadata.synthetic, true);
assert(bundle.log.every(record => record.viewId === 'days' && record.field === 'id' && record.kind === 'match'));
const reopened = await runtime.replaySession(JSON.stringify(bundle));
const replayed = await reopened.state();
const withoutReplayMarker = history => history.map(entry => { const { replayed, ...cause } = entry.cause; return { ...entry, cause }; });
assert(replayed.history.every(entry => entry.cause.replayed === true));
assert.deepEqual(withoutReplayMarker(replayed.history), withoutReplayMarker(state.history));
assert.deepEqual(replayed.paths, state.paths); assert.deepEqual(replayed.selectedRows, state.selectedRows);
assert.equal(replayed.dataFingerprint, state.dataFingerprint);
const second = await reopened.replaySession(await reopened.exportSession());
state = await second.selectIds(firstWeek, { source: 'range', intent: 'Continue after replay' });
assert.equal(state.history.at(-1).parentId, replayed.cursor); assert(!bundle.log.some(record => record.id === state.cursor));
checks.push('genuine fresh-session replay restores native IDs, causes, selection and visible named paths; repeated replay can continue with fresh IDs');

state = await runtime.seek(rangeCommit);
assert.equal(state.currentPath, null); assert.equal(state.head, bundle.head);
const detached = await runtime.replaySession(await runtime.exportSession());
const detachedState = await detached.state();
assert.equal(detachedState.cursor, rangeCommit); assert.equal(detachedState.head, bundle.head); assert.equal(detachedState.currentPath, null);
assert.deepEqual(detachedState.selectedIds, firstWeek);
state = await detached.resetCursor(); assert.equal(state.cursor, state.initialCommit); assert.equal(state.selectedRows.length, 56); assert.equal(state.hasSelection, false);
await detached.switchPath('main'); assert.equal((await detached.state()).cursor, mainTip);
checks.push('detached cursor/head, reset to the real initial clear commit and switching paths restore actual folded library state');

const rechecksum = async value => { const { checksum, ...payload } = value; return { ...payload, checksum: await sha256JSON(payload) }; };
const alter = change => { const value = structuredClone(bundle); change(value); return value; };
async function refused(value, pattern, rehash = true) {
  const before = await runtime.state();
  await assert.rejects(runtime.replaySession(rehash ? await rechecksum(value) : value), pattern);
  assert.deepEqual(await runtime.state(), before);
}
await refused(alter(value => { value.data.rows[0].steps++; }), /CHECKSUM_MISMATCH/, false);
await refused(alter(value => { value.data.rows[0].steps++; }), /DATASET_MISMATCH/);
await refused(alter(value => { value.data.metadata.synthetic = false; }), /DATASET_MISMATCH/);
await refused(alter(value => { value.config.syntheticData = false; }), /DATASET_MISMATCH/);
await refused(alter(value => { value.format = 'ramachandran-vizfootprint-session'; }), /UNSUPPORTED_REPLAY_FORMAT/, false);
await refused(alter(value => { value.unrecognized = true; }), /UNSUPPORTED_REPLAY_FIELD/);
await refused(alter(value => { value.log[1].predicateSQL = 'TRUE; DROP TABLE days'; }), /INVALID_TRAIL_PREDICATE/);
await refused(alter(value => { value.log[1].value.values = ['demo-unknown']; }), /INVALID_TRAIL_SELECTION/);
await refused(alter(value => { value.log[1].actorMeta.label = 'Forged source'; }), /INVALID_TRAIL_VIEW/);
await refused(alter(value => { value.log[1].parent = value.log.at(-1).id; }), /INVALID_TRAIL_PARENT/);
for (const [key, value] of [['revertOf', 's999999'], ['replacedBy', 's999999'], ['extra', true], ['replayed', false], ['replayed', 'true'], ['replayed', null], ['computedBy', 'agent']]) {
  await refused(alter(copy => { copy.log[1].cause[key] = value; }), /INVALID_TRAIL_CAUSE/);
}
checks.push('checksum, full fixture/config identity, SQL descriptors, known day IDs, native view identity, parents and closed provenance reject tampering without changing the current session');

for (const invalid of ['s9007199254740992', 's9007199254740991', 's0', 's01', 's250']) {
  const value = alter(copy => {
    const from = copy.log[0].id;
    for (const entry of copy.log) { if (entry.id === from) entry.id = invalid; if (entry.parent === from) entry.parent = invalid; }
    for (const path of copy.paths) if (path.tip === from) path.tip = invalid;
    for (const field of ['initialCommit', 'cursor', 'head']) if (copy[field] === from) copy[field] = invalid;
  });
  await refused(value, /INVALID_TRAIL_ID/);
  const before = await runtime.state();
  const after = await runtime.selectIds(chosen, { source: 'table', intent: 'Continue after refused import' });
  assert.equal(after.history.at(-1).parentId, before.cursor); assert.equal(new Set(after.history.map(entry => entry.id)).size, after.history.length);
}
await assert.rejects(runtime.replaySession(' '.repeat(MAX_SESSION_BYTES + 1)), /INVALID_SESSION_SIZE/);
await refused(alter(value => { value.data.rows[0].steps = NaN; }), /INVALID_JSON_VALUE/, false);
await refused(alter(value => { value.hidden = undefined; }), /INVALID_JSON_VALUE/, false);
checks.push('unsafe and noncanonical IDs are refused before native replay; the old session remains usable, while oversized and non-JSON inputs are rejected');

for (const intent of ['界'.repeat(600), '"'.repeat(600), '\\'.repeat(600), '\n'.repeat(600), '\u0000'.repeat(600)]) {
  const before = await runtime.state();
  await assert.rejects(runtime.selectIds(chosen, { source: 'table', intent }), /INVALID_INTENT/);
  assert.deepEqual(await runtime.state(), before);
  await refused(alter(copy => { copy.log[1].cause.intent = '[table] ' + intent; }), /INVALID_TRAIL_CAUSE/);
}
const afterRefusalParent = (await runtime.state()).cursor;
state = await runtime.selectIds(chosen, { source: 'timeline', intent: 'Continue after refused intent' });
assert.equal(state.history.at(-1).parentId, afterRefusalParent);
const unicodeBoundary = '界'.repeat(200);
assert.equal(new TextEncoder().encode(unicodeBoundary).length, MAX_INTENT_BYTES);
const unicode = await createDiarySession(fixture);
state = await unicode.selectIds(chosen, { source: 'table', intent: unicodeBoundary });
assert.equal(state.history.at(-1).intent, '[table] ' + unicodeBoundary);
const unicodeReplay = await unicode.replaySession(await unicode.exportSession());
assert.equal((await unicodeReplay.state()).history.at(-1).intent, '[table] ' + unicodeBoundary);
checks.push('creation and recomputed-checksum imports share the 600-byte raw/JSON-encoded intent-body budget; oversized CJK/escapes fail atomically and exact 600-byte Unicode replays');

async function invalidFixture(change, pattern) { const value = structuredClone(fixture); change(value); await assert.rejects(createDiarySession(value), pattern); }
await invalidFixture(value => { value.schemaVersion = 2; }, /INVALID_DATASET_VERSION/);
await invalidFixture(value => { value.metadata.synthetic = false; }, /INVALID_SOURCE_METADATA/);
await invalidFixture(value => { value.metadata.units.mood = 'clinical score'; }, /INVALID_DIARY_UNITS/);
await invalidFixture(value => { value.metadata.dateEnd = '2026-03-02'; }, /INVALID_DIARY_DATE_RANGE/);
await invalidFixture(value => { value.rows[0].extra = true; }, /INVALID_DAY_FIELDS/);
await invalidFixture(value => { value.rows[0].id = 'arbitrary'; }, /INVALID_DAY_ID/);
await invalidFixture(value => { value.rows[0].dayIndex = 1; }, /INVALID_DAY_ID/);
await invalidFixture(value => { value.rows[0].date = '2026-02-30'; }, /INVALID_DIARY_DATE/);
await invalidFixture(value => { value.rows[0].steps = -1; }, /INVALID_STEPS/);
await invalidFixture(value => { value.rows[0].sleepHours = 7.25; }, /INVALID_SLEEP_HOURS/);
await invalidFixture(value => { value.rows[0].mood = 2.5; }, /INVALID_MOOD/);
await invalidFixture(value => { value.rows[0].context = 'Clinical'; }, /INVALID_CONTEXT/);
await invalidFixture(value => { value.rows[0].steps++; }, /SOURCE_METADATA_HASH_MISMATCH/);
await invalidFixture(value => { value.rows[0].steps = NaN; }, /INVALID_JSON_VALUE/);
checks.push('constructor validation binds schema, synthetic metadata, units, dates, ID/index coherence, closed fields, metric bounds and the actual row hash before creating a session');

const fresh = await createDiarySession(fixture);
await Promise.all([fresh.selectIds([chosen[0]], { source: 'table', intent: 'First queued selection' }), fresh.selectIds([chosen[1]], { source: 'timeline', intent: 'Second queued selection' })]);
state = await fresh.state(); assert.deepEqual(state.selectedIds, [chosen[1]]); assert.equal(state.history.at(-1).parentId, state.history.at(-2).id);
const beforeUnknown = await fresh.state(); await assert.rejects(fresh.selectIds(['unknown']), /UNKNOWN_DAY_ID/); assert.deepEqual(await fresh.state(), beforeUnknown);
assert.equal(fresh._replayValidated, undefined);
checks.push('mutations serialize, unknown IDs fail atomically, and no unvalidated restore entry is exposed');

const bounded = await createDiarySession(fixture);
const allIds = fixture.rows.map(row => row.id);
const mixedBoundary = '界'.repeat(100) + '"'.repeat(80) + '\\'.repeat(40) + '\u0000'.repeat(10);
assert.equal(new TextEncoder().encode(JSON.stringify(mixedBoundary).slice(1, -1)).length, MAX_INTENT_BYTES);
for (let index = 1; index < MAX_TRAIL_COMMITS; index++) await bounded.selectIds(allIds, { source: 'timeline', intent: mixedBoundary });
for (let index = 1; index < MAX_TRAIL_COMMITS; index++) await bounded.newPath('p' + String(index).padStart(3, '0') + 'x'.repeat(56));
const boundedExport = await bounded.exportSession();
const boundedBytes = new TextEncoder().encode(JSON.stringify(boundedExport)).length;
assert(boundedBytes <= MAX_SESSION_BYTES);
assert.equal(boundedExport.paths.length, MAX_TRAIL_COMMITS); assert(boundedExport.paths.slice(1).every(path => path.name.length === 60));
const limitState = await bounded.state(); assert.equal(limitState.cursor, 's250'); assert.equal(limitState.history.length, 250);
await assert.rejects(bounded.clear(), /TRAIL_LIMIT/); assert.deepEqual(await bounded.state(), limitState);
const atLimit = await bounded.replaySession(boundedExport); assert.equal((await atLimit.state()).cursor, 's250');
const replayedBoundary = await atLimit.exportSession();
assert(replayedBoundary.log.every(entry => entry.cause.replayed === true));
const boundedReplayedBytes = new TextEncoder().encode(JSON.stringify(replayedBoundary)).length;
assert(boundedReplayedBytes <= MAX_SESSION_BYTES);
const atLimitAgain = await atLimit.replaySession(JSON.stringify(replayedBoundary));
const boundedReExportBytes = new TextEncoder().encode(JSON.stringify(await atLimitAgain.exportSession())).length;
assert(boundedReExportBytes <= MAX_SESSION_BYTES);
const finalLimitState = await atLimitAgain.state(); assert.equal(finalLimitState.cursor, 's250');
await assert.rejects(atLimitAgain.clear(), /TRAIL_LIMIT/); assert.deepEqual(await atLimitAgain.state(), finalLimitState);
checks.push('250 full-ID commits with mixed escaped/Unicode 600-byte bodies, 250 paths with maximum-length ASCII names and replay markers stay below 1 MB through fresh replay and re-export');

const report = { passed: true, checks, dataset: 'synthetic diary', synthetic: fixture.metadata.synthetic, sourceSha256: fixture.metadata.sourceSha256, fingerprint: replayed.dataFingerprint, libraryCommit: bundle.config.vizfootprint.sourceCommit, footprintjs: bundle.config.footprintjs, foottrace: bundle.config.foottrace, nativeCommits: replayed.history.length, nativePaths: replayed.paths.length, selectedAfterReplay: replayed.selectedRows.length, maxIntentBytes: MAX_INTENT_BYTES, boundedIntentOrigin: 'timeline', boundedPathCount: boundedExport.paths.length, boundedExportBytes: boundedBytes, boundedReplayedExportBytes: boundedReplayedBytes, boundedReExportBytes };
console.log(JSON.stringify(report, null, 2));
if (process.env.RUNTIME_TEST_OUTPUT) writeFileSync(process.env.RUNTIME_TEST_OUTPUT, JSON.stringify(report, null, 2) + '\n');
