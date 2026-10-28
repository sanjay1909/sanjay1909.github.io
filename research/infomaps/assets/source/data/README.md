# Fictional document fixture

`corpus.json` contains 24 newly authored, fictional community-planning notes: six each for Mobility, Housing, Green space and Energy. Each topic has one invented note for each year from 2020 to 2025. The notes are teaching material, not collected records, actual proposals, evidence of outcomes or text taken from the 2012 paper.

The document map uses **year horizontally** and **title-plus-text token count vertically**. Position is metadata, not semantic similarity. Related themes deliberately cross topic labels. A document can mention a bus, solar equipment or housing without belonging to the corresponding primary topic.

Run `node generate-fixture.mjs` to rebuild the fixture from `authored-notes.json`. Run `node --test test-fixture.mjs` for the data/text checks. The generator needs only Node’s standard library. The browser-usable `text.mjs` is pure JavaScript with no network or package dependencies.

`tokenize(source)` lowercases text, extracts ASCII alphabetic runs and discards runs shorter than two letters. Stopwords remain, and no stemming occurs. `wordCount(source)` counts those tokens. The fixture count uses `title + ' ' + text`, so it includes repeated words in both fields.

`searchDocuments(rows, query)` returns `{tokens, rowIds}`. Query tokens are deduplicated and combined with AND. Matching uses whole eligible tokens from the document title and text. A query with no eligible tokens selects all documents. Case is ignored; prefixes and stem variants are not expanded.

`termCounts(rows, ids, keywords)` returns `{term, selected, total}` for each single-token keyword. Both counts are **document frequency**. A repeated term contributes at most once per document, and repeated selected IDs do not increase a count. This differs from a document’s token count or raw word occurrence count.

`metadata.sourceSha256` hashes UTF-8 `JSON.stringify(rows)`, using the generated row and key order and excluding metadata. It pins the actual compact row payload. The generator version and authored input are included beside it.

This is a modern, limited companion to the original paper’s documented theme of document exploration with retained interactions and layouts. It does not reconstruct an unverified 2012 layout, ranking, retrieval pipeline or evaluation, and it does not search an external document service.
