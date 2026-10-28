# Weave Your Numbers: portable reference source

Explore the [focused dashboard](../../demo/) or read the
[2014 paper companion page](../../index.html). This modern implementation uses
VizFootprint to link a steps timeline, a sleep-hours/mood scatterplot and a daily
table, with date/context selections, native exploration paths, time travel and
fresh-session replay. The [BibTeX citation](../../citation.bib) identifies the
original *Personal Informatics: Weave Your Numbers* research
([DOI](https://doi.org/10.1109/IC3I.2014.7019775)).

The included 56-day diary belongs to **Avery, a fictional person**. It is
deterministically generated data, not collected personal or medical records.
This is a teaching companion, not the original Weave software, an evaluation
replication or a connection to wearable/cloud accounts.

## Full website quickstart

Use **Node.js 24 or later**, npm, Git and Python 3. The full website supplies the
existing HTML and shared styles:

```sh
git clone https://github.com/sanjay1909/sanjay1909.github.io.git
cd sanjay1909.github.io/research/weave-your-numbers/assets/source
npm ci
mkdir -p .vendor
git -c core.autocrlf=false clone https://github.com/footprintjs/vizfootprint.git .vendor/vizfootprint
git -C .vendor/vizfootprint checkout --detach 992104dcd45326a42b8ac6c476e88bc95776b7f9
npm test
npm run build
python3 -m http.server 8000 --bind 127.0.0.1 --directory ../../../..
```

Open `http://localhost:8000/research/weave-your-numbers/demo/`. If you already
have the website checkout, start in its `assets/source` folder and skip the
first two commands. A standalone source folder can build and test the script,
but needs the companion HTML and shared styles for the full interface.

The package and lockfile pin `footprintjs` **10.0.0**, `foottrace` **1.0.3** and
`esbuild` **0.28.1**. The private npm package `vizfootprint` is not installed;
the build aliases its public `vizfootprint/def` and `vizfootprint/data` entry
points to the exact Git checkout. It checks installed versions and the full
upstream source tree against `vizfootprint-source-pin.json` before compiling.

`npm run build` writes **`../demo.js`** and copies `focus.js`, `focus.css` and
`demo.css` beside it. To verify without replacing the page's active files:

```sh
node build.mjs --outfile .verify/demo.js
```

The in-memory provider needs no server, API key or AI account. The unused
optional `@duckdb/duckdb-wasm` provider remains external to the build. Installing
dependencies/cloning uses the network; after static page assets load, exploring
and replaying this demo needs no network data request or API call. HTTPS or
localhost is needed for the browser Web Crypto checksum API.

## Data and tests

[`data/synthetic-diary.json`](data/synthetic-diary.json) contains daily rows from
5 January through 1 March 2026. [`data/README.md`](data/README.md) documents the
generator, units, context precedence and missing measurements. The generator
and its configuration are included; the compact row payload's SHA-256 is
recorded as `metadata.sourceSha256` and verified by the runtime.

```sh
node data/generate-fixture.mjs
npm run test:data
npm run test:views
npm run test:runtime
```

All 56 rows remain selectable. Each metric has 54 observations; the scatter
shows its 52 complete sleep/mood pairs. Timeline gaps remain gaps, missing table
values remain absent and CSV exports use empty fields. Missing values are never
replaced with zero. Each displayed mean counts that metric's observed values
independently; an empty metric produces a dash and zero observations.

Data tests regenerate and verify the fixture/hash. View tests independently
check summaries and exercise actual pointer handlers under SVG letterboxing,
point selection, missing values and line gaps. They use a focused DOM/screen
transform stub, not a full browser. Runtime tests exercise the real pinned
library, including branches, detached cursors, replay/continuation, tampering,
malformed IDs/causes/SQL and the 250-commit limit. Generated test bundles are
local products and are not included in the published source folder.

## Selection, time travel and replay

The [runtime API guide](runtime/README.md) describes the native session. One
actual day-ID selection coordinates all views. Brush a chart, choose a row or
select an inclusive date interval/context; an empty subset stays empty, while
**Show all recorded days** clears the selection.

**Time travel** opens a slider and recorded commit markers. Dragging previews a
step; releasing or choosing a marker restores it via real native `seek`.
Navigation adds no synthetic history. Selecting from the past creates a native
alternative path. An off-path cursor is labeled honestly, and **Latest** returns
to the active head. Replay walks recorded native positions; fresh replay creates
a new session from the validated original data/configuration and actual log.

Downloads include that fixture, metadata, configuration and native trail.
Imports are limited to **1,000,000 bytes**, **250 commits**, supported match
selections and the identical pinned fixture/configuration. Failed imports keep
the current session. Compact JSON downloads keep the maximum supported trail
under the upload limit. Intent bodies use the same **600-byte UTF-8 and
JSON-encoded byte budget** on creation and import; origin prefixes and outer
quotes are excluded. Unicode is retained within that budget, while JSON escape
inflation is counted. The checksum binds content and detects corruption; it
is **not a digital signature or proof of authorship**. Visible named path refs
are reconstructed through native APIs; the full ref-operation journal is not
claimed byte-identical.

The displayed summaries are plain JavaScript calculations over selected rows,
not declared VizFootprint analyses or statistical tests. Mood is a fictional
ordinal self-rating; its arithmetic mean is only an interface illustration.
These invented patterns are not medical, behavioral or causal evidence.

See [third-party notices](THIRD_PARTY_NOTICES.md) for preserved component
licenses. No private case documents, paper PDF, credentials, dependency cache or
generated bundle is part of this public source folder.
