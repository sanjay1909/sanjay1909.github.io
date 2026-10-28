# InfoMaps native session adapter

`infomaps-session.mjs` builds an actual VizFootprint dashboard and in-memory
session using public source commit
`992104dcd45326a42b8ac6c476e88bc95776b7f9`, FootPrintJS 10.0.0 and foottrace
1.0.3. The build aliases `vizfootprint/def` and `vizfootprint/data` to the pinned
source. No primary library repository is changed.

```js
let session = await createInfoMapsSession(fixture);
let state = await session.state();
state = await session.selectIds(ids, { source: 'search', intent: 'Search bus' });
state = await session.clear();
state = await session.seek(commitId);
state = await session.resetCursor();
state = await session.newPath('alternative');
state = await session.switchPath('main');
const comparison = await session.compare('main', 'alternative');
const saved = await session.exportSession();
session = await session.replaySession(saved); // returns a NEW wrapper/session
```

Named views are `documents`, `map`, `terms` and `table`. They share one actual
native document-ID selection. Inputs replace that subset; `selectIds([])` is
an active empty selection, while `clear()` restores all documents. The source
of an interaction (`map`, `terms`, `table`, `search`, `topic`, `controls` or
`system`) remains in the native cause. The initial full-document view is a
genuine system-caused clear commit, so reset can seek a real position.

Mutations serialize and return a snapshot with `selectedIds`, `selectedRows`,
`hasSelection`, `activeSelection`, `totalRows`, `dataFingerprint`, `cursor`,
`head`, `initialCommit`, `currentPath`, `paths`, `history` and `gaps`. History
contains native commit/parent IDs, cause, selected IDs/count, current position
and named-path membership. `onPath` means the current cursor's ancestry; it may
be shorter than the ancestry at `head`. Native comparison supplies per-side row
counts and folded fact differences. Its `onlyA`/`onlyB` arrays are facts, not
document-set differences.

The fixture is synthetic and closed to exactly 24 `doc-01`…`doc-24` rows with
`id`, `title`, `topic`, `year`, `text` and `wordCount`. There is one document for
each of four known topics and each year from 2020 through 2025. Titles/text have
bounded lengths, and declared counts are recomputed from lowercase ASCII
alphabetic tokens of at least two characters in title plus text, including
stopwords and without stemming. Metadata's exact topic/keyword/tokenization
contract and compact-row SHA-256 are verified before native session creation.

No synthetic x/y projection is stored or inferred by this adapter. The page's
transparent map uses year and declared token count. Search matching, term
document frequencies and any reader-side counts are ordinary JavaScript
derivations over the actual fixture/selected rows; they are not declared
VizFootprint analyses or model/causal findings.

Export contains the actual native log, full fixture/metadata/configuration,
fingerprint, named path tips, cursor/head and whole-payload SHA-256 checksum.
Replay requires the identical owned fixture/configuration and validates known
document IDs, supported native match selections, exact canonical commit IDs
`s1`…`sN`, ordered parents, native SQL descriptors and a closed cause shape.
Causes permit only actor slots, intent and optional `replayed: true`; unsupported
provenance cannot be injected. Invalid imports leave the old wrapper unchanged.

Validated replay uses a fresh native session. Native replay markers are kept;
visible named refs are reconstructed through native path APIs before restoring
the cursor. The complete ref-operation journal is not claimed byte-identical,
and temporary refs are archived after reconstruction. Replayed sessions can be
exported again and continued without native ID collisions.

Limits are 250 commits, 250 named paths and 1,000,000 input bytes. Intent bodies
use the same 600-byte UTF-8 and JSON-encoded byte budget on creation/import,
excluding the exact ASCII origin prefix and JSON's outer quotes. This preserves
Unicode within the budget while accounting for quote/backslash/control escapes.
Use compact JSON downloads to preserve the maximum supported envelope. The
checksum detects corruption and binds content; it is not a digital signature
or proof of authorship of saved interactions.

The memory provider needs no database, credentials, model or runtime API call.
Tests exercise actual library selection, empty versus cleared state, branches,
read-only comparison, detached cursors, fresh replay/continuation, malformed
inputs and the maximum Unicode/escaped-text/path/commit envelope. This is a
reference document-exploration companion, not a native agent resume mechanism.
