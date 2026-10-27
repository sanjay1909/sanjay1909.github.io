# Ramachandran reference demo: portable source

This is the public source for the [paper companion page](../../index.html)
to *Development of an Interactive Ramachandran Plot in Weave* (Purushe,
Anbalagan and Grinstein, 2011; [DOI 10.1109/IV.2011.109](https://doi.org/10.1109/IV.2011.109)).
It is a modern reference implementation using VizFootprint, with a linked
phi/psi plot, composition histogram, sequence, residue table, literal motif
search, native exploration paths and fresh-session replay. The original paper
can be cited using the companion page's [BibTeX](../../citation.bib).

Open the [focused explorer](../../demo/) at
`https://sanjay1909.github.io/research/ramachandran-plot-weave/demo/` to try the
full-viewport dashboard.

## Full website quickstart

Use **Node.js 24 or later**, npm, Git and Python 3. Clone the full website so
the focused page's HTML and shared styles are present, then rebuild its assets:

```sh
git clone https://github.com/sanjay1909/sanjay1909.github.io.git
cd sanjay1909.github.io/research/ramachandran-plot-weave/assets/source
npm ci
mkdir -p .vendor
git -c core.autocrlf=false clone https://github.com/footprintjs/vizfootprint.git .vendor/vizfootprint
git -C .vendor/vizfootprint checkout --detach 992104dcd45326a42b8ac6c476e88bc95776b7f9
npm test
npm run build
python3 -m http.server 8000 --bind 127.0.0.1 --directory ../../../..
```

Open `http://localhost:8000/research/ramachandran-plot-weave/demo/`. If you
already have the full website checkout, start in its `assets/source` directory
and skip the first two commands. A standalone copy of only this source folder
can build and test the script, but needs the companion HTML and styles to run
the complete dashboard.

`npm ci` uses the included lockfile: `footprintjs` 10.0.0, `foottrace` 1.0.3 and
`esbuild` 0.28.1. Do not install the private npm package `vizfootprint`; the
builder uses its public Git source at the exact commit above. It checks both
installed package versions and the complete upstream `src/` tree's SHA-256
before compiling. `vizfootprint-source-pin.json` records the deterministic hash
algorithm and expected source identity.

The browser build writes **`../demo.js`**, and copies the focused layout's
`focus.js` and `focus.css` beside it. These are used by the focused explorer's
existing HTML. It aliases only the public `vizfootprint/def` and
`vizfootprint/data` entry points to the checked-out source. This package builds
the script and focused-layout assets; it expects the HTML controls and shared
base styles from the companion website. If working with the full website tree,
serve the site over HTTP on localhost and open the research page's `demo/`. HTTPS or
localhost is needed for the browser's Web Crypto checksum API.

To compile to a temporary location without replacing the page's script:

```sh
node build.mjs --outfile .verify/demo.js
```

The memory data provider uses the included 46-residue fixture. DuckDB is an
unused optional provider in the upstream source; `@duckdb/duckdb-wasm` remains
external to the bundle and need not be installed. This app never invokes that
provider. Installing and cloning require network access; the built demo itself
uses local bundled data and needs no API key, AI account, database server or
runtime network request.

## Tests and scientific inputs

```sh
npm run test:science
npm run test:runtime
npm run test:browser
node science/build-fixture.mjs
```

The runtime test builder emits beside `tests/runtime/integration.mjs`, keeping
its relative fixture URL valid. These tests run the real pinned library,
including selection, empty selection versus clear, branching, named path
restoration, detached cursor/head, replay, continuation, malformed imports and
the 250-commit limit. Generated test bundles are local build products and are
excluded from the published package.

The focused browser-coordinate tests exercise the actual plot pointer handlers
against a small DOM/screen-transform stub, including wide/tall SVG letterboxing,
angle bounds, point selection and cancellation. They check coordinate math;
they do not replace a real-browser layout or accessibility check.

[`science/data/1CRN.pdb`](science/data/1CRN.pdb) is the attributed source input;
[`science/data/1crn-residues.json`](science/data/1crn-residues.json) is the
derived fixture. [`science/README.md`](science/README.md) documents the geometry,
stable residue identity and motif rules. The included
[`angle-verification.json`](science/data/angle-verification.json) compares all
90 defined angles against Biopython 1.86, with a maximum circular difference of
0.0001492 degrees at a 0.001-degree tolerance. The first phi and final psi are
unavailable, leaving 44 plotted points while other views retain all 46 residues.

The optional independent check can be repeated locally:

```sh
python3 -m pip install --target science/python-deps biopython==1.86
python3 science/verify-biopython.py
```

## Replay and limits

The [runtime documentation](runtime/README.md) explains the API. Views share one
replacement selection of stable residue IDs, with the originating gesture in
the actual library cause. Export includes the native log, exact fixture and
configuration, source identities, named path tips, cursor/head and SHA-256
checksum. Import validates these before replaying in a fresh native session;
failed imports retain the current session. Native `replayed: true` markers are
kept. Visible named refs are restored through the native path APIs; the app does
not claim to preserve the upstream ref-operation journal byte for byte.

The **Time travel** button opens a slider and a marker for each recorded commit
on the current head's ancestry. Dragging previews a step label; releasing the
slider restores that commit through the real native `seek` operation. Clicking
a beat marker restores the same recorded position. Neither navigation creates
synthetic selections or extra commits. New selections from a past position
create an alternative native path. If the cursor is on another path, the slider
is disabled with an explicit notice; **Latest** returns to the current head.

The checksum detects corruption and pins input/configuration identity. It is
**not a signature or proof of authorship** of the interactions. Imports admit
only app-produced native IDs `s1` through `sN` (at most 250), the app's closed
cause shape and supported residue-ID selections. The page caps uploads at
1,000,000 bytes. An empty selection remains empty; clearing restores all rows.

This companion is a reproducible illustration, not a reconstruction of the
original Weave software or a repeat of the paper's evaluation. It is not a
structural-quality validator: no favoured/allowed/outlier classifications or
empirical validation contours are supplied. The PDB reader handles the curated
canonical amino-acid fixture, not arbitrary PDB/mmCIF or modified residues.
Motif search is literal and permits overlapping matches; it is not approximate
biological motif discovery. Browsers need modern SVG, pointer and Web Crypto
support. No private manuscript, credentials, dependency cache or generated
bundle is included in this source folder.

See [third-party notices and data attribution](THIRD_PARTY_NOTICES.md) for the
preserved component licenses and the coordinate source.
