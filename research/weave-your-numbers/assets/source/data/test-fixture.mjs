import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { config, generateFixture, rowsSha256 } from './generate-fixture.mjs';

const fixture = JSON.parse(readFileSync(new URL('./synthetic-diary.json', import.meta.url), 'utf8'));
test('fixture is reproducible and the hash pins the canonical actual row payload', () => {
  assert.deepEqual(generateFixture(), fixture);
  assert.deepEqual(generateFixture(structuredClone(config)), fixture);
  assert.equal(fixture.metadata.sourceSha256, rowsSha256(fixture.rows));
  const changed = structuredClone(fixture.rows); changed[0].steps += 1;
  assert.notEqual(rowsSha256(changed), fixture.metadata.sourceSha256);
});
test('one UTC date and unique stable ID joins every metric across the inclusive 56-day range', () => {
  assert.equal(fixture.rows.length, 56);
  assert.equal(fixture.rows[0].date, '2026-01-05'); assert.equal(fixture.rows.at(-1).date, '2026-03-01');
  assert.equal(new Set(fixture.rows.map(row => row.id)).size, 56);
  assert.equal(new Set(fixture.rows.map(row => row.date)).size, 56);
  for (const [index, row] of fixture.rows.entries()) {
    assert.equal(row.dayIndex, index); assert.equal(row.id, 'demo-' + row.date);
    assert.equal(Date.parse(row.date + 'T00:00:00Z'), Date.parse('2026-01-05T00:00:00Z') + index * 86_400_000);
    assert.deepEqual(Object.keys(row), ['id','date','dayIndex','steps','sleepHours','mood','context']);
  }
});
test('units, synthetic provenance and numeric domains are explicit', () => {
  assert.equal(fixture.metadata.synthetic, true); assert.equal(fixture.metadata.persona, 'Avery');
  assert.equal(fixture.schemaVersion, 1); assert.equal(fixture.metadata.generatorVersion, '1.0.0');
  assert.deepEqual(fixture.metadata.units, { steps: 'steps/day', sleepHours: 'hours/night', mood: 'ordinal self-rating, 1–5 (fictional)' });
  for (const row of fixture.rows) {
    assert(row.steps === null || Number.isInteger(row.steps) && row.steps > 0);
    assert(row.sleepHours === null || Number.isFinite(row.sleepHours) && row.sleepHours > 0 && row.sleepHours < 24);
    assert(row.mood === null || Number.isInteger(row.mood) && row.mood >= 1 && row.mood <= 5);
    assert(['Routine','Weekend','Travel'].includes(row.context));
  }
});
test('five distinct missing dates remain null, with metric and complete-pair counts checked independently', () => {
  const missing = fixture.rows.filter(row => [row.steps,row.sleepHours,row.mood].includes(null));
  assert.deepEqual(missing.map(row => row.date), ['2026-01-11','2026-01-22','2026-02-03','2026-02-17','2026-02-25']);
  for (const [date, metrics] of Object.entries(config.missing)) {
    const row = fixture.rows.find(row => row.date === date);
    for (const metric of metrics) assert.equal(row[metric], null);
  }
  for (const metric of ['steps','sleepHours','mood']) assert.equal(fixture.rows.filter(row => row[metric] !== null).length, 54);
  assert.equal(fixture.rows.filter(row => row.sleepHours !== null && row.mood !== null).length, 52);
});
test('context categories use UTC weekends and documented inclusive travel ranges', () => {
  const counts = Object.fromEntries(['Routine','Weekend','Travel'].map(context => [context, fixture.rows.filter(row => row.context === context).length]));
  assert.deepEqual(counts, { Routine: 33, Weekend: 15, Travel: 8 });
  assert.equal(fixture.rows.find(row => row.date === '2026-02-14').context, 'Travel');
  assert.equal(fixture.rows.find(row => row.date === '2026-02-15').context, 'Weekend');
  assert.equal(fixture.rows.find(row => row.date === '2026-02-16').context, 'Routine');
});
