import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { runScenario, DEFAULT_MODEL, SOURCES } from './demo-core.mjs';
import { createTrail } from './trail.mjs';

// Same captured-state boundary as focused-browser.mjs. No credential is part
// of settings, a screen snapshot, an onRecord value, or the saved UI trail.
const viewFor = (phase, settings, { result = null, activity = [], consulted = [], base = null, customer = settings.current } = {}) => ({ phase, settings: { ...settings, excluded: [...settings.excluded] }, result, activity: [...activity], consulted: consulted.map(source => ({ ...source })), liveCustomer: customer, baseline: base });
const checks = [];
const sampleFetch = async () => { throw new Error('A scripted sample unexpectedly requested a network transport'); };

async function capturedRun(kind, { mode = 'sample', question = kind === 'chatbot' ? 'I mean Delta Dental specifically.' : 'Which career fits Alex?', current = 'Delta Airlines', excluded = [], key, fetchImpl = sampleFetch } = {}) {
  const settings = { question, current, mode, model: DEFAULT_MODEL, excluded: [...excluded] };
  const trail = createTrail({ kind, initialState: viewFor('ready', settings) });
  trail.record('Run started', viewFor('started', settings));
  const captured = [];
  const result = await runScenario({ kind, ...settings, key, fetchImpl, onRecord: event => {
    const screen = viewFor('activity', settings, { activity: event.activity, consulted: event.consulted });
    const snapshot = trail.record(event.label, screen);
    captured.push({ id: snapshot.cursor, eventType: event.eventType, eventIndex: event.eventIndex, state: structuredClone(snapshot.current) });
    // Mutations outside the stored trail must not retrofit an earlier screen.
    screen.settings.question = 'MUTATED OUTSIDE SNAPSHOT';
    screen.activity.push('MUTATED OUTSIDE SNAPSHOT');
    if (screen.consulted[0]) screen.consulted[0].text = 'MUTATED OUTSIDE SNAPSHOT';
  } });
  const beforeCompletion = trail.state();
  const base = { question: settings.question, mode: settings.mode, model: settings.model, excluded: [...settings.excluded] };
  const final = trail.record('Run complete', viewFor('completed', settings, { result, activity: result.activity, consulted: result.consulted, base }));
  return { kind, settings, trail, captured, result, beforeCompletion, final };
}

const evidence = await capturedRun('evidence');
assert(evidence.captured.length > 0);
assert(evidence.captured.every(entry => entry.state.phase === 'activity' && entry.state.result === null && entry.state.baseline === null));
assert.equal(evidence.captured[0].state.consulted.length, 0);
assert.deepEqual(evidence.result.consulted.map(source => source.id), SOURCES.map(source => source.id));
const partial = evidence.captured.find(entry => entry.state.consulted.length === 1);
assert(partial, 'one-source progress must exist before all evidence has returned');
assert.deepEqual(partial.state.consulted.map(source => source.id), [SOURCES[0].id]);
assert.equal(evidence.beforeCompletion.current.result, null);
assert.equal(evidence.final.current.phase, 'completed');
assert.equal(evidence.final.current.result.answer, evidence.result.answer);
for (const entry of evidence.captured) assert.deepEqual(evidence.final.entries.find(saved => saved.id === entry.id).state, entry.state);
const progressAt = evidence.trail.seek(partial.id).current;
assert.equal(progressAt.result, null); assert.equal(progressAt.consulted.length, 1);
assert(!JSON.stringify(evidence.trail.exportBundle()).includes('MUTATED OUTSIDE SNAPSHOT'));
checks.push('actual sample evidence events preserve empty and partial source progress, keep every early result null, and publish completion in a separate entry');

const removed = await capturedRun('evidence', { excluded: ['social_profile'] });
assert.equal(removed.result.consulted.length, 2);
assert(removed.captured.every(entry => entry.state.consulted.every(source => source.id !== 'social_profile')));
assert.match(removed.result.answer, /Data Scientist/);
checks.push('real sample evidence exclusion stays excluded from all captured progress and the completed result');

const chatbot = await capturedRun('chatbot');
assert.equal(chatbot.result.decision.action, 'reset');
assert.equal(chatbot.result.decision.customer, 'Delta Dental');
assert(chatbot.captured.every(entry => entry.state.result === null && entry.state.consulted.length === 0));
const completedCustomerId = chatbot.final.cursor;
const old = chatbot.trail.state().current;
const customer = chatbot.result.decision.customer;
const applied = chatbot.trail.record('Customer switch applied', { ...old, phase: 'applied', settings: { ...old.settings, current: customer }, liveCustomer: customer });
assert.equal(applied.current.liveCustomer, 'Delta Dental');
assert.equal(chatbot.trail.seek(completedCustomerId).current.liveCustomer, 'Delta Airlines');
assert.equal(chatbot.trail.seek(applied.cursor).current.liveCustomer, 'Delta Dental');
checks.push('actual chatbot decisions and applied customer changes reopen independently; seeking before Apply restores the previous fictional customer');

