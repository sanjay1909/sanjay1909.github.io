// Captured UI/execution-event playback. This is not an AgentFootprint resume,
// a FootPrint transaction log, or proof that imported interactions occurred.
export const MAX_ENTRIES = 250;
export const MAX_BUNDLE_BYTES = 2_000_000;
export const SOURCE_IDS = Object.freeze(['social_profile', 'project_portfolio', 'academic_record']);
const FORMAT = 'hcii-demo-ui-trail';
const VERSION = 1;
const KINDS = new Set(['evidence', 'chatbot']);
const PHASES = new Set(['ready', 'started', 'activity', 'completed', 'applied', 'failed', 'cancelled']);
const FLAGS = new Set(['slice-truncated', 'untracked-sources', 'no-control-deps', 'no-read-tracking', 'no-llm-call-ids', 'baseline-unstable']);
const MODES = new Set(['sample', 'live']);
const fail = code => { throw new Error(code); };
const clone = value => JSON.parse(JSON.stringify(value));
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));

function jsonClone(value) {
  const active = new WeakSet(); let nodes = 0;
  const visit = (item, depth = 0) => {
    if (++nodes > 100_000 || depth > 20) fail('TRAIL_SIZE_LIMIT');
    if (typeof item === 'string') { if (item.length > MAX_BUNDLE_BYTES) fail('TRAIL_SIZE_LIMIT'); return; }
    if (item === null || typeof item === 'boolean' || (typeof item === 'number' && Number.isFinite(item))) return;
    if (typeof item !== 'object' || (!Array.isArray(item) && !isObject(item)) || active.has(item) || Object.getOwnPropertySymbols(item).length) fail('INVALID_JSON_VALUE');
    active.add(item);
    const keys = Object.getOwnPropertyNames(item).filter(key => !(Array.isArray(item) && key === 'length'));
    if (Array.isArray(item) && (keys.length !== item.length || keys.some((key, index) => key !== String(index)))) fail('INVALID_JSON_VALUE');
    for (const key of keys) {
      if (['__proto__', 'constructor', 'prototype', 'apiKey', 'api_key', 'key', 'authorization'].includes(key)) fail('UNSUPPORTED_FIELD');
      const descriptor = Object.getOwnPropertyDescriptor(item, key);
      if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) fail('INVALID_JSON_VALUE');
      visit(descriptor.value, depth + 1);
    }
    active.delete(item);
  };
  visit(value);
  const serialized = JSON.stringify(value);
  if (new TextEncoder().encode(serialized).length > MAX_BUNDLE_BYTES) fail('TRAIL_SIZE_LIMIT');
  return JSON.parse(serialized);
}
function object(value, fields) {
  if (!isObject(value) || Object.keys(value).length !== fields.length || fields.some(field => !Object.hasOwn(value, field))) fail('INVALID_OBJECT_SHAPE');
  if (Object.keys(value).some(field => !fields.includes(field))) fail('UNSUPPORTED_FIELD');
}
function string(value, max, min = 0) { if (typeof value !== 'string' || value.length < min || value.length > max) fail('INVALID_STRING'); }
function list(value, max) { if (!Array.isArray(value) || value.length > max) fail('INVALID_LIST'); }
function sourceIds(value) {
  list(value, SOURCE_IDS.length);
  if (new Set(value).size !== value.length || value.some(id => !SOURCE_IDS.includes(id))) fail('INVALID_SOURCE_ID');
}
function activity(value) { list(value, 200); for (const item of value) string(item, 1_000); }
function consulted(value) {
  list(value, 30);
  for (const item of value) { object(item, ['id', 'label', 'text']); if (!SOURCE_IDS.includes(item.id)) fail('INVALID_SOURCE_ID'); string(item.label, 200, 1); string(item.text, 12_000); }
}
function baseline(value) {
  object(value, ['question', 'mode', 'model', 'excluded']);
  string(value.question, 2_000); string(value.model, 100);
  if (!MODES.has(value.mode)) fail('INVALID_MODE');
  sourceIds(value.excluded);
}
function result(value, kind) {
  object(value, ['kind', 'mode', 'model', 'question', 'decision', 'answer', 'consulted', 'excluded', 'ranking', 'flags', 'activity', 'eventCount']);
  if (value.kind !== kind) fail('RESULT_KIND_MISMATCH');
  if (!MODES.has(value.mode)) fail('INVALID_MODE');
  string(value.model, 150, 1); string(value.question, 2_000); string(value.answer, 20_000);
  consulted(value.consulted); sourceIds(value.excluded); activity(value.activity);
  if (value.consulted.some(item => value.excluded.includes(item.id))) fail('INCONSISTENT_EVIDENCE');
  if (!Number.isSafeInteger(value.eventCount) || value.eventCount < 0 || value.eventCount > 100_000) fail('INVALID_EVENT_COUNT');
  if (kind === 'chatbot') {
    object(value.decision, ['action', 'customer', 'explanation']);
    if (!['acknowledge', 'reset', 'clarify'].includes(value.decision.action)) fail('INVALID_DECISION');
    string(value.decision.customer, 120, 1); string(value.decision.explanation, 600);
  } else if (value.decision !== null) fail('INVALID_DECISION');
  list(value.ranking, 100);
  for (const item of value.ranking) {
    object(item, ['id', 'score', 'content', 'kind']);
    if (!SOURCE_IDS.includes(item.id)) fail('INVALID_SOURCE_ID');
    if (item.kind !== 'correlational' || !Number.isFinite(item.score) || item.score < -1 || item.score > 1) fail('INVALID_RANKING');
    if (!value.consulted.some(source => source.id === item.id)) fail('INVALID_RANKING');
    string(item.content, 12_000);
  }
  list(value.flags, 30);
  for (const item of value.flags) { object(item, ['flag', 'note']); if (!FLAGS.has(item.flag)) fail('INVALID_FLAG'); string(item.note, 2_000); }
  if (kind === 'chatbot' && (value.consulted.length || value.ranking.length || value.flags.length)) fail('RESULT_KIND_MISMATCH');
}
function validateState(value, kind) {
  object(value, ['phase', 'settings', 'result', 'activity', 'consulted', 'liveCustomer', 'baseline']);
  if (!PHASES.has(value.phase)) fail('INVALID_PHASE');
  object(value.settings, ['question', 'current', 'mode', 'model', 'excluded']);
  string(value.settings.question, 2_000); string(value.settings.current, 120); string(value.settings.model, 100);
  if (!MODES.has(value.settings.mode)) fail('INVALID_MODE');
  sourceIds(value.settings.excluded); activity(value.activity); consulted(value.consulted); string(value.liveCustomer, 120);
  if (value.baseline !== null) baseline(value.baseline);
  if (value.result !== null) result(value.result, kind);
  if (kind === 'chatbot' && value.consulted.length) fail('STATE_KIND_MISMATCH');
}
function initialBundle(kind, initialState) {
  if (!KINDS.has(kind)) fail('INVALID_KIND');
  const owned = jsonClone(initialState); validateState(owned, kind);
  return { format: FORMAT, version: VERSION, kind, cursor: 'r1', head: 'r1', currentPath: 'main', paths: [{ name: 'main', tip: 'r1' }], entries: [{ id: 'r1', parentId: null, label: 'Initial state', state: owned }] };
}
function validateBundle(input, expectedKind) {
  let value = input;
  if (typeof input === 'string') {
    if (input.length > MAX_BUNDLE_BYTES || new TextEncoder().encode(input).length > MAX_BUNDLE_BYTES) fail('TRAIL_SIZE_LIMIT');
    try { value = JSON.parse(input); } catch { fail('INVALID_TRAIL_JSON'); }
  }
  const owned = jsonClone(value);
  object(owned, ['format', 'version', 'kind', 'cursor', 'head', 'currentPath', 'paths', 'entries']);
  if (owned.format !== FORMAT || owned.version !== VERSION) fail('UNSUPPORTED_TRAIL_FORMAT');
  if (owned.kind !== expectedKind || !KINDS.has(owned.kind)) fail('TRAIL_KIND_MISMATCH');
  list(owned.entries, MAX_ENTRIES); if (!owned.entries.length) fail('INVALID_TRAIL_ENTRIES');
  const ids = new Set();
  for (const [index, entry] of owned.entries.entries()) {
    object(entry, ['id', 'parentId', 'label', 'state']);
    if (entry.id !== 'r' + (index + 1)) fail('INVALID_TRAIL_ID');
    if (index === 0 ? entry.parentId !== null : !ids.has(entry.parentId)) fail('INVALID_TRAIL_PARENT');
    string(entry.label, 200, 1); validateState(entry.state, owned.kind); ids.add(entry.id);
  }
  if (owned.entries[0].label !== 'Initial state') fail('INVALID_TRAIL_BASELINE');
  if (!ids.has(owned.cursor) || !ids.has(owned.head)) fail('INVALID_TRAIL_CURSOR');
  list(owned.paths, MAX_ENTRIES); if (!owned.paths.length) fail('INVALID_TRAIL_PATH');
  for (const [index, path] of owned.paths.entries()) {
    object(path, ['name', 'tip']);
    if (path.name !== (index ? 'branch-' + index : 'main') || !ids.has(path.tip)) fail('INVALID_TRAIL_PATH');
  }
  if (!owned.paths.some(path => path.name === owned.currentPath && path.tip === owned.head)) fail('INVALID_TRAIL_PATH');
  const byId = new Map(owned.entries.map(entry => [entry.id, entry])); const covered = new Set();
  for (const path of owned.paths) { let id = path.tip; while (id && !covered.has(id)) { covered.add(id); id = byId.get(id).parentId; } }
  if (covered.size !== ids.size) fail('UNREACHABLE_TRAIL_ENTRY');
  return owned;
}

