# VizFootprint session adapter

`ramachandran-session.mjs` uses the actual `buildDashboard` and `createSession`
implementation at the public VizFootprint commit
`992104dcd45326a42b8ac6c476e88bc95776b7f9`. The staged source is bundled with
FootPrintJS 10.0.0 and foottrace 1.0.3. The provider is in-memory; it needs no
database server, AI account, API key, or runtime network request.

The module's imports are public library subpaths. The build aliases
`vizfootprint/def` and `vizfootprint/data` to the corresponding `src/def/index.ts`
and `src/data/index.ts` in the pinned, staged source. The optional DuckDB provider
is unused. `tests/runtime/build-test.mjs` shows the integration-test build.

## API

```js
let runtime = await createRamachandranSession({ rows, metadata });
let state = await runtime.state();
state = await runtime.selectIds(rowIds, { source: 'scatter', intent: 'Brush residues' });
state = await runtime.clear();
state = await runtime.seek(commitId);
state = await runtime.resetCursor();
state = await runtime.newPath('alternative');
state = await runtime.switchPath('main');
const comparison = await runtime.compare('main', 'alternative');
const bundle = await runtime.exportSession();
runtime = await runtime.replaySession(bundle); // returns a NEW runtime
```

The native dashboard has named views `residues`, `scatter`, `histogram`,
`sequence`, and `table`. One shared selection port stores residue IDs. Every
visible view renders the same actual `selectedRows` snapshot, and each gesture
retains its origin in the native commit's cause. Origins are `scatter`,
`histogram`, `sequence`, `table`, `motif`, `controls`, and `system`.

Selections replace the shared subset. `selectIds([])` is a real empty selection.
`clear()` removes the active selection and restores all 46 fixture rows. The UI
plots the 44 rows with both angles, while tables, composition, and sequence keep
the two terminal residues with unavailable angles. Mutation methods serialize
and return the resulting snapshot.

The snapshot includes `hasSelection`, `activeSelection`, `selectedRows`,
`selectedIds`, `totalRows`, `dataFingerprint`, `cursor`, `head`, `initialCommit`,
`currentPath`, `paths`, `history`, and `gaps`. Each history item exposes native
commit identity, parent identity, cause, originating view, selected IDs/count,
current-cursor status, and named-path membership. `history.onPath` means the
ancestry at the current cursor; it may be shorter than the ancestry at `head`.
The initial full-protein state is itself a genuine system-caused clear commit,
so resetting or replaying to the beginning can seek a real library position.

Native comparison returns row counts at each side and changed folded facts:
`{ ok, a: { ref, tip, rows }, b: { ref, tip, rows }, ancestor, changed, onlyA,
onlyB }`. The `onlyA` and `onlyB` arrays contain facts, not residue-set differences.

## Export and replay

The versioned JSON export contains the actual native commit log, input rows,
structure-source metadata, exact configuration, data/config fingerprint, named
path tips, active path, cursor, head, and a whole-payload SHA-256 checksum. The
checksum detects accidental corruption; it is not a digital signature or proof
of who performed the exported interactions.

Replay validates the format, closed configuration, exact current fixture,
allowed residue IDs, native selection descriptors, causes, parent graph, path
names, and limits before handing the log to a fresh native session. Failed
imports leave the existing runtime unchanged. Successful replay uses the native
replay API, reconstructs visible named refs through native path APIs, and seeks
the saved cursor. Native replay marks causes with `replayed: true`; that marker
is retained. The native commit log does not export its ref-operation journal,
so visible named refs are restored rather than claiming a byte-identical ref
journal. Hidden temporary refs are archived after restoration.

The adapter caps a trail at 250 native commits and 250 named paths. It exposes
no raw, unvalidated replay door. The page applies its upload-size limit before
calling the module. Replayed trails can be exported again and continued with
new native commit IDs without collisions.

Imported commit IDs must be the app-produced sequence `s1` through `sN`, with
`N` at most 250. This prevents imported numeric IDs from overflowing the native
counter or creating an unreplayable continuation. A cause admits only
`requestedBy`, `computedBy`, `intent`, and optional `replayed: true`; unsupported
revert/replacement claims and malformed replay markers are refused before
native replay.

## Validation

Run `node tests/runtime/build-test.mjs`, then
`node tests/runtime/integration.bundle.mjs` from the package root. Integration
checks exercise native selection, honest empty selection, motif results,
branching, read-only comparison, named-ref restoration, detached cursor/head,
fresh-session replay, continuation after replay, fixed-data identity checks,
and malformed import refusal. `tests/runtime/result.json` records the last run.
