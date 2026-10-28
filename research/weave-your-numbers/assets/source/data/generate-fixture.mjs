import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const DAY_MS = 86_400_000;
export const config = JSON.parse(readFileSync(new URL('./generator-config.json', import.meta.url), 'utf8'));
export const rowsSha256 = rows => createHash('sha256').update(JSON.stringify(rows), 'utf8').digest('hex');

export function generateFixture(settings = config) {
  const first = Date.parse(settings.dateStart + 'T00:00:00.000Z');
  const last = Date.parse(settings.dateEnd + 'T00:00:00.000Z');
  if (!Number.isFinite(first) || last - first !== (settings.days - 1) * DAY_MS) throw Error('Invalid inclusive date range');
  const rows = Array.from({ length: settings.days }, (_, dayIndex) => {
    const instant = new Date(first + dayIndex * DAY_MS);
    const date = instant.toISOString().slice(0, 10);
    const weekday = instant.getUTCDay();
    const weekDayIndex = dayIndex % 7;
    const weekIndex = Math.floor(dayIndex / 7);
    const travelling = settings.travelRanges.some(([start, end]) => date >= start && date <= end);
    const row = {
      id: 'demo-' + date,
      date,
      dayIndex,
      steps: Math.round((settings.stepsBase + ((dayIndex * settings.stepsMultiplier + settings.stepsOffset) % settings.stepsModulo)) / 100) * 100,
      sleepHours: Math.round((settings.sleepWeekPattern[weekDayIndex] + settings.sleepWeekOffsets[weekIndex]) * 10) / 10,
      mood: Math.max(1, Math.min(5, settings.moodWeekPattern[weekDayIndex] + (weekIndex % 3 === 1 ? -1 : weekIndex % 3 === 2 ? 1 : 0))),
      context: travelling ? 'Travel' : weekday === 0 || weekday === 6 ? 'Weekend' : 'Routine',
    };
    for (const metric of settings.missing[date] ?? []) row[metric] = null;
    return row;
  });
  return {
    schemaVersion: 1,
    metadata: {
      title: 'Avery’s fictional daily diary',
      synthetic: true,
      persona: settings.persona,
      dateStart: settings.dateStart,
      dateEnd: settings.dateEnd,
      units: { steps: 'steps/day', sleepHours: 'hours/night', mood: 'ordinal self-rating, 1–5 (fictional)' },
      description: 'Deterministic invented records for one fictional person. Values and context labels illustrate linked exploration; they are not observations, medical evidence or a model of cause and effect. Missing measurements are explicit null values.',
      generatorVersion: settings.generatorVersion,
      sourceSha256: rowsSha256(rows),
    },
    rows,
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const fixture = generateFixture();
  writeFileSync(new URL('./synthetic-diary.json', import.meta.url), JSON.stringify(fixture, null, 2) + '\n');
  const defined = metric => fixture.rows.filter(row => row[metric] !== null).length;
  console.log(JSON.stringify({ rows: fixture.rows.length, sourceSha256: fixture.metadata.sourceSha256, defined: { steps: defined('steps'), sleepHours: defined('sleepHours'), mood: defined('mood') }, sleepMoodPairs: fixture.rows.filter(row => row.sleepHours !== null && row.mood !== null).length }));
}
