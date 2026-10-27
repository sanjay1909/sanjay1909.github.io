import { DEFAULT_MODEL, SOURCES, runScenario } from './demo-core.mjs';

const $ = id => document.getElementById(id);
const kind = document.body.dataset.paper === 'chatbot' ? 'chatbot' : 'evidence';
let apiKey = '';
let controller;
let busy = false;
let epoch = 0;
let baseline = null;
let lastResult = null;
const text = (id, value) => { const element = $(id); if (element) element.textContent = value; };

function status(value) { text('demo-status', value); }
function setBusy(value) {
  busy = value;
  // Freeze request settings until completion. Otherwise a live completion
  // could restore a paid comparison baseline after the visitor selected sample.
  for (const control of document.querySelectorAll('input, select, textarea, #connect-key')) control.disabled = value;
  for (const button of document.querySelectorAll('[data-run], [data-example], #apply-action, #compare-run, #export-run')) button.disabled = value;
  $('compare-run') && ($('compare-run').disabled = value || !baseline);
  $('export-run').disabled = value || !lastResult;
  if ($('apply-action')) $('apply-action').disabled = value || !lastResult?.decision || lastResult.decision.action !== 'reset';
  $('cancel-run').hidden = !value;
}
function row(label, value) {
  const item = document.createElement('li');
  const heading = document.createElement('strong'); heading.textContent = label;
  const detail = document.createElement('span'); detail.textContent = value;
  item.append(heading, detail); return item;
}
function render(result, comparison = false) {
  $('result-panel').hidden = false;
  text('result-mode', result.mode === 'sample' ? 'Scripted sample · real library execution' : `Live Anthropic · ${result.model}`);
  text('answer-text', result.decision ? result.decision.explanation : result.answer);
  text('result-question', result.question);
  text('recorded-events', `${result.eventCount} events captured by AgentFootprint`);
  if (result.decision) {
    text('decision-action', result.decision.action);
    text('decision-customer', result.decision.customer);
  } else {
    const evidence = $('recorded-evidence'); evidence.replaceChildren();
    const seen = new Set();
    const ordered = [...result.consulted].sort((a, b) => (result.ranking.find(r => r.id === b.id)?.score ?? -1) - (result.ranking.find(r => r.id === a.id)?.score ?? -1));
    for (const source of ordered) {
      if (seen.has(source.id)) continue; seen.add(source.id);
      const ranked = result.ranking.find(r => r.id === source.id);
      const item = row(source.label, source.text);
      if (ranked && Number.isFinite(ranked.score)) {
        const meter = document.createElement('meter'); meter.min = 0; meter.max = 1; meter.value = ranked.score; meter.setAttribute('aria-label', `Illustrative alignment for ${source.label}: ${ranked.score.toFixed(3)}`);
        const label = document.createElement('small'); label.textContent = `Illustrative alignment · ${ranked.score.toFixed(3)}`;
        item.append(meter, label);
      } else { const label = document.createElement('small'); label.textContent = 'No per-source score available'; item.append(label); }
      evidence.append(item);
    }
    if (!result.consulted.length) evidence.append(row('No evidence tools were consulted', 'Read the answer with this limitation in mind.'));
    text('comparison-note', comparison ? 'This is one rerun with the unchecked sources removed, using the original question and the same model. A difference between two live answers alone does not prove a causal effect.' : 'Uncheck a sample source and select “Compare without this evidence” to rerun the original question.');
  }
  lastResult = result;
  text('activity-log', result.activity.length ? result.activity.join('\n') : 'Run completed.');
}
function selectedMode() { return $('run-mode').value; }
function errorMessage(error) {
  const m = String(error?.message ?? '');
  if (m.includes('KEY_REQUIRED')) return 'Add your own Anthropic key before running live, or choose the scripted sample.';
  if (m.includes('INVALID_DECISION')) return 'The model did not return a valid action label. The current customer was kept. Try a clearer question or run the scripted sample.';
  if (m.includes('CALL_LIMIT')) return 'This run reached its six-request limit. Try a shorter question.';
  if (/timed out/i.test(m)) return 'This run reached its time limit and was stopped. Any request already sent may still be billed by Anthropic.';
  if (/abort|cancel/i.test(m)) return 'Run stopped. Any request already sent may still be billed by Anthropic.';
  if (/401|403/.test(m)) return 'Anthropic rejected the request. Check your key, account access and selected model.';
  if (/429/.test(m)) return 'Anthropic reported a rate or usage limit. Wait before trying again.';
  if (/404/.test(m)) return 'The selected model is unavailable to this account. Try another Anthropic model ID.';
  return 'The run could not complete. Check your connection, API access and model. The scripted sample remains available.';
}
async function run(comparison = false) {
  if (busy) return;
  const previous = comparison ? baseline : null;
  const question = previous?.question ?? $('demo-question').value.trim();
  if (!question || question.length > 2000) { status('Enter a question of up to 2,000 characters.'); return; }
  const mode = previous?.mode ?? selectedMode();
  const model = previous?.model ?? ($('model-id').value.trim() || DEFAULT_MODEL);
  if (mode === 'live' && !apiKey) { status(errorMessage(new Error('KEY_REQUIRED'))); return; }
  if (!/^[a-zA-Z0-9._:-]{1,100}$/.test(model)) { status('Use a valid Anthropic model ID.'); return; }
  const excluded = [...document.querySelectorAll('[data-source]')].filter(input => !input.checked).map(input => input.dataset.source);
  if (comparison && excluded.length === previous.excluded.length && excluded.every(id => previous.excluded.includes(id))) { status('Change the evidence selection first, then compare.'); return; }
  if (comparison && previous.excluded.some(id => !excluded.includes(id))) { status('Select Run example to start a new baseline before restoring previously unavailable evidence.'); return; }
  if (!comparison) { baseline = null; lastResult = null; $('result-panel').hidden = true; }
  const token = ++epoch; controller = new AbortController();
  setBusy(true); status(mode === 'live' ? 'Running with your key. Selected sample data and your question are sent to Anthropic.' : 'Running the scripted sample through AgentFootprint…');
  text('activity-log', '');
  try {
    const result = await runScenario({ kind, mode, key: apiKey, model, question, current: $('customer-current')?.value.trim() || 'Delta Airlines', excluded, signal: controller.signal, onActivity: label => { if (token === epoch) text('activity-log', ($('activity-log').textContent + '\n' + label).trim()); } });
    if (token !== epoch) return;
    if (!comparison) baseline = { question, mode, model, excluded: [...excluded] };
    render(result, comparison); status('Run complete.');
  } catch (error) { if (token === epoch) status(errorMessage(error)); }
  finally { if (token === epoch) { controller = null; setBusy(false); } }
}

