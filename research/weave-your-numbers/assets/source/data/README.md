# Synthetic diary fixture

`synthetic-diary.json` contains 56 deterministic, invented daily rows for **Avery**, a fictional person, from 5 January through 1 March 2026 inclusive. It contains no collected personal or medical data.

Run `node generate-fixture.mjs` to rebuild the JSON and `node --test test-fixture.mjs` to verify it. The generator reads `generator-config.json`, uses UTC date arithmetic, and does not use randomness, accounts or a network service. The rules deliberately make an illustrative diary; they do not simulate physiology or establish cause and effect.

Rows are ordered by date. `dayIndex` is zero-based (0–55), and `id` is `demo-YYYY-MM-DD`. Steps, sleep and mood share that one daily identity, so linked charts and table rows can select exactly the same dates. Context is Routine, Weekend or Travel; a configured travel range takes precedence over a weekend label.

Units are **steps/day**, **hours/night**, and a fictional ordinal mood self-rating from **1 to 5**. The mood scale is an illustration, not a validated assessment. Each metric has 54 defined values. Six fields are deliberately null across five dates; missing measurements are never zero-filled. The sleep/mood scatter has 52 complete pairs.

`metadata.sourceSha256` is the SHA-256 digest of UTF-8 `JSON.stringify(rows)` using the generated row order and key order. It pins the actual compact row payload, excludes metadata, and avoids a self-referential file hash. Reformatting the outer JSON does not change that definition. `generatorVersion` identifies the deterministic recipe; its source and configuration are included beside the fixture.

This is a new teaching companion to the 2014 paper. Patterns in the invented rows are not evidence about behavior or health. The fixture supports exploratory filtering and replay without live wearable, cloud-drive or expert accounts.
