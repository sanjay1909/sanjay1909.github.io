import { buildDashboard } from 'vizfootprint/def';
import { mosaicDescriptorSQL } from 'vizfootprint/data';

export const RUNTIME_VERSION = 'diary-reference-v1';
export const VIZFOOTPRINT_SOURCE = '992104dcd45326a42b8ac6c476e88bc95776b7f9';
export const MAX_TRAIL_COMMITS = 250;
export const MAX_SESSION_BYTES = 1_000_000;
export const MAX_INTENT_BYTES = 600;
const FORMAT = 'weave-your-numbers-vizfootprint-session';
const SHARED_VIEW = 'days';
const restorers = new WeakMap();
const ACTOR_META = { actor: 'user', label: 'Linked diary-day selection' };
const ORIGINS = new Set(['timeline', 'scatter', 'table', 'range', 'context', 'controls', 'system']);
const CONFIG = Object.freeze({
  runtimeVersion: RUNTIME_VERSION,
  vizfootprint: { version: '0.1.0', sourceCommit: VIZFOOTPRINT_SOURCE },
  footprintjs: '10.0.0',
  foottrace: '1.0.3',
  selectionPolicy: 'shared-day-id-replace-v1',
  viewIds: ['days', 'timeline', 'scatter', 'table'],
  syntheticData: true,
});
const clone = value => JSON.parse(JSON.stringify(value));
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = message => { throw new Error(message); };

function checkedJSON(value) {
  const active = new WeakSet(); let nodes = 0;
  const visit = (item, depth = 0) => {
    if (++nodes > 100_000 || depth > 20) fail('INVALID_SESSION_SIZE');
    if (item === null || typeof item === 'boolean' || (typeof item === 'number' && Number.isFinite(item))) return;
    if (typeof item === 'string') { if (item.length > MAX_SESSION_BYTES) fail('INVALID_SESSION_SIZE'); return; }
    if (!item || typeof item !== 'object' || (!Array.isArray(item) && ![Object.prototype, null].includes(Object.getPrototypeOf(item))) || active.has(item) || Object.getOwnPropertySymbols(item).length) fail('INVALID_JSON_VALUE');
    const keys = Object.getOwnPropertyNames(item).filter(key => !(Array.isArray(item) && key === 'length'));
    if (Array.isArray(item) && (keys.length !== item.length || keys.some((key, index) => key !== String(index)))) fail('INVALID_JSON_VALUE');
    active.add(item);
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(item, key);
      if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) fail('INVALID_JSON_VALUE');
      visit(descriptor.value, depth + 1);
    }
    active.delete(item);
  };
  visit(value);
  const serialized = JSON.stringify(value);
  if (new TextEncoder().encode(serialized).length > MAX_SESSION_BYTES) fail('INVALID_SESSION_SIZE');
  return JSON.parse(serialized);
}
function fields(value, allowed, code) {
  if (!plain(value) || Object.keys(value).length !== allowed.length || allowed.some(key => !Object.hasOwn(value, key))) fail(code);
}
const dateStamp = date => {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('INVALID_DIARY_DATE');
  const stamp = Date.parse(date + 'T00:00:00.000Z');
  if (!Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0, 10) !== date) fail('INVALID_DIARY_DATE');
  return stamp;
};