document.querySelector('[data-run]').addEventListener('click', () => run());
$('compare-run')?.addEventListener('click', () => run(true));
$('cancel-run').addEventListener('click', () => controller?.abort());
$('connect-key').addEventListener('click', () => {
  if (busy) return;
  const value = $('api-key').value.trim();
  if (!value) { status('Paste your own Anthropic key to enable live mode.'); return; }
  apiKey = value; $('api-key').value = ''; $('run-mode').value = 'live'; baseline = null;
  text('key-state', 'Key available in this tab only.'); status('Live mode is ready. No request is sent until you select Run.'); setBusy(false);
});
$('forget-key').addEventListener('click', () => {
  controller?.abort(); ++epoch; apiKey = ''; $('api-key').value = ''; $('run-mode').value = 'sample'; baseline = null; lastResult = null;
  $('result-panel').hidden = true; text('key-state', 'No key added.'); status('Key cleared. Scripted sample selected.'); setBusy(false);
});
$('run-mode').addEventListener('change', () => { baseline = null; setBusy(busy); status(selectedMode() === 'live' ? 'Live mode uses your own API key and incurs Anthropic API charges.' : 'Scripted sample selected. No API key or model request needed.'); });
$('demo-question').addEventListener('input', () => { baseline = null; setBusy(busy); });
for (const button of document.querySelectorAll('[data-example]')) button.addEventListener('click', () => { $('demo-question').value = button.dataset.example; baseline = null; setBusy(false); status('Example question selected. Select Run to try it.'); });
$('apply-action')?.addEventListener('click', () => { if (lastResult?.decision?.action === 'reset') { $('customer-current').value = lastResult.decision.customer; status(`Fictional session switched to ${lastResult.decision.customer}. No external customer system is connected.`); } });
$('export-run').addEventListener('click', () => {
  if (!lastResult || busy) return;
  const blob = new Blob([JSON.stringify(lastResult, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${kind}-demo-run.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('theme-toggle')?.addEventListener('click', () => { const light = document.documentElement.dataset.theme !== 'light'; document.documentElement.dataset.theme = light ? 'light' : 'dark'; $('theme-toggle').setAttribute('aria-pressed', String(light)); text('theme-toggle', light ? 'Dark slate' : 'Light paper'); });
for (const button of document.querySelectorAll('[data-copy-citation]')) button.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('bibtex').textContent); text('citation-status', 'Citation copied.'); }
  catch { text('citation-status', 'Select the citation text to copy it, or download the BibTeX file.'); }
});
setBusy(false);
status('Ready. Start with the scripted sample, or add your own key for a live model.');
