import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRamachandranSession, sha256JSON, MAX_TRAIL_COMMITS } from '../../runtime/ramachandran-session.mjs';
import { findMotif } from '../../science/motif.mjs';

const fixture = JSON.parse(readFileSync(new URL('../../science/data/1crn-residues.json', import.meta.url), 'utf8'));
const runtime = await createRamachandranSession(fixture);
const checks = [];
let state = await runtime.state();
assert.equal(state.totalRows, 46); assert.equal(state.selectedIds.length, 46); assert.equal(state.hasSelection, false);
assert.equal(state.selectedRows.filter(row => row.phi !== null && row.psi !== null).length, 44);
assert.equal(state.history.length, 1); assert.equal(state.history[0].source, 'system');
checks.push('real library baseline, all46residues,44plottable, first native system commit');

const chosen = fixture.rows.slice(1, 4).map(row => row.id);
state = await runtime.selectIds(chosen, { source: 'table', intent: 'Choose three residues' });
assert.deepEqual(state.selectedIds, chosen); assert.equal(state.hasSelection, true);
assert.equal(state.history.at(-1).source, 'table'); assert.equal(state.history.at(-1).parent, state.initialCommit);
checks.push('shared native residue-ID match selection and actual cause/parent provenance');

state = await runtime.selectIds([], { source: 'motif', intent: 'No motif match' });
assert.equal(state.hasSelection, true); assert.equal(state.selectedIds.length, 0);
state = await runtime.clear(); assert.equal(state.hasSelection, false); assert.equal(state.selectedIds.length, 46);
checks.push('empty selection is distinct from clearing to all rows');

const motif = findMotif(fixture.rows, 'PG');
assert.equal(motif.matches.length, 3);
state = await runtime.selectIds(motif.rowIds, { source: 'motif', intent: 'Find sequence motif PG' });
assert.equal(state.selectedIds.length, 6); assert.equal(state.history.at(-1).source, 'motif');
const motifCommit = state.cursor;
state = await runtime.selectIds([chosen[0]], { source: 'scatter', intent: 'Brush one residue' });
const mainTip = state.cursor;
await runtime.seek(motifCommit);
state = await runtime.selectIds(chosen, { source: 'histogram', intent: 'Alternative amino-acid subset' });
assert.equal(state.paths.length, 2);
const alternative = state.currentPath;
const cmp = await runtime.compare('main', alternative);
assert.equal(cmp.a.rows, 1); assert.equal(cmp.b.rows, 3); assert.equal(cmp.ancestor, motifCommit);
checks.push('motif selection, seeking, branching and native path comparison preserve the old route');

state = await runtime.newPath('curated-path');
state = await runtime.selectIds(motif.rowIds, { source: 'motif', intent: 'Repeat PG on named path' });
const export1 = await runtime.exportSession();
const restored = await runtime.replaySession(JSON.stringify(export1));
const replayed = await restored.state();
assert.deepEqual(replayed.selectedIds, state.selectedIds);
const withoutReplayMarker = history => history.map(record => {
  const { replayed: marker, ...cause } = record.cause;
  return { ...record, cause };
});
assert(replayed.history.every(record => record.cause.replayed === true));
assert.deepEqual(withoutReplayMarker(replayed.history), withoutReplayMarker(state.history));
assert.deepEqual(replayed.paths, state.paths);
assert.equal(replayed.currentPath, 'curated-path');
assert.equal(replayed.dataFingerprint, state.dataFingerprint);
checks.push('real fresh-session replay preserves native commits, IDs, named paths, current selection and exact fixture');

state = await runtime.seek(motifCommit);
assert.equal(state.currentPath, null);
const detachedExport = await runtime.exportSession();
const detachedReplay = await runtime.replaySession(detachedExport);
const detachedState = await detachedReplay.state();
assert.equal(detachedState.cursor, motifCommit); assert.equal(detachedState.currentPath, null);
assert.equal(detachedState.head, state.head); assert.deepEqual(detachedState.selectedIds, motif.rowIds);
state = await detachedReplay.resetCursor(); assert.equal(state.cursor, state.initialCommit); assert.equal(state.hasSelection, false); assert.equal(state.selectedIds.length, 46);
checks.push('detached cursor/head and replay-to-start use genuine native state, not copied UI flags');

const edited = structuredClone(export1); edited.data.rows[0].psi = 0;
await assert.rejects(runtime.replaySession(edited), /CHECKSUM_MISMATCH/);
const { checksum: dropped, ...editedPayload } = edited;
edited.checksum = await sha256JSON(editedPayload);
await assert.rejects(runtime.replaySession(edited), /DATASET_MISMATCH/);
const unsupported = structuredClone(export1); unsupported.log[1].kind = 'point';
const { checksum: dropped2, ...unsupportedPayload } = unsupported;
unsupported.checksum = await sha256JSON(unsupportedPayload);
await assert.rejects(runtime.replaySession(unsupported), /UNSUPPORTED_TRAIL_RECORD/);
await assert.rejects(runtime.replaySession({ format: 'other', schemaVersion: 1 }), /UNSUPPORTED_REPLAY_FORMAT/);
checks.push('tampered bytes, a rechecksummed different dataset, unsupported actions and unknown replay format are refused');

