# Scientific fixture and literal motif search

This is the data and geometry portion of a modern companion to *Development of an Interactive Ramachandran Plot in Weave* (Purushe, Anbalagan and Grinstein, 2011; DOI `10.1109/IV.2011.109`). It supplies a reproducible example for linked exploration, not a structural-quality validator or a reproduction of an old experimental evaluation.

## Curated source

- Protein: crambin, [RCSB PDB 1CRN](https://www.rcsb.org/structure/1CRN).
- Dataset DOI: [10.2210/pdb1CRN/pdb](https://doi.org/10.2210/pdb1CRN/pdb).
- Depositors: W. A. Hendrickson and M. M. Teeter. The PDB record links the related primary scientific citation.
- Downloaded coordinate file: [`data/1CRN.pdb`](data/1CRN.pdb), from `https://files.rcsb.org/download/1CRN.pdb`, retrieved 2026-10-27.
- Entry version shown by RCSB: 1.5. Legacy PDB file revision: `REVDAT 9, 30-OCT-2024`.
- Source SHA-256: `42199a30a0701864a2a5cc76cd7f35cc544cd0e65fbcf63e03c166543249b811`.

The source contains one chain, A, with 46 canonical amino acids:

```text
TTCCPSIVARSNFNVCRLPGTPEAICATYTGCIIIPGATCPGDYAN
```

## Geometry and identity

`geometry.mjs` calculates signed torsions directly from backbone atom coordinates:

- φ(i): C(i−1), N(i), Cα(i), C(i).
- ψ(i): N(i), Cα(i), C(i), N(i+1).

Angles are expressed in degrees in `[-180, 180)`. An unavailable angle stays `null`. Consequently the first residue has no φ, the final residue has no ψ, and the plot has 44 points while the sequence, residue table and composition histogram can retain all 46 residues. No missing angle is replaced with zero.

Rows retain source, model, chain, residue number, insertion code, chosen backbone conformer, atom serials/altlocs and continuous-segment identity. The small reader accepts canonical amino-acid `ATOM` records. It is not a complete PDB/mmCIF or modified-residue parser.

A peptide is split across model, chain or `TER` boundaries, incompatible selected atom conformers, or a C–N distance of 1.8 Å or more. The 1.8 Å radius follows `Bio.PDB.PPBuilder`'s default. For disordered backbone atoms the reader chooses one conformer by completeness, mean occupancy, A then lexical tie-break; shared blank-altloc atoms may be used. It never mixes A/B atoms within one backbone. Independently selected incompatible adjacent conformers are conservatively separated.

No favoured, allowed or outlier classifications are supplied. No empirical contour is inferred from the displayed sample. A future structural-validation layer must use documented, versioned, residue-class-specific reference distributions.

## Independent check

[`data/angle-verification.json`](data/angle-verification.json) records a comparison of all **90 defined angles** against the independent `Bio.PDB.PPBuilder.get_phi_psi_list` implementation in **Biopython 1.86**. The maximum absolute circular difference is **0.0001492°**, below the selected **0.001°** tolerance. The first-φ and last-ψ nulls match. The small differences arise because Bio.PDB stores its coordinates as float32, whereas the JavaScript reader uses doubles.

The report binds the input PDB, generated fixture and JavaScript geometry source by SHA-256. It verifies angle arithmetic for this particular fixture; it does not establish scientific validity for arbitrary uploaded structures or classify a model as correct.

To regenerate:

```sh
node science/build-fixture.mjs
node --test tests/science/science.test.mjs
python3 -m pip install --target science/python-deps biopython==1.86
python3 science/verify-biopython.py
```

Python dependencies are local verification tools only. They are not website assets.

## Browser data interface

`data/1crn-residues.json` has `{ schemaVersion: 1, metadata, rows }`. Each row includes:

```js
{
  id, sourceId, model, chain, resSeq, insertionCode, altLoc,
  resName, oneLetter, sequenceIndex, segmentIndex, segmentId,
  phi, psi, plotAvailable, missingReason,
  backboneAtomSerials, backboneAtomAltLocs, availableAltLocs
}
```

The `id` is stable for this source and conformer policy, with model/chain/residue/insertion/altloc/segment components. The sequence indices are zero-based, while `resSeq` preserves the PDB identifier. Plot only rows with `plotAvailable === true`; retain unavailable-angle rows in other linked views.

## Motif search

`findMotif(rows, query)` in `motif.mjs` searches literal canonical one-letter amino-acid codes, case-insensitively. It supports overlapping matches; it does not implement regular expressions, wildcards, similarity or approximate biological-motif discovery.

It returns `{ query, matches, rowIds, error }`. Each match records segment/model/chain, inclusive global `startIndex`/`endIndex`, PDB start/end residue numbers, matched sequence and exact row IDs. An empty query produces an empty result, so the UI can explicitly clear a motif selection. Invalid query characters produce a readable `error`. A valid query with no match produces zero row IDs rather than a selection of every residue.

Search the complete fixture, then send the resulting row IDs to the coordinated selection. The helper also refuses to bridge discontinuities if passed a filtered subset: it checks model, chain, segment and consecutive within-segment indices.

Verified examples for 1CRN:

- `PG`: residues 19–20, 36–37, 41–42.
- `CPG`: residues 40–42.
- `II`: overlapping matches 33–34 and 34–35, covering three unique residues.
- `WW`: no matches.

For replay, preserve this fixture and its source/reference identifiers alongside the VizFootprint trail; the trail alone is not a self-contained scientific dataset.

## Publication whitelist

The curated JSON, original PDB data, verification JSON, pure `.mjs` helpers and this documentation are intended to be shareable with attribution. Exclude `python-deps/`, Python bytecode and task-only build logs when preparing website assets.
