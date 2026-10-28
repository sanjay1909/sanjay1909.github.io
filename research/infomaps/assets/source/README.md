# InfoMaps: portable reference source

Open the [focused document explorer](../../demo/) or read the
[paper companion page](../../index.html). This modern teaching implementation
relates to *InfoMaps: A Session Based Document Visualization and Analysis Tool*
(2012; [DOI 10.1109/IV.2012.54](https://doi.org/10.1109/IV.2012.54)).
The [BibTeX citation](../../citation.bib) identifies the original research.

The corpus contains **24 newly authored fictional planning notes**, not
collected proposals, external search results or text copied from the paper.
The transparent map plots **year horizontally and title-plus-text token count
vertically**. Position is metadata; it is not semantic similarity or a
reconstruction of the original InfoMaps layout, retrieval pipeline or study.

## Full website quickstart

Use **Node.js 24 or later**, npm, Git and Python 3. Clone the website to obtain
the existing HTML and shared styles, then rebuild the explorer:

```sh
git clone --config core.autocrlf=false https://github.com/sanjay1909/sanjay1909.github.io.git
cd sanjay1909.github.io/research/infomaps/assets/source
npm ci
mkdir -p .vendor
git clone --config core.autocrlf=false https://github.com/footprintjs/vizfootprint.git .vendor/vizfootprint
git -C .vendor/vizfootprint checkout --detach 992104dcd45326a42b8ac6c476e88bc95776b7f9
npm test
npm run build
python3 -m http.server 8000 --bind 127.0.0.1 --directory ../../../..
```

Open `http://localhost:8000/research/infomaps/demo/`. If the full website is
already checked out, start in its `assets/source` folder and skip the first two
commands. A standalone source folder can build and test the script, but the
complete interface also needs the companion HTML and shared website styles.

The package and lockfile pin `footprintjs` **10.0.0**, `foottrace` **1.0.3** and
`esbuild` **0.28.1**. The build uses public VizFootprint source at the exact Git
commit above through its `vizfootprint/def` and `vizfootprint/data` entry points;
it does not install the private `vizfootprint` npm package. Installed versions
and the complete upstream source tree are verified before compilation using
`vizfootprint-source-pin.json`.

`npm run build` writes **`../demo.js`** and copies `focus.js`, `focus.css` and
`demo.css` beside it. To verify without replacing the active assets:

```sh
node build.mjs --outfile .verify/demo.js
```

The native provider is in-memory. The optional `@duckdb/duckdb-wasm` provider
is unused and remains external to the build. Installing/cloning uses the
network; after static assets load, selection, search and replay need no
network data request, API key, model or external document service. HTTPS or
localhost is required for the browser Web Crypto checksum API.

## Corpus and text behavior

The [fixture](data/corpus.json), [authored notes](data/authored-notes.json),
[generator](data/generate-fixture.mjs), [pure text helpers](data/text.mjs) and
[data guide](data/README.md) are included. IDs `doc-01` through `doc-24` join
the map, terms, table and reader. Four topics each have one fictional note per
year from 2020 through 2025. The row payload's compact UTF-8 SHA-256 is stored
as `metadata.sourceSha256` and checked before the native session is created.

Tokenization lowercases text, extracts ASCII alphabetic runs and discards runs
shorter than two letters. Stopwords remain; there is no stemming. A document's
token count includes repeated tokens from its title and text. Search combines
deduplicated eligible query tokens with **AND** and matches whole tokens. The
pure helper returns all documents when there are no eligible tokens. The UI
handles this explicitly: an empty field selects the full corpus; nonempty text
with no eligible tokens keeps the existing selection and explains the token
rule. An eligible query with no matches selects no documents.

Term bars show **document frequency** in the selected subset and full corpus.
Repeated occurrences count once per document. Choosing a term selects its
matches from the full corpus, replacing the current subset. Topic labels are
assigned categories; notes can mention themes from several topics. The reader
shows the first selected document as plain text. Choosing a table title or map
point creates a recorded single-document subset for reading that document;
there is no reader pager. Empty selections remain explicitly empty.

```sh
node data/generate-fixture.mjs
npm run test:data
npm run test:views
npm run test:runtime
```

Data tests regenerate and verify the corpus, hash and lexical behavior. View
tests independently check counts, reader behavior, reachable point IDs,
keyboard actions and actual pointer handlers under SVG letterboxing. These
focused DOM/transform tests do not replace real-browser layout checks. Runtime
tests exercise the pinned native library, including branches, detached cursors,
replay/continuation, malformed input and the maximum export envelope. Test
bundles are local products and are absent from the published source folder.

## Native selection and replay

The [runtime API guide](runtime/README.md) documents `createInfoMapsSession`.
One actual native document-ID selection coordinates the views. Map, term,
search, topic and table inputs replace that subset; **Show all documents**
clears it. Search/topic inputs choose the next subset; replay restores the
recorded document IDs rather than inferring new filters from those controls.

**Time travel** opens the recorded commit slider and markers. Dragging previews
a step; releasing or choosing a marker seeks the actual native commit.
Navigation creates no synthetic history. A new selection from the past creates
an alternative native path. **Latest** returns to the active head, and an
off-path cursor is labeled explicitly. Fresh replay validates the saved
fixture/configuration/log and reconstructs a new native session.

Imports are limited to **1,000,000 bytes**, **250 commits**, supported native
match selections and the identical pinned corpus/configuration. Failed imports
keep the current session. Intent bodies have matching 600-byte UTF-8 and
JSON-encoded budgets on creation/import, excluding the exact ASCII origin
prefix and JSON's outer quotes. Unicode is preserved within that budget, while
JSON escape inflation is counted. Compact JSON downloads keep the maximum
supported session reopenable. The checksum binds content and detects
corruption; it is **not a digital signature or proof of authorship**.

Visible named path refs are reconstructed through native APIs. The complete
ref-operation journal is not claimed byte-identical. Reader-side token totals,
means, search matching and term document frequencies are ordinary JavaScript
derivations over the actual fixture/selected rows, not declared VizFootprint
analyses, learned relevance scores or causal findings.

See [third-party notices](THIRD_PARTY_NOTICES.md) for the preserved licenses.
No private case material, paper PDF, credentials, dependency cache or generated
bundle is part of this public source folder.
