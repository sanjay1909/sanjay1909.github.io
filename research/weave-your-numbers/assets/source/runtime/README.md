# Native VizFootprint diary session

`createDiarySession(fixture)` in `diary-session.mjs` builds a real in-memory
VizFootprint dashboard/session. Named views are `days`, `timeline`, `scatter`
and `table`; one shared day-ID selection coordinates their rendered subsets.
Input origins `timeline`, `scatter`, `table`, `range`, `context`, `controls` and
`system` remain in the actual native commit's cause.

The asynchronous API is:

```js
let session = await createDiarySession(fixture);
let state = await session.state();
state = await session.selectIds(ids, { source: 'range', intent: 'Choose dates' });
state = await session.clear();
state = await session.seek(commitId);
state = await session.resetCursor();
state = await session.newPath('alternative');
state = await session.switchPath('main');
const comparison = await session.compare('main', 'alternative');
const saved = await session.exportSession();
session = await session.replaySession(saved); // a NEW wrapper/session
```

Mutations serialize and return a complete snapshot: `selectedIds`,
`selectedRows`, `hasSelection`, `activeSelection`, `totalRows`,
`dataFingerprint`, `cursor`, `head`, `initialCommit`, `currentPath`, `paths`,
`history` and `gaps`. `selectIds([])` is an active empty selection; `clear()`
restores all diary rows. Each input replaces the shared subset. The initial full-diary view is itself a native
system-caused clear commit, so reset/time travel seeks a real position.

Each history item carries the native ID/parent, cause, selected IDs/count and
visible path membership. `onPath` means cursor ancestry, which can be shorter
than head ancestry. Native comparison returns per-side selected row counts
and folded fact differences; its `onlyA`/`onlyB` are facts, not day-ID set
differences. The UI computes day-set overlap separately from those saved IDs.

Constructor checks enforce schema 1, at most 56 daily rows, unique
`demo-YYYY-MM-DD` IDs, consecutive valid UTC dates, zero-based day indices,
closed fields, bounded numeric metrics, ordinal integer mood, known contexts,
documented units and `synthetic: true`. Nulls stay null. The source row hash is
verified against UTF-8 compact `JSON.stringify(rows)` in generated key order.

Export includes the actual native log, full fixture/metadata/configuration,
fingerprint, named path tips, cursor/head and a whole-payload SHA-256 checksum.
Replay accepts only the same full fixture/configuration, known day IDs,
supported native match selections, canonical `s1`…`sN` IDs, valid parent
ancestry, native SQL descriptors and closed causes. Causes admit only actor
slots, intent and optional `replayed: true`. Other provenance claims cannot be
injected. Unknown formats, altered data, oversized and non-JSON values are
refused before native replay. The old wrapper remains unchanged on failure.

A fresh native session replays the validated log. Visible named refs are
restored through native path APIs, and the saved cursor is sought. Native
`replayed: true` markers are retained. The commit log does not contain the
complete ref-operation journal, so visible refs are reconstructed rather than
claiming that journal is byte-identical; temporary refs are archived.

Limits are 250 native commits, 250 named paths and 1,000,000 input bytes.
Intent bodies have a 600-byte UTF-8 budget for both their literal and
JSON-encoded representation, excluding the known ASCII origin prefix and
JSON's outer quotes. Creation and import apply the same rule. For example,
200 repetitions of `界` fit exactly; 600 repetitions do not. Quote, backslash
and control-character escaping also counts, keeping maximum supported exports
reopenable after replay markers and path metadata are included.
Download compact JSON so the maximum valid export can reopen under that byte
limit. The checksum detects corruption and binds values/configuration; it is
not a signature or proof of interaction authorship.

The page's means/counts are ordinary JavaScript calculations over actual
`selectedRows`, counting each metric's non-null observations independently.
They are not declared VizFootprint analyses, statistical tests or causal
findings. The synthetic ordinal mood summary is illustrative arithmetic, not
a validated health measure. No AI provider, credentials or database service is
needed.
