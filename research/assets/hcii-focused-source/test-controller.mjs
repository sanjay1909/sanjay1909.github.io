import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import { MAX_BUNDLE_BYTES } from './trail.mjs';

// Execute the unchanged controller with the real trail in one JS realm. The
// DOM and deferred provider/file interfaces are test doubles; product files
// gain no hooks, exports or special test behavior.
const controllerSource = readFileSync(new URL('./focused-browser.mjs', import.meta.url), 'utf8');
const trailSource = readFileSync(new URL('./trail.mjs', import.meta.url), 'utf8');
const coreSource = readFileSync(new URL('./demo-core.mjs', import.meta.url), 'utf8');
const modelLiteral = /export const DEFAULT_MODEL = ([^;]+);/.exec(coreSource)[1];
const sourcesLiteral = /export const SOURCES = (\[[\s\S]*?\n\]);/.exec(coreSource)[1];
const plain = value => JSON.parse(JSON.stringify(value));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

class Element {
  constructor(tag = 'div') { this.tagName = tag; this.children = []; this.listeners = new Map(); this.attrs = new Map(); this.dataset = {}; this.style = {}; this.value = ''; this.textContent = ''; this.disabled = false; this.hidden = false; this.checked = true; this.files = []; this.className = ''; this.scrollTop = 0; this.offsetTop = 0; this.offsetHeight = 1; this.clientHeight = 100; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(key, value) { this.attrs.set(key, String(value)); }
  getAttribute(key) { return this.attrs.get(key) ?? null; }
  addEventListener(type, fn) { const handlers = this.listeners.get(type) ?? []; handlers.push(fn); this.listeners.set(type, handlers); }
  dispatch(type, extra = {}) { const outputs = (this.listeners.get(type) ?? []).map(fn => fn({ target: this, ...extra })); return outputs.length === 1 ? outputs[0] : Promise.all(outputs); }
  click() { return this.dispatch('click'); }
  focus() {}
  querySelector(selector) {
    const matches = node => selector === 'h3' ? node.tagName === 'h3' : selector.startsWith('.') && node.className.split(/\s+/).includes(selector.slice(1));
    for (const node of this.children) { if (matches(node)) return node; const nested = node.querySelector(selector); if (nested) return nested; }
    return null;
  }
}
function boot({ kind = 'evidence', runScenario = async () => { throw Error('Unexpected model execution'); } } = {}) {
  const nodes = new Map([...controllerSource.matchAll(/(?:\$|text)\('([^']+)'/g)].map(match => [match[1], new Element()]));
  const get = id => nodes.get(id) ?? null;
  get('demo-question').value = kind === 'evidence' ? 'Which career fits Alex?' : 'I mean Delta Dental specifically.';
  get('customer-current').value = 'Delta Airlines'; get('run-mode').value = 'sample'; get('model-id').value = 'claude-haiku-4-5-20251001';
  get('result-panel').append(new Element('h3'));
  const run = new Element('button'); run.dataset.run = '';
  const sourceBoxes = ['social_profile', 'project_portfolio', 'academic_record'].map(source => { const element = new Element('input'); element.dataset.source = source; return element; });
  const paneTabs = ['request', 'result', 'trail'].map(name => { const element = new Element('button'); element.dataset.paneTab = name; return element; });
  const toolTabs = ['replay', 'session'].map(name => { const element = new Element('button'); element.dataset.toolTab = name; return element; });
  const example = new Element('button'); example.dataset.example = 'Which career fits Alex?';
  const document = {
    body: { dataset: { paper: kind, pane: 'request' } }, documentElement: { dataset: { theme: 'dark' } },
    getElementById: get, createElement: tag => new Element(tag),
    querySelector: selector => selector === '[data-run]' ? run : null,
    querySelectorAll: selector => selector === '[data-source]' ? sourceBoxes : selector === '[data-pane-tab]' ? paneTabs : selector === '[data-tool-tab]' ? toolTabs : selector === '[data-example]' ? [example] : selector.startsWith('.request-pane') ? [...nodes.values(), run, ...sourceBoxes, example] : [],
  };
  const context = vm.createContext({ document, window: { addEventListener() {} }, TextEncoder, AbortController, setTimeout, clearTimeout, Blob, URL, console, MAX_BUNDLE_BYTES, __runScenario: runScenario });
  vm.runInContext('const DEFAULT_MODEL = ' + modelLiteral + '; const SOURCES = ' + sourcesLiteral + '; const runScenario = request => globalThis.__runScenario(request); const createTrail = (() => {\n' + trailSource.replace(/^export /gm, '') + '\nreturn createTrail;})();\n' + controllerSource.replace(/^import .*;\n/gm, ''), context, { filename: 'focused-browser.actual-controller.js' });
  const evaluate = expression => vm.runInContext(expression, context);
  const realm = value => evaluate('JSON.parse(' + JSON.stringify(JSON.stringify(value)) + ')');
  return { context, get, run, document, evaluate, realm };
}
const result = mode => ({ kind: 'evidence', mode, model: mode === 'sample' ? 'scripted mock provider' : 'claude-haiku-4-5-20251001', question: 'Which career fits Alex?', decision: null, answer: 'An already captured recommendation.', consulted: [], excluded: [], ranking: [], flags: [], activity: [], eventCount: 10 });
function savedLive(harness) {
  const captured = harness.realm(result('live')); harness.context.__savedResult = captured;
  return harness.evaluate("(()=>{const s={question:'Which career fits Alex?',current:'Delta Airlines',mode:'live',model:DEFAULT_MODEL,excluded:[]};const t=createTrail({kind:'evidence',initialState:viewFor('ready',s)});t.record('Saved live answer',viewFor('completed',s,{result:__savedResult,base:{question:s.question,mode:s.mode,model:s.model,excluded:[]}}));return t.exportBundle();})()");
}
const checks = [];

// A slow file read must hold the same guard as a run. Forget invalidates the
// import epoch; the stale file must not replace a newer run or unlock it.
{
  const fileRead = deferred(), pendingRun = deferred(); let calls = 0, request;
  const harness = boot({ runScenario: input => { calls++; request = input; return pendingRun.promise; } });
  harness.get('api-key').value = 'TEST-ONLY-EXISTING-KEY'; harness.get('connect-key').click();
  const saved = JSON.stringify(savedLive(harness));
  harness.get('open-session').files = [{ size: saved.length, text: () => fileRead.promise }];
  const opening = harness.get('open-session').dispatch('change');
  assert.equal(harness.evaluate('busy'), true); assert.equal(harness.run.disabled, true);
  await harness.run.click(); assert.equal(calls, 0);
  harness.get('forget-key').click();
  assert.equal(harness.evaluate('apiKey'), ''); assert.equal(harness.evaluate('busy'), false); assert.equal(harness.get('run-mode').value, 'sample');
  const running = harness.run.click(); assert.equal(calls, 1); assert.equal(harness.evaluate('busy'), true);
  fileRead.resolve(saved); await opening;
  assert.equal(harness.evaluate('busy'), true, 'stale import must not unlock the newer run');
  assert.equal(harness.evaluate('trail.state().current.phase'), 'started'); assert.equal(harness.evaluate('controller.signal.aborted'), false);
  assert.equal(request.mode, 'sample'); assert.equal(request.key, '');
  pendingRun.resolve(harness.realm(result('sample'))); await running;
  assert.equal(harness.evaluate('busy'), false); assert.equal(harness.evaluate('trail.state().current.result.mode'), 'sample');
  checks.push('deferred import locks Run; Forget clears the credential and invalidates the read; a stale file cannot replace or unlock a newer sample run');
}

// Imported live results are historical display data. They cannot silently
// activate a paid comparison baseline or switch the request controls to live.
{
  let calls = 0;
  const harness = boot({ runScenario: async () => { calls++; throw Error('Import executed a model'); } });
  harness.get('api-key').value = 'TEST-ONLY-EXISTING-KEY'; harness.get('connect-key').click();
  const saved = JSON.stringify(savedLive(harness));
  harness.get('open-session').files = [{ size: saved.length, text: async () => saved }];
  await harness.get('open-session').dispatch('change');
  assert.equal(calls, 0); assert.equal(harness.evaluate('busy'), false);
  assert.equal(harness.evaluate('trail.state().current.settings.mode'), 'live');
  assert.equal(harness.get('run-mode').value, 'sample'); assert.equal(harness.evaluate('baseline'), null); assert.equal(harness.get('compare-run').disabled, true);
  checks.push('opening recorded live output preserves its historical label while request controls select sample and its paid comparison baseline stays inactive');
}

// Fill a real validated trail to a requested byte boundary. Every state obeys
// the public schema; no fake throw-only trail is used to reach the failure.
const nearLimitSource = "(reserve)=>{const s=settings(),initial=viewFor('ready',s),big=viewFor('activity',s,{activity:Array(200).fill('x'.repeat(1000))});let base=createTrail({kind,initialState:initial});for(;;){try{base.record('Large captured screen',big);}catch(error){if(error.message!=='TRAIL_SIZE_LIMIT')throw error;break;}}const saved=base.exportBundle(),target=MAX_BUNDLE_BYTES-reserve;let low=0,high=200000,best;while(low<=high){const count=Math.floor((low+high)/2),activity=Array(Math.floor(count/1000)).fill('x'.repeat(1000));if(count%1000)activity.push('x'.repeat(count%1000));try{const trial=base.importBundle(saved);trial.record('Boundary padding',viewFor('ready',s,{activity}));const bytes=new TextEncoder().encode(JSON.stringify(trial.exportBundle())).length;if(bytes<=target){best=trial;low=count+1;}else high=count-1;}catch(error){if(error.message!=='TRAIL_SIZE_LIMIT')throw error;high=count-1;}}if(!best)throw Error('Could not construct bounded test trail');trail=best;show(trail.state().current);return new TextEncoder().encode(JSON.stringify(trail.exportBundle())).length; }";
{
  let calls = 0;
  const harness = boot({ runScenario: async () => { calls++; throw Error('Full trail started a model'); } });
  const bytes = harness.evaluate('(' + nearLimitSource + ')(0)');
  assert(bytes > 1_999_000); assert(harness.evaluate('trail.state().entries.length') < 185);
  const before = plain(harness.evaluate('trail.exportBundle()'));
  await harness.run.click();
  assert.equal(calls, 0); assert.equal(harness.evaluate('busy'), false); assert.equal(harness.evaluate('controller'), null); assert.equal(harness.run.disabled, false);
  assert.deepEqual(plain(harness.evaluate('trail.exportBundle()')), before);
  assert.match(harness.get('demo-status').textContent, /trail is full/i);
  checks.push('a genuine near-2 MB trail refusing the initial run entry makes zero model calls and always releases the busy/controller lock');
}
{
  const pending = deferred(); let request, calls = 0;
  const harness = boot({ runScenario: input => { calls++; request = input; return pending.promise; } });
  harness.get('api-key').value = 'TEST-ONLY-FORGET-MUST-CLEAR'; harness.get('connect-key').click();
  harness.evaluate('(' + nearLimitSource + ')(10000)');
  const delta = harness.evaluate("(()=>{const t=trail.importBundle(trail.exportBundle()),before=new TextEncoder().encode(JSON.stringify(t.exportBundle())).length;t.record('Run requested · live Anthropic',viewFor('started',settings()));return new TextEncoder().encode(JSON.stringify(t.exportBundle())).length-before;})()");
  harness.evaluate('(' + nearLimitSource + ')(' + (delta + 1) + ')');
  const running = harness.run.click(); assert.equal(calls, 1); assert.equal(harness.evaluate('busy'), true);
  const afterStart = plain(harness.evaluate('trail.exportBundle()'));
  harness.get('forget-key').click();
  assert.equal(request.signal.aborted, true); assert.equal(harness.evaluate('busy'), false); assert.equal(harness.evaluate('controller'), null);
  assert.equal(harness.evaluate('apiKey'), ''); assert.equal(harness.get('api-key').value, ''); assert.equal(harness.get('run-mode').value, 'sample'); assert.equal(harness.evaluate('baseline'), null);
  assert.deepEqual(plain(harness.evaluate('trail.exportBundle()')), afterStart, 'failed stop capture keeps the last valid step');
  pending.reject(new Error('Run cancelled')); await running;
  assert.equal(harness.evaluate('busy'), false); assert.equal(harness.evaluate('apiKey'), '');
  assert.match(harness.get('demo-status').textContent, /Key cleared/);
  checks.push('Forget aborts an actual pending request and clears credentials/sample-controls even when the real trail refuses its stop entry');
}

{
  const pending = deferred(); let request, calls = 0;
  const harness = boot({ runScenario: input => { calls++; request = input; return pending.promise; } });
  harness.evaluate('(' + nearLimitSource + ')(10000)');
  const delta = harness.evaluate("(()=>{const t=trail.importBundle(trail.exportBundle()),before=new TextEncoder().encode(JSON.stringify(t.exportBundle())).length;t.record('Run requested · scripted sample',viewFor('started',settings()));return new TextEncoder().encode(JSON.stringify(t.exportBundle())).length-before;})()");
  harness.evaluate('(' + nearLimitSource + ')(' + (delta + 1) + ')');
  const running = harness.run.click(); assert.equal(calls, 1);
  const afterStart = plain(harness.evaluate('trail.exportBundle()'));
  const event = harness.realm({ label: 'Model call started', eventType: 'stream.llm_start', eventIndex: 1, activity: ['Model call started'], consulted: [] });
  assert.doesNotThrow(() => request.onRecord(event));
  assert.equal(request.signal.aborted, true);
  assert.doesNotThrow(() => request.onRecord(event), 'later observer notifications are ignored after capture refusal');
  pending.reject(request.signal.reason); await running;
  assert.equal(harness.evaluate('busy'), false); assert.equal(harness.evaluate('controller'), null);
  assert.deepEqual(plain(harness.evaluate('trail.exportBundle()')), afterStart);
  assert.match(harness.get('demo-status').textContent, /trail is full/i);
  checks.push('observer capture refusal aborts the pending request, ignores later notifications and preserves the last valid state without a recursive failed-record attempt');
}

const report = { passed: true, scope: 'Actual controller and real trail executed in a Node VM; DOM and deferred provider/file interfaces are test doubles; this does not replace real-browser layout checks', checks, importedSessionRequests: 0, productTestHooksAdded: false };
console.log(JSON.stringify(report, null, 2));
if (process.env.CONTROLLER_TEST_OUTPUT) writeFileSync(process.env.CONTROLLER_TEST_OUTPUT, JSON.stringify(report, null, 2) + '\n');