const TEST_KEY = 'TEST-ONLY-FAKE-CAPTURE-CREDENTIAL';
let liveCalls = 0;
const fakeTransport = async (url, options) => {
  liveCalls++;
  assert.equal(url, 'https://api.anthropic.com/v1/messages');
  assert.equal(options.headers['x-api-key'], TEST_KEY);
  assert.equal(options.redirect, 'error');
  assert(!options.body.includes(TEST_KEY));
  const body = JSON.parse(options.body);
  const used = body.messages.filter(message => Array.isArray(message.content)).flatMap(message => message.content.filter(content => content.type === 'tool_result').map(content => content.tool_use_id));
  const next = (body.tools ?? [])[used.length];
  const content = next
    ? [{ type: 'tool_use', id: 'fake-tool-' + liveCalls, name: next.name, input: {} }]
    : [{ type: 'text', text: 'Data Scientist is supported by the consulted portfolio and coursework.' }];
  return new Response(JSON.stringify({ id: 'fake-message-' + liveCalls, type: 'message', role: 'assistant', model: body.model, content, stop_reason: next ? 'tool_use' : 'end_turn', usage: { input_tokens: 12, output_tokens: 10 } }), { status: 200, headers: { 'content-type': 'application/json' } });
};
const live = await capturedRun('evidence', { mode: 'live', key: TEST_KEY, fetchImpl: fakeTransport });
assert.equal(liveCalls, 4);
assert.equal(live.result.consulted.length, 3);
const liveBundle = live.trail.exportBundle();
assert(!JSON.stringify(liveBundle).includes(TEST_KEY));
assert(!JSON.stringify(liveBundle).includes('apiKey'));
assert(!JSON.stringify(liveBundle).includes('x-api-key'));
checks.push('actual browser Anthropic provider uses the test credential only in its fake transport header; captured UI/results/exports contain no credential');

let chatbotLiveCalls = 0;
const liveChatbot = await capturedRun('chatbot', { mode: 'live', key: TEST_KEY, fetchImpl: async (url, options) => {
  chatbotLiveCalls++;
  assert.equal(options.headers['x-api-key'], TEST_KEY);
  return new Response(JSON.stringify({ id: 'chatbot-live', type: 'message', role: 'assistant', model: DEFAULT_MODEL, content: [{ type: 'text', text: JSON.stringify({ action: 'reset', customer: 'Delta Dental', explanation: 'Explicit customer requested.', extraModelField: 'not a decision-schema field' }) }], stop_reason: 'end_turn', usage: { input_tokens: 12, output_tokens: 10 } }), { status: 200, headers: { 'content-type': 'application/json' } });
} });
assert.equal(chatbotLiveCalls, 1);
assert.deepEqual(Object.keys(liveChatbot.result.decision).sort(), ['action', 'customer', 'explanation']);
assert(!JSON.stringify(liveChatbot.trail.exportBundle()).includes(TEST_KEY));
checks.push('live chatbot decision normalization admits only the three supported decision fields before capture');

const callsBeforeReplay = liveCalls + chatbotLiveCalls;
const fetchBeforeReplay = globalThis.fetch;
let replayFetches = 0;
globalThis.fetch = async () => { replayFetches++; throw new Error('Replay attempted a network request'); };
try {
  for (const run of [evidence, chatbot, live, liveChatbot]) {
    const reopened = run.trail.importBundle(JSON.stringify(run.trail.exportBundle()));
    assert.deepEqual(reopened.state(), run.trail.state());
    for (const entry of reopened.state().entries) assert.deepEqual(reopened.seek(entry.id).current, entry.state);
    reopened.switchPath('main');
    const reopenedAgain = reopened.importBundle(reopened.exportBundle());
    assert.deepEqual(reopenedAgain.state(), reopened.state());
  }
} finally { globalThis.fetch = fetchBeforeReplay; }
assert.equal(liveCalls + chatbotLiveCalls, callsBeforeReplay);
assert.equal(replayFetches, 0);
checks.push('importing and playing every recorded UI position makes zero new provider/network calls and preserves cloned historical states');

const summarize = run => ({ kind: run.kind, mode: run.settings.mode, progressEntries: run.captured.length, progressConsultedCounts: [...new Set(run.captured.map(entry => entry.state.consulted.length))], rawAgentEventCount: run.result.eventCount, completedEntry: run.final.cursor, sourceCount: run.result.consulted.length, rankingCount: run.result.ranking.length, honestyFlags: run.result.flags.map(flag => flag.flag) });
const report = { passed: true, semantics: 'Captured UI and execution-event playback, not a native runtime resume or a model re-execution', agentfootprintVersion: process.env.TEST_AGENTFOOTPRINT_VERSION ?? 'not supplied', footprintjsVersion: process.env.TEST_FOOTPRINTJS_VERSION ?? 'not supplied', esbuildVersion: process.env.TEST_ESBUILD_VERSION ?? 'not supplied', checks, sampleEvidence: summarize(evidence), sampleChatbot: summarize(chatbot), fakeLiveEvidence: summarize(live), fakeLiveChatbot: summarize(liveChatbot), fakeLiveRequests: liveCalls + chatbotLiveCalls, replayRequests: replayFetches, credentialIncludedInExports: false };
console.log(JSON.stringify(report, null, 2));
if (process.env.CAPTURE_TEST_OUTPUT) writeFileSync(process.env.CAPTURE_TEST_OUTPUT, JSON.stringify(report, null, 2) + '\n');
