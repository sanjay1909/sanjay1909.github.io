// Builds the talks pages from their data: `node talks/_build.mjs` (Node 18+, no packages).
//
// Every talk is a folder, talks/<slug>/, holding talk.json (its facts and links) and its slides. This writes
// talks/<slug>/index.html (the talk's page) and talks/index.html (one card per talk, newest first) from those
// files, so the pages work without JavaScript and link previews read real titles. Edit a talk.json, run this,
// commit both. The leading underscore keeps this script off the published site (GitHub Pages runs Jekyll).
import {readFileSync, writeFileSync, readdirSync, existsSync} from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const SITE = 'https://sanjay1909.github.io';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const longDate = iso => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'});
const NEW_TAB = 'target="_blank" rel="noopener noreferrer"';
const SR_NEW_TAB = '<span class="sr-only">(opens in a new tab)</span>';

/** The YouTube video id in a watch, youtu.be, shorts or embed link, or null. */
function youtubeId(url) {
  const m = /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/.exec(url ?? '');
  return m ? m[1] : null;
}

/** Every talk folder with its talk.json, newest first. */
function readTalks() {
  return readdirSync(here, {withFileTypes: true})
    .filter(d => d.isDirectory() && existsSync(path.join(here, d.name, 'talk.json')))
    .map(d => ({slug: d.name, ...JSON.parse(readFileSync(path.join(here, d.name, 'talk.json'), 'utf8'))}))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** The <head> both kinds of page share. */
function head({title, description, url, root}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f5f5f1">
  <meta name="description" content="${esc(description)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <link rel="canonical" href="${url}">
  <link rel="icon" href="${root}knowme/icon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${root}knowme/style.css">
  <link rel="stylesheet" href="${root}talks/talks.css">
  <title>${esc(title)}</title>
</head>
<body>
  <main>
`;
}

/** The page's end: the same footer as knowme, its name leading back there. */
const footer = root => `    <footer><span>Small libraries. Connected ideas.</span><a href="${root}knowme/">Sanjay Krishna Anbalagan</a></footer>
  </main>
</body>
</html>
`;

/** What a talk has to watch or read: the slides, the teaser, the recording — or when each is coming. */
function actions(t) {
  const link = (url, label) => `<a class="action" href="${esc(url)}" ${NEW_TAB}>${label} <span aria-hidden="true">↗</span>${SR_NEW_TAB}</a>`;
  return [
    `<a class="action primary" href="${esc(t.slides)}"><span aria-hidden="true">▶</span> View the slides</a>`,
    t.teaser ? link(t.teaser, 'Teaser video') : '<span class="action soon">Teaser video · soon</span>',
    t.recording ? link(t.recording, 'Talk recording') : '<span class="action soon">Talk recording · after the conference</span>',
  ].join('\n        ');
}

/** A video from YouTube, played from the privacy-enhanced domain; nothing when the link is not a YouTube one. */
function video(url, label) {
  const id = youtubeId(url);
  return id ? `
    <figure class="video"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${esc(label)}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></figure>` : '';
}

/** A card in the knowme style: a type label, a name, its package, a line about it, where it goes. */
function card({type, name, pkg, about, url, destination, source}) {
  return `        <article class="project">
          <a class="project-main" href="${esc(url)}" ${NEW_TAB}>
            <div class="project-top"><span class="project-type">${esc(type)}</span><span class="arrow" aria-hidden="true">↗</span></div>
            <h3>${esc(name)}</h3>
            ${pkg ? `<span class="package-name">${esc(pkg)}</span>` : ''}
            <p>${esc(about)}</p>
            <span class="destination">${esc(destination)} ${SR_NEW_TAB}</span>
          </a>${source ? `
          <a class="source" href="${esc(source)}" ${NEW_TAB}>View source <span aria-hidden="true">↗</span><span class="sr-only"> for ${esc(name)} on GitHub (opens in a new tab)</span></a>` : ''}
        </article>`;
}

function talkPage(t) {
  const title = `${t.title} — ${t.eventShort}`;
  return head({title, description: t.summary, url: `${SITE}/talks/${t.slug}/`, root: '../../'}) + `    <nav class="crumbs"><a href="../">← All talks</a></nav>
    <header class="intro">
      <span class="eyebrow">${esc(t.eventShort)} · ${esc(longDate(t.date))} · ${esc(t.place)}</span>
      <h1>${esc(t.title)}<span class="dot">.</span></h1>
      <p>${esc(t.summary)}</p>
      <div class="talk-actions">
        ${actions(t)}
      </div>
    </header>
${video(t.teaser, `${t.title}: teaser`)}${video(t.recording, `${t.title}: the talk`)}
    <section class="more" aria-labelledby="libraries-title">
      <div class="section-heading"><h2 id="libraries-title">In this talk</h2><span>THE LIBRARIES</span></div>
      <div class="project-grid">
${t.libraries.map(l => card({type: 'LIBRARY', name: l.name, pkg: l.package, about: l.about, url: l.url, destination: 'Explore the site', source: l.source})).join('\n')}
      </div>
    </section>

    <section class="more" aria-labelledby="made-title">
      <div class="section-heading"><h2 id="made-title">Behind the talk</h2><span>EARLY STAGE · OPEN SOURCE</span></div>
      <p class="section-note">Both are early: if they interest you, take a look, and please raise questions or ideas as issues on GitHub.</p>
      <div class="project-grid">
${t.madeWith.map(m => card({type: m.for, name: m.name, pkg: m.package, about: m.about, url: m.url, destination: 'View on GitHub'})).join('\n')}
      </div>
    </section>

    <section class="more connect" aria-labelledby="speaker-title">
      <div class="section-heading"><h2 id="speaker-title">The speaker</h2></div>
      <div class="social-grid">
        <a class="social" href="${esc(t.speaker.profile)}"><span><strong>${esc(t.speaker.name)}</strong><small>Libraries, writing and links</small></span><span class="arrow" aria-hidden="true">→</span></a>
        <a class="social" href="${esc(t.speaker.linkedin)}" ${NEW_TAB}><span><strong>LinkedIn</strong><small>Let’s connect</small></span><span class="arrow" aria-hidden="true">↗</span>${SR_NEW_TAB}</a>
      </div>
    </section>
` + footer('../../');
}

function talksIndex(talks) {
  const chips = t => [
    '<span class="chip">Slides</span>',
    `<span class="chip${t.teaser ? '' : ' soon'}">Teaser${t.teaser ? '' : ' · soon'}</span>`,
    `<span class="chip${t.recording ? '' : ' soon'}">Recording${t.recording ? '' : ' · soon'}</span>`,
  ].join('');
  return head({title: 'Talks — Sanjay Krishna Anbalagan', description: 'Talks by Sanjay Krishna Anbalagan: the slides, the videos and the libraries behind them.', url: `${SITE}/talks/`, root: '../'}) + `    <nav class="crumbs"><a href="../knowme/">← Sanjay Krishna Anbalagan</a></nav>
    <header class="intro">
      <h1>Talks<span class="dot">.</span></h1>
      <p>Slides, videos and the libraries behind them.</p>
    </header>
    <section class="talk-list" aria-label="Talks, newest first">
${talks.map(t => `      <article class="project talk-card">
        <a class="project-main" href="${t.slug}/">
          <div class="project-top"><span class="project-type">${esc(t.eventShort)} · ${esc(longDate(t.date))}</span><span class="arrow" aria-hidden="true">→</span></div>
          <h3>${esc(t.title)}</h3>
          <p>${esc(t.summary)}</p>
          <span class="chips">${chips(t)}</span>
        </a>
      </article>`).join('\n')}
    </section>
` + footer('../');
}

const talks = readTalks();
for (const t of talks) writeFileSync(path.join(here, t.slug, 'index.html'), talkPage(t));
writeFileSync(path.join(here, 'index.html'), talksIndex(talks));
console.log(`talks: ${talks.length} — ${talks.map(t => `${t.slug} (slides ✓ · teaser ${t.teaser ? '✓' : 'soon'} · recording ${t.recording ? '✓' : 'soon'})`).join(', ')}`);
