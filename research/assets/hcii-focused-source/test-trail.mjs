import assert from 'node:assert/strict';
import { createTrail, MAX_ENTRIES, MAX_BUNDLE_BYTES } from './trail.mjs';

const state = (patch = {}) => ({
  phase: 'ready',
  settings: { question: 'Which career fits Alex?', current: 'Delta Airlines', mode: 'sample', model: 'claude-haiku-4-5-20251001', excluded: [] },
  result: null, activity: [], consulted: [], liveCustomer: 'Delta Airlines', baseline: null,
  ...patch,
});
const source = { id: 'social_profile', label: 'Social profile', text: 'Synthetic source: civic-policy interest.' };
const evidenceResult = () => ({ kind: 'evidence', mode: 'sample', model: 'scripted mock provider', question: 'Which career fits Alex?', decision: null, answer: 'Illustrative recommendation.', consulted: [source], excluded: [], ranking: [{ id: source.id, score: 0.4, content: source.text, kind: 'correlational' }], flags: [{ flag: 'no-control-deps', note: 'This source ranking is correlational.' }], activity: ['Reading social_profile', 'Read social_profile'], eventCount: 20 });
const chatbotResult = () => ({ kind: 'chatbot', mode: 'sample', model: 'scripted mock provider', question: 'I mean Delta Dental.', decision: { action: 'reset', customer: 'Delta Dental', explanation: 'An explicit customer switch.' }, answer: 'A captured decision.', consulted: [], excluded: [], ranking: [], flags: [], activity: ['Model call started', 'Model call completed'], eventCount: 12 });
const checks = [];

const initial = state();
const trail = createTrail({ kind: 'evidence', initialState: initial });
initial.settings.question = 'Changed outside';
assert.equal(trail.state().current.settings.question, 'Which career fits Alex?');
assert.equal(trail.state().cursor, 'r1'); assert.equal(trail.state().entries[0].label, 'Initial state');
const leaked = trail.state(); leaked.current.settings.question = 'Changed snapshot';
assert.equal(trail.state().current.settings.question, 'Which career fits Alex?');
checks.push('baseline r1 and all returned/input state are independently cloned');

trail.record('Run started', state({ phase: 'started' }));
trail.record('Source returned', state({ phase: 'activity', activity: ['Read social_profile'], consulted: [source] }));
let snapshot = trail.record('Run completed', state({ phase: 'completed', result: evidenceResult(), consulted: [source], baseline: { question: 'Which career fits Alex?', mode: 'sample', model: 'claude-haiku-4-5-20251001', excluded: [] } }));
assert.equal(snapshot.head, 'r4'); assert.equal(snapshot.current.result.model, 'scripted mock provider');
const oldMain = structuredClone(snapshot.entries);
snapshot = trail.seek('r2'); assert.equal(snapshot.head, 'r4'); assert.equal(snapshot.current.phase, 'started');
snapshot = trail.record('Cancelled alternative', state({ phase: 'cancelled', activity: ['Run stopped'] }));
assert.equal(snapshot.cursor, 'r5'); assert.equal(snapshot.entries.at(-1).parentId, 'r2'); assert.equal(snapshot.currentPath, 'branch-1');
assert.deepEqual(snapshot.entries.slice(0, 4), oldMain);
assert.deepEqual(snapshot.paths, [{ name: 'main', tip: 'r4' }, { name: 'branch-1', tip: 'r5' }]);
snapshot = trail.seek('r3'); assert.equal(snapshot.head, 'r5'); assert.equal(snapshot.currentPath, 'branch-1');
snapshot = trail.record('Failed on another lane', state({ phase: 'failed', activity: ['Request failed'] }));
assert.equal(snapshot.entries.at(-1).parentId, 'r3'); assert.equal(snapshot.currentPath, 'branch-2');
snapshot = trail.switchPath('main'); assert.equal(snapshot.cursor, 'r4'); assert.equal(snapshot.current.phase, 'completed');
checks.push('seek is navigation; recording from past/off-path states preserves old branches and creates exact parent ancestry');