const before = await runtime.state();
await assert.rejects(runtime.selectIds(['not-a-residue']), /UNKNOWN_RESIDUE_ID/);
assert.equal((await runtime.state()).history.length, before.history.length);
assert.equal(runtime._replayValidated, undefined);
const fresh = await createRamachandranSession(fixture);
await Promise.all([fresh.selectIds([chosen[0]], { source: 'table', intent: 'First queued selection' }), fresh.selectIds([chosen[1]], { source: 'table', intent: 'Second queued selection' })]);
const serial = await fresh.state();
assert.deepEqual(serial.selectedIds, [chosen[1]]); assert.equal(serial.history.at(-1).parent, serial.history.at(-2).id);
checks.push('invalid selections are atomic; mutations serialize and no unvalidated restore entry is exposed');

const rechecksum = async bundle => {
  const { checksum, ...payload } = bundle;
  return { ...payload, checksum: await sha256JSON(payload) };
};
const badParent = structuredClone(export1); badParent.log[1].parent = null;
await assert.rejects(runtime.replaySession(await rechecksum(badParent)), /INVALID_TRAIL_PARENT/);
const badCause = structuredClone(export1); badCause.log[1].cause.computedBy = 'agent';
await assert.rejects(runtime.replaySession(await rechecksum(badCause)), /INVALID_TRAIL_CAUSE/);
const missingOrigin = structuredClone(export1); missingOrigin.log[1].cause.intent = 'No originating view';
await assert.rejects(runtime.replaySession(await rechecksum(missingOrigin)), /INVALID_TRAIL_CAUSE/);
const duplicatePath = structuredClone(export1); duplicatePath.paths.push(duplicatePath.paths[0]);
await assert.rejects(runtime.replaySession(await rechecksum(duplicatePath)), /INVALID_REPLAY_PATHS/);
const secondExport = await restored.exportSession();
const restoredTwice = await restored.replaySession(secondExport);
assert.deepEqual((await restoredTwice.state()).selectedIds, replayed.selectedIds);
state = await restoredTwice.selectIds([chosen[0]], { source: 'table', intent: 'Continue after replay' });
assert.equal(state.history.at(-1).parentId, replayed.cursor);
assert(!export1.log.some(record => record.id === state.cursor));
checks.push('malformed parent graphs, impossible app causes and duplicate path names are refused; replay can be exported, replayed and continued with fresh native IDs');

const renameCommit = (bundle, from, to) => {
  const altered = structuredClone(bundle);
  for (const record of altered.log) {
    if (record.id === from) record.id = to;
    if (record.parent === from) record.parent = to;
  }
  for (const path of altered.paths) if (path.tip === from) path.tip = to;
  for (const field of ['initialCommit', 'cursor', 'head']) if (altered[field] === from) altered[field] = to;
  return altered;
};
const rejectedImportCanContinue = async (bundle, expectedError) => {
  const beforeReject = await runtime.state();
  await assert.rejects(runtime.replaySession(await rechecksum(bundle)), expectedError);
  assert.deepEqual(await runtime.state(), beforeReject);
  const continued = await runtime.selectIds([chosen[0]], { source: 'table', intent: 'Continue after rejected import' });
  assert.equal(continued.history.at(-1).parentId, beforeReject.cursor);
  assert.equal(new Set(continued.history.map(record => record.id)).size, continued.history.length);
};
for (const invalidId of ['s9007199254740992', 's9007199254740991', 's0', 's01', 's250']) {
  await rejectedImportCanContinue(renameCommit(export1, export1.initialCommit, invalidId), /INVALID_TRAIL_ID/);
}
checks.push('unsafe, noncanonical and inflated imported commit IDs are rejected before native replay; the existing session stays unchanged and continues without duplicate IDs');

for (const [field, value] of [['revertOf', 's999999'], ['replacedBy', 's999999'], ['inventedProvenance', true], ['replayed', false], ['replayed', 'true'], ['replayed', null]]) {
  const altered = structuredClone(export1);
  altered.log[1].cause[field] = value;
  await rejectedImportCanContinue(altered, /INVALID_TRAIL_CAUSE/);
}
checks.push('cause shape permits only the app actor slots, intent and optional replayed:true; unsupported provenance and invalid replay markers are rejected atomically');

const bounded = await createRamachandranSession(fixture);
for (let index = 1; index < MAX_TRAIL_COMMITS; index++) {
  state = await bounded.selectIds([chosen[index % chosen.length]], { source: 'table', intent: `Bounded step ${index}` });
}
assert.equal(state.history.length, MAX_TRAIL_COMMITS);
assert.equal(state.cursor, `s${MAX_TRAIL_COMMITS}`);
await assert.rejects(bounded.selectIds(chosen), /TRAIL_LIMIT/);
const boundedReplay = await bounded.replaySession(await bounded.exportSession());
assert.equal((await boundedReplay.state()).cursor, `s${MAX_TRAIL_COMMITS}`);
checks.push('every app-produced ID through the 250-commit boundary remains canonical and replayable; further commits are refused');

const result = { passed: true, checks, fixture: fixture.metadata.pdbId, fingerprint: replayed.dataFingerprint, libraryCommit: export1.config.vizfootprint.sourceCommit, nativeCommitCount: replayed.history.length, realBranchCount: replayed.paths.length, selectedAfterReplay: replayed.selectedIds.length, nativeComparison: cmp };
console.log(JSON.stringify(result, null, 2));
if (process.env.RUNTIME_TEST_OUTPUT) writeFileSync(process.env.RUNTIME_TEST_OUTPUT, JSON.stringify(result, null, 2) + '\n');
