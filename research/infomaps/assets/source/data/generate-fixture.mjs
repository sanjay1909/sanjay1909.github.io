import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { wordCount } from './text.mjs';

export const authoredNotes = JSON.parse(readFileSync(new URL('./authored-notes.json', import.meta.url), 'utf8'));
export const rowsSha256 = rows => createHash('sha256').update(JSON.stringify(rows), 'utf8').digest('hex');
export function generateFixture(notes = authoredNotes) {
  const rows = notes.map((note, index) => ({ id: 'doc-' + String(index + 1).padStart(2, '0'), title: note.title, topic: note.topic, year: note.year, text: note.text, wordCount: wordCount(note.title + ' ' + note.text) }));
  return {
    schemaVersion: 1,
    metadata: {
      title: 'Fictional community planning notes',
      synthetic: true,
      description: 'Twenty-four newly authored fictional planning notes for a deterministic document-exploration companion. Topics and years are invented. The map axes show year and token count, not semantic similarity or a reconstruction of the 2012 InfoMaps layout.',
      generatorVersion: '1.0.0',
      sourceSha256: rowsSha256(rows),
      topics: ['Mobility','Housing','Green space','Energy'],
      keywords: ['bus','housing','park','water','bicycle','rent','trees','energy','station','flood','garden','solar'],
      tokenization: 'lowercase ASCII alphabetic tokens of length >=2; title and text; no stemming',
    },
    rows,
  };
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const fixture = generateFixture();
  writeFileSync(new URL('./corpus.json', import.meta.url), JSON.stringify(fixture, null, 2) + '\n');
  console.log(JSON.stringify({ rows: fixture.rows.length, sourceSha256: fixture.metadata.sourceSha256, wordCountBounds: [Math.min(...fixture.rows.map(row => row.wordCount)),Math.max(...fixture.rows.map(row => row.wordCount))] }));
}