trail.seek('r2');
const exported = trail.exportBundle();
const reopened = trail.importBundle(JSON.stringify(exported));
assert.notEqual(reopened, trail); assert.deepEqual(reopened.state(), trail.state());
const continued = reopened.record('Continued after reopening', state({ phase: 'activity', activity: ['New captured event'] }));
assert.equal(continued.cursor, 'r7'); assert.equal(continued.entries.at(-1).parentId, 'r2');
assert.equal(continued.currentPath, 'branch-3');
assert.equal(trail.state().entries.length, 6);
const twice = reopened.importBundle(reopened.exportBundle()); assert.deepEqual(twice.state(), reopened.state());
checks.push('export/import reopens detached positions without mutating the old trail and continues with unique canonical IDs');

function assertRefused(input, pattern = /INVALID|UNSUPPORTED|MISMATCH|LIMIT|UNREACHABLE/) {
  const before = trail.state();
  assert.throws(() => trail.importBundle(input), pattern);
  assert.deepEqual(trail.state(), before);
}
const alter = change => { const copy = structuredClone(exported); change(copy); return copy; };
const rename = (copy, from, to) => {
  for (const entry of copy.entries) { if (entry.id === from) entry.id = to; if (entry.parentId === from) entry.parentId = to; }
  for (const path of copy.paths) if (path.tip === from) path.tip = to;
  for (const field of ['cursor', 'head']) if (copy[field] === from) copy[field] = to;
};
for (const id of ['r9007199254740992', 'r9007199254740991', 'r0', 'r01', 'r250']) assertRefused(alter(copy => rename(copy, 'r1', id)), /INVALID_TRAIL_ID/);
assertRefused(alter(copy => { copy.entries[2].parentId = 'r6'; }), /INVALID_TRAIL_PARENT/);
assertRefused(alter(copy => { copy.entries[2].parentId = null; }), /INVALID_TRAIL_PARENT/);
assertRefused(alter(copy => { copy.kind = 'chatbot'; }), /TRAIL_KIND_MISMATCH/);
assertRefused(alter(copy => { copy.version = 2; }), /UNSUPPORTED_TRAIL_FORMAT/);
assertRefused(alter(copy => { copy.format = 'native-agent-resume'; }), /UNSUPPORTED_TRAIL_FORMAT/);
assertRefused(alter(copy => { copy.cursor = 'r999'; }), /INVALID_TRAIL_CURSOR/);
assertRefused(alter(copy => { copy.paths[0].tip = 'r1'; copy.head = 'r1'; }), /UNREACHABLE_TRAIL_ENTRY/);
assertRefused(alter(copy => { copy.paths[1].name = 'main'; }), /INVALID_TRAIL_PATH/);
checks.push('unsafe IDs, invalid parents, cross-kind formats, unsupported versions, invalid cursors and broken path coverage are refused atomically');

assertRefused(alter(copy => { copy.apiKey = 'SHOULD-NOT-BE-EXPORTED'; }), /UNSUPPORTED_FIELD/);
assertRefused(alter(copy => { copy.entries[0].state.settings.apiKey = 'SHOULD-NOT-BE-EXPORTED'; }), /UNSUPPORTED_FIELD/);
assertRefused(alter(copy => { copy.entries[0].state.extra = true; }));
assertRefused(alter(copy => { copy.entries[0].state.settings.excluded = ['unknown_source']; }), /INVALID_SOURCE_ID/);
assertRefused(alter(copy => { copy.entries[3].state.result.kind = 'chatbot'; }), /RESULT_KIND_MISMATCH/);
assertRefused(alter(copy => { copy.entries[3].state.result.ranking[0].kind = 'causal'; }), /INVALID_RANKING/);
assertRefused(alter(copy => { copy.entries[3].state.result.consulted[0].id = 'unknown_source'; }), /INVALID_SOURCE_ID/);
assertRefused(alter(copy => { copy.entries[3].state.result.excluded = ['social_profile']; }), /INCONSISTENT_EVIDENCE/);
assertRefused(alter(copy => { copy.entries[3].state.result.flags[0].untrusted = true; }));
const cyclic = structuredClone(exported); cyclic.loop = cyclic; assertRefused(cyclic, /INVALID_JSON_VALUE/);
assertRefused(alter(copy => { copy.entries[0].state.settings.current = Infinity; }), /INVALID_JSON_VALUE/);
assertRefused(alter(copy => { copy.entries[0].state.settings.current = undefined; }), /INVALID_JSON_VALUE/);
assertRefused('{broken', /INVALID_TRAIL_JSON/);
checks.push('closed state/result schemas reject unknown or credential fields, foreign sources, causal ranking claims, cycles and non-JSON values');

