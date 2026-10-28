/** Lowercase ASCII alphabetic runs, discarding tokens shorter than two letters. */
export function tokenize(source) {
  if (typeof source !== 'string') throw new TypeError('Text must be a string');
  return (source.toLowerCase().match(/[a-z]+/g) ?? []).filter(token => token.length >= 2);
}

/** Count the same title/text tokens used by search, including stopwords. */
export const wordCount = source => tokenize(source).length;

export function searchDocuments(rows, query) {
  const tokens = [...new Set(tokenize(query))];
  const rowIds = rows.filter(row => {
    const words = new Set(tokenize(row.title + ' ' + row.text));
    return tokens.every(token => words.has(token));
  }).map(row => row.id);
  return { tokens, rowIds };
}

/** Selected/whole-corpus document frequency; repeated words count once per row. */
export function termCounts(rows, ids, keywords) {
  const selected = new Set(ids);
  const docs = rows.map(row => ({ id: row.id, words: new Set(tokenize(row.title + ' ' + row.text)) }));
  return keywords.map(keyword => {
    const tokens = tokenize(keyword);
    if (tokens.length !== 1) throw new TypeError('Each keyword must contain one eligible token');
    const term = tokens[0];
    const matching = docs.filter(doc => doc.words.has(term));
    return { term, selected: matching.filter(doc => selected.has(doc.id)).length, total: matching.length };
  });
}