/** Stable JSON for checksums, not executable code or a signature. */
export function canonicalJSON(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJSON(value[key])}`).join(',')}}`;
}
export async function sha256JSON(value) {
  return sha256Text(canonicalJSON(value));
}
export async function sha256Text(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function validRows(rows) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 56) fail('INVALID_DATASET');
  const ids = new Set();
  let previousDate = null;
  for (const [index, row] of rows.entries()) {
    fields(row, ['id', 'date', 'dayIndex', 'steps', 'sleepHours', 'mood', 'context'], 'INVALID_DAY_FIELDS');
    const stamp = dateStamp(row.date);
    if (row.id !== 'demo-' + row.date || ids.has(row.id) || row.dayIndex !== index) fail('INVALID_DAY_ID');
    if (previousDate !== null && stamp - previousDate !== 86_400_000) fail('INVALID_DIARY_DATE_SEQUENCE');
    previousDate = stamp;
    if (row.steps !== null && (!Number.isInteger(row.steps) || row.steps < 0 || row.steps > 100_000)) fail('INVALID_STEPS');
    if (row.sleepHours !== null && (!Number.isFinite(row.sleepHours) || row.sleepHours < 0 || row.sleepHours > 24 || Math.abs(row.sleepHours * 10 - Math.round(row.sleepHours * 10)) > 1e-8)) fail('INVALID_SLEEP_HOURS');
    if (row.mood !== null && (!Number.isInteger(row.mood) || row.mood < 1 || row.mood > 5)) fail('INVALID_MOOD');
    if (!['Routine', 'Weekend', 'Travel'].includes(row.context)) fail('INVALID_CONTEXT');
    ids.add(row.id);
  }
  return ids;
}
function validMetadata(metadata, rows) {
  fields(metadata, ['title', 'synthetic', 'persona', 'dateStart', 'dateEnd', 'units', 'description', 'generatorVersion', 'sourceSha256'], 'INVALID_SOURCE_METADATA');
  if (metadata.synthetic !== true || metadata.generatorVersion !== '1.0.0' || typeof metadata.title !== 'string' || !metadata.title || metadata.title.length > 250 || typeof metadata.persona !== 'string' || !metadata.persona || metadata.persona.length > 80 || typeof metadata.description !== 'string' || metadata.description.length > 2_000 || !/^[a-f0-9]{64}$/.test(metadata.sourceSha256)) fail('INVALID_SOURCE_METADATA');
  fields(metadata.units, ['steps', 'sleepHours', 'mood'], 'INVALID_DIARY_UNITS');
  if (metadata.units.steps !== 'steps/day' || metadata.units.sleepHours !== 'hours/night' || metadata.units.mood !== 'ordinal self-rating, 1–5 (fictional)') fail('INVALID_DIARY_UNITS');
  if (metadata.dateStart !== rows[0].date || metadata.dateEnd !== rows.at(-1).date) fail('INVALID_DIARY_DATE_RANGE');
}
function definition(rows) {
  return {
    meta: { title: 'Weave Your Numbers: linked synthetic diary exploration' },
    data: { days: { rows, key: 'id', engine: 'memory' } },
    actors: {
      days: ACTOR_META,
      scatter: { actor: 'user', label: 'Sleep and mood plot' },
      timeline: { actor: 'user', label: 'Steps timeline' },
      table: { actor: 'user', label: 'Diary table' },
    },
    analyses: {},
    capabilities: CONFIG.viewIds.map(viewId => ({ viewId, canProbe: true, encodings: ['match'] })),
    defaultTable: 'days',
  };
}
function checked(result) {
  if (!result?.ok) fail(result?.gap?.detail ?? 'VIZFOOTPRINT_REFUSED');
  return result;
}
function originOf(intent = '') { return /^\[([^\]]+)\]/.exec(intent)?.[1] ?? 'controls'; }
function validIntentBody(intent) {
  if (typeof intent !== 'string' || intent.length > MAX_INTENT_BYTES) return false;
  const bytes = value => new TextEncoder().encode(value).length;
  // The second bound accounts for JSON escapes such as quotes, backslashes and
  // control characters. Neither budget includes the known ASCII source prefix
  // or JSON's two outer quotes, so creation and replay judge the same body.
  return bytes(intent) <= MAX_INTENT_BYTES && bytes(JSON.stringify(intent).slice(1, -1)) <= MAX_INTENT_BYTES;
}
function cause(source, intent) {
  if (!ORIGINS.has(source) || !validIntentBody(intent)) fail('INVALID_INTENT');
  return { requestedBy: source === 'system' ? 'system' : 'user', computedBy: 'system', intent: `[${source}] ${intent}` };
}
function safePathName(name) {
  if (typeof name !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9 _-]{0,59}$/.test(name)) fail('INVALID_PATH_NAME');
  return name;
}
function validateRecords(records, rowIds) {
  if (!Array.isArray(records) || !records.length || records.length > MAX_TRAIL_COMMITS) fail('INVALID_TRAIL');
  const keys = new Set(['id', 'parent', 'viewId', 'actorMeta', 'kind', 'field', 'value', 'clientViewIds', 'predicateSQL', 'cause', 'ts']);
  const causeKeys = new Set(['requestedBy', 'computedBy', 'intent', 'replayed']);
  const ids = new Set(records.map(record => record?.id));
  const earlierIds = new Set();
  if (ids.size !== records.length) fail('DUPLICATE_TRAIL_COMMIT');
  for (const [index, record] of records.entries()) {
    if (!plain(record) || Object.keys(record).some(key => !keys.has(key)) || record.viewId !== SHARED_VIEW || record.field !== 'id' || record.kind !== 'match' || record.ts !== index) fail('UNSUPPORTED_TRAIL_RECORD');
    // This adapter owns a fresh dashboard and only appends select/clear acts.
    // Its native IDs are exactly s1…sN, with N <= MAX_TRAIL_COMMITS. Do not
    // raise the library's numeric mint counter from arbitrary imported IDs.
    if (record.id !== `s${index + 1}`) fail('INVALID_TRAIL_ID');
    if (canonicalJSON(record.actorMeta) !== canonicalJSON(ACTOR_META) || canonicalJSON(record.clientViewIds) !== canonicalJSON([SHARED_VIEW])) fail('INVALID_TRAIL_VIEW');
    if (index === 0 ? record.parent !== null : !earlierIds.has(record.parent)) fail('INVALID_TRAIL_PARENT');
    if (!plain(record.cause) || Object.keys(record.cause).some(key => !causeKeys.has(key)) || typeof record.cause.intent !== 'string') fail('INVALID_TRAIL_CAUSE');
    if (Object.hasOwn(record.cause, 'replayed') && record.cause.replayed !== true) fail('INVALID_TRAIL_CAUSE');
    const prefix = /^\[([^\]]+)\] /.exec(record.cause.intent);
    const origin = prefix?.[1];
    const body = prefix ? record.cause.intent.slice(prefix[0].length) : null;
    if (!ORIGINS.has(origin) || !validIntentBody(body) || record.cause.computedBy !== 'system' || record.cause.requestedBy !== (origin === 'system' ? 'system' : 'user')) fail('INVALID_TRAIL_CAUSE');
    if (record.value !== null) {
      if (!plain(record.value) || Object.keys(record.value).length !== 1 || !Array.isArray(record.value.values) || record.value.values.length > rowIds.size || new Set(record.value.values).size !== record.value.values.length || record.value.values.some(id => typeof id !== 'string' || !rowIds.has(id))) fail('INVALID_TRAIL_SELECTION');
    }
    const sql = mosaicDescriptorSQL('match', 'id', record.value);
    if (record.predicateSQL !== sql) fail('INVALID_TRAIL_PREDICATE');
    earlierIds.add(record.id);
  }
  const first = records[0];
  if (first.parent !== null || first.value !== null || first.cause.intent !== '[system] Initial full-diary view') fail('INVALID_TRAIL_BASELINE');
}