const repeated = evidenceResult(); repeated.consulted.push(structuredClone(source)); repeated.ranking.push(structuredClone(repeated.ranking[0]));
trail.record('Repeated known tool call', state({ phase: 'completed', result: repeated, consulted: repeated.consulted }));
const chat = createTrail({ kind: 'chatbot', initialState: state() });
chat.record('Completed', state({ phase: 'completed', result: chatbotResult() }));
snapshot = chat.record('Applied', state({ phase: 'applied', result: chatbotResult(), liveCustomer: 'Delta Dental' }));
assert.equal(snapshot.current.liveCustomer, 'Delta Dental');
assert.throws(() => chat.importBundle(exported), /TRAIL_KIND_MISMATCH/);
const old = chat.state(); assert.throws(() => chat.seek('missing'), /UNKNOWN_COMMIT/); assert.throws(() => chat.switchPath('missing'), /UNKNOWN_PATH/); assert.deepEqual(chat.state(), old);
checks.push('both demo result contracts, applied customer state and bounded repeated live tool consultations are supported');

snapshot = reopened.clear(); assert.equal(snapshot.cursor, 'r1'); assert.equal(snapshot.entries.length, 1); assert.equal(snapshot.current.phase, 'ready');
snapshot = reopened.clear(state({ liveCustomer: 'New customer' })); assert.equal(snapshot.current.liveCustomer, 'New customer');
const beforeClear = reopened.state(); assert.throws(() => reopened.clear({ apiKey: 'never-store' })); assert.deepEqual(reopened.state(), beforeClear);
checks.push('clear starts a fresh validated baseline and refuses invalid resets without mutation');

const bounded = createTrail({ kind: 'evidence', initialState: state() });
for (let index = 1; index < MAX_ENTRIES; index++) bounded.record('Captured event ' + index, state({ phase: 'activity', activity: [String(index)] }));
assert.equal(bounded.state().cursor, 'r250');
const beforeLimit = bounded.state(); assert.throws(() => bounded.record('Too many', state()), /TRAIL_LIMIT/); assert.deepEqual(bounded.state(), beforeLimit);
assert.deepEqual(bounded.importBundle(bounded.exportBundle()).state(), bounded.state());
assertRefused(alter(copy => { while (copy.entries.length <= MAX_ENTRIES) copy.entries.push(structuredClone(copy.entries.at(-1))); }), /INVALID_LIST/);
assertRefused(' '.repeat(MAX_BUNDLE_BYTES + 1), /TRAIL_SIZE_LIMIT/);
const large = createTrail({ kind: 'evidence', initialState: state() });
const big = state({ activity: Array(200).fill('x'.repeat(1_000)) });
let sizeRefused = false;
for (let index = 0; index < 20; index++) {
  const before = large.state();
  try { large.record('Large captured screen', big); }
  catch (error) { assert.match(error.message, /TRAIL_SIZE_LIMIT/); assert.deepEqual(large.state(), before); sizeRefused = true; break; }
}
assert(sizeRefused);
assert.equal(large.record('Continued after size refusal', state()).current.phase, 'ready');
checks.push('250-entry and 2MB byte limits fail before mutation, while valid bounded trails reopen and continue');

console.log(JSON.stringify({ passed: true, checks, semantics: 'captured-state and execution-event playback; no model calls or native runtime resume', maxEntries: MAX_ENTRIES, maxBundleBytes: MAX_BUNDLE_BYTES }, null, 2));