function createApi(initial) {
  let bundle = initial;
  const snapshot = () => clone({ kind: bundle.kind, cursor: bundle.cursor, head: bundle.head, currentPath: bundle.currentPath, paths: bundle.paths, entries: bundle.entries, current: bundle.entries.find(entry => entry.id === bundle.cursor).state });
  const api = {
    state: snapshot,
    record(label, nextState) {
      if (bundle.entries.length >= MAX_ENTRIES) fail('TRAIL_LIMIT');
      string(label, 200, 1);
      const owned = jsonClone(nextState); validateState(owned, bundle.kind);
      const id = 'r' + (bundle.entries.length + 1);
      const next = clone(bundle);
      next.entries.push({ id, parentId: bundle.cursor, label, state: owned });
      if (bundle.cursor === bundle.head) next.paths.find(path => path.name === bundle.currentPath).tip = id;
      else { next.currentPath = 'branch-' + next.paths.length; next.paths.push({ name: next.currentPath, tip: id }); }
      next.cursor = id; next.head = id;
      jsonClone(next); // Refuse an oversized export before assigning any state.
      bundle = next; return snapshot();
    },
    seek(id) { if (!bundle.entries.some(entry => entry.id === id)) fail('UNKNOWN_COMMIT'); bundle.cursor = id; return snapshot(); },
    switchPath(name) { const path = bundle.paths.find(path => path.name === name); if (!path) fail('UNKNOWN_PATH'); bundle.currentPath = name; bundle.head = path.tip; bundle.cursor = path.tip; return snapshot(); },
    clear(state = bundle.entries[0].state) { const fresh = initialBundle(bundle.kind, state); jsonClone(fresh); bundle = fresh; return snapshot(); },
    exportBundle() { return clone(bundle); },
    importBundle(input) { return createApi(validateBundle(input, bundle.kind)); },
  };
  return api;
}

export function createTrail({ kind, initialState }) {
  const initial = initialBundle(kind, initialState); jsonClone(initial);
  return createApi(initial);
}