/**
 * Build a real VizFootprint session over the fixed, versioned synthetic diary fixture.
 * All visible views share ONE day-ID selection channel. The originating
 * gesture is preserved in cause.intent; no independent UI history is invented.
 */
export async function createDiarySession(fixture) {
  const ownedFixture = checkedJSON(fixture);
  fields(ownedFixture, ['schemaVersion', 'metadata', 'rows'], 'INVALID_DATASET_FIELDS');
  if (ownedFixture.schemaVersion !== 1) fail('INVALID_DATASET_VERSION');
  const ownedRows = ownedFixture.rows;
  const ownedMetadata = ownedFixture.metadata;
  const ids = validRows(ownedRows);
  validMetadata(ownedMetadata, ownedRows);
  if (await sha256Text(JSON.stringify(ownedRows)) !== ownedMetadata.sourceSha256) fail('SOURCE_METADATA_HASH_MISMATCH');
  const data = { schemaVersion: 1, metadata: ownedMetadata, rows: ownedRows };
  const dataFingerprint = await sha256JSON({ data, config: CONFIG });
  let session = buildDashboard(definition(ownedRows)).createSession();
  checked(await session.dispatch({ verb: 'select', viewId: SHARED_VIEW, field: 'id', values: null, cause: cause('system', 'Initial full-diary view') }));
  let initialCommit = session.cursor();
  let queue = Promise.resolve();

  async function snapshot() {
    const selectedRows = await session.selectedRows();
    const overview = await session.overview();
    const records = session.commits('anywhere');
    const onPath = new Set(session.commits('path').map(record => record.id));
    const selection = overview.activeSelections.find(item => item.viewId === SHARED_VIEW);
    const paths = session.paths();
    const byId = new Map(records.map(record => [record.id, record]));
    const pathMembers = new Map();
    for (const path of paths) {
      const members = new Set(); let cursor = path.tip;
      while (cursor && !members.has(cursor)) { members.add(cursor); cursor = byId.get(cursor)?.parent; }
      pathMembers.set(path.name, members);
    }
    return {
      dataFingerprint,
      totalRows: ownedRows.length,
      hasSelection: !!selection,
      activeSelection: selection ? clone(selection.value) : null,
      selectedIds: selectedRows.map(row => row.id),
      selectedRows: clone(selectedRows),
      cursor: session.cursor(), head: session.head, initialCommit,
      currentPath: overview.paths.current,
      paths: clone(paths),
      history: records.map(record => ({
        id: record.id, parent: record.parent, parentId: record.parent, kind: record.kind,
        source: originOf(record.cause.intent), intent: record.cause.intent ?? '', cause: clone(record.cause),
        selectedIds: record.value === null ? null : [...record.value.values],
        selectedCount: record.value === null ? ownedRows.length : record.value.values.length,
        onPath: onPath.has(record.id), current: record.id === session.cursor(),
        paths: paths.filter(path => pathMembers.get(path.name).has(record.id)).map(path => path.name),
      })),
      gaps: clone(session.gaps()),
    };
  }
  function mutate(action) {
    const next = queue.then(action).then(snapshot);
    queue = next.catch(() => {});
    return next;
  }
  function validateIds(values) {
    if (!Array.isArray(values) || values.some(id => typeof id !== 'string' || !ids.has(id))) fail('UNKNOWN_DAY_ID');
    const wanted = new Set(values);
    return ownedRows.filter(row => wanted.has(row.id)).map(row => row.id);
  }
  const api = {
    async state() { await queue; return snapshot(); },
    selectIds(values, { source = 'scatter', intent = 'Select diary days' } = {}) {
      return mutate(async () => {
        if (session.commits('anywhere').length >= MAX_TRAIL_COMMITS) fail('TRAIL_LIMIT');
        checked(await session.dispatch({ verb: 'select', viewId: SHARED_VIEW, field: 'id', values: validateIds(values), cause: cause(source, intent) }));
      });
    },
    clear({ source = 'controls', intent = 'Show all recorded days' } = {}) {
      return mutate(async () => {
        if (session.commits('anywhere').length >= MAX_TRAIL_COMMITS) fail('TRAIL_LIMIT');
        checked(await session.dispatch({ verb: 'select', viewId: SHARED_VIEW, field: 'id', values: null, cause: cause(source, intent) }));
      });
    },
    seek(commitId) { return mutate(() => checked(session.seek(commitId))); },
    resetCursor() { return mutate(() => checked(session.seek(initialCommit))); },
    newPath(name) { return mutate(() => {
      if (session.paths().length >= MAX_TRAIL_COMMITS) fail('PATH_LIMIT');
      checked(session.newPathAt(session.cursor(), safePathName(name)));
    }); },
    switchPath(name) { return mutate(() => checked(session.switchPath(safePathName(name)))); },
    async compare(a, b) { await queue; return clone(checked(await session.compare(a, b))); },
    async exportSession() {
      await queue;
      const overview = await session.overview();
      const payload = {
        format: FORMAT, schemaVersion: 1, config: clone(CONFIG), data: clone(data), dataFingerprint,
        initialCommit, log: clone(session.commits('anywhere')),
        paths: session.paths().map(path => ({ name: path.name, tip: path.tip })),
        activePath: overview.paths.current, cursor: session.cursor(), head: session.head,
      };
      return { ...payload, checksum: await sha256JSON(payload) };
    },
    async replaySession(input) {
      await queue;
      if (typeof input === 'string' && (input.length > MAX_SESSION_BYTES || new TextEncoder().encode(input).length > MAX_SESSION_BYTES)) fail('INVALID_SESSION_SIZE');
      const bundle = checkedJSON(typeof input === 'string' ? JSON.parse(input) : input);
      if (!plain(bundle) || bundle.format !== FORMAT || bundle.schemaVersion !== 1) fail('UNSUPPORTED_REPLAY_FORMAT');
      const allowed = new Set(['format', 'schemaVersion', 'config', 'data', 'dataFingerprint', 'initialCommit', 'log', 'paths', 'activePath', 'cursor', 'head', 'checksum']);
      if (Object.keys(bundle).some(key => !allowed.has(key))) fail('UNSUPPORTED_REPLAY_FIELD');
      const { checksum, ...payload } = bundle;
      if (typeof checksum !== 'string' || await sha256JSON(payload) !== checksum) fail('REPLAY_CHECKSUM_MISMATCH');
      if (payload.dataFingerprint !== dataFingerprint || canonicalJSON(payload.config) !== canonicalJSON(CONFIG) || canonicalJSON(payload.data) !== canonicalJSON(data)) fail('REPLAY_DATASET_MISMATCH');
      validateRecords(payload.log, ids);
      if (payload.initialCommit !== payload.log[0].id) fail('INVALID_REPLAY_BASELINE');
      const recordIds = new Set(payload.log.map(record => record.id));
      if (!recordIds.has(payload.cursor) || !recordIds.has(payload.head)) fail('INVALID_REPLAY_CURSOR');
      if (!Array.isArray(payload.paths) || !payload.paths.length || payload.paths.length > MAX_TRAIL_COMMITS || payload.paths.some(path => !plain(path)) || new Set(payload.paths.map(path => path.name)).size !== payload.paths.length) fail('INVALID_REPLAY_PATHS');
      for (const path of payload.paths) {
        if (!plain(path) || Object.keys(path).some(key => !['name', 'tip'].includes(key))) fail('INVALID_REPLAY_PATHS');
        safePathName(path.name);
        if (!recordIds.has(path.tip)) fail('INVALID_REPLAY_PATH_TIP');
      }
      if (payload.activePath !== null && !payload.paths.some(path => path.name === payload.activePath && path.tip === payload.cursor && path.tip === payload.head)) fail('INVALID_REPLAY_ACTIVE_PATH');
      const restored = await createDiarySession({ schemaVersion: 1, rows: ownedRows, metadata: ownedMetadata });
      await restorers.get(restored)(payload);
      return restored;
    },
  };
  // Module-private restore path: callers only reach this after validation.
  restorers.set(api, async payload => {
      const fresh = buildDashboard(definition(ownedRows)).createSession();
      checked(await fresh.replay(payload.log));
      const wanted = new Set(payload.paths.map(path => path.name));
      const temporary = [];
      for (const [index, path] of fresh.paths().entries()) {
        let name = `restored-auto-${index + 1}`;
        while (wanted.has(name) || fresh.paths().some(item => item.name === name)) name += '-x';
        checked(fresh.renamePath(path.name, name)); temporary.push(name);
      }
      for (const path of payload.paths) checked(fresh.newPathAt(path.tip, path.name));
      for (const name of temporary) checked(fresh.archivePath(name));
      if (payload.activePath !== null) checked(fresh.switchPath(payload.activePath));
      else {
        const headPath = payload.paths.find(path => path.tip === payload.head);
        if (!headPath) fail('INVALID_REPLAY_HEAD');
        checked(fresh.switchPath(headPath.name)); checked(fresh.seek(payload.cursor));
      }
      session = fresh; initialCommit = payload.initialCommit;
  });
  return api;
}
