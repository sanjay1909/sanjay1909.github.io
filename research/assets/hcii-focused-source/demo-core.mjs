import { Agent, defineTool } from 'agentfootprint';
import { browserAnthropic, mock } from 'agentfootprint/llm-providers';
import { mockEmbedder } from 'agentfootprint/memory';
import { embeddingCache, llmCallIdsFromEvents, localizeContextBug } from 'agentfootprint/debug';

export const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
export const SOURCES = [
  { id: 'social_profile', label: 'Social profile', text: 'Synthetic sample: Alex posts about civic policy and community advocacy. This source suggests Policy Analyst; it is an informal interest signal, not a verified skills assessment.' },
  { id: 'project_portfolio', label: 'Project portfolio', text: 'Synthetic sample: Alex built Python data pipelines, statistical dashboards and an open-source forecasting project. This source supports Data Scientist.' },
  { id: 'academic_record', label: 'Academic record', text: 'Synthetic sample: Alex completed coursework in statistics, machine learning and database systems. This source supports Data Scientist; it contains no formal career assessment.' },
];
const contentOf = out => typeof out === 'object' && out && 'content' in out ? String(out.content) : String(out);

function classifySample(question, current) {
  const q = question.toLowerCase();
  if (/dental/.test(q) && !/delta dental|specifically|mean/.test(q)) return { action: 'clarify', customer: current, explanation: 'Dental could mean a different customer or a benefit of the current customer. Ask before switching.' };
  if (/xyz/.test(q)) return { action: 'reset', customer: 'XYZCompany', explanation: 'The message explicitly names a different customer.' };
  if (/delta dental/.test(q)) return { action: 'reset', customer: 'Delta Dental', explanation: 'The message explicitly identifies Delta Dental as the intended customer.' };
  if (/abc/.test(q)) return { action: current === 'ABCCompany' ? 'acknowledge' : 'reset', customer: 'ABCCompany', explanation: 'The message explicitly identifies ABCCompany.' };
  return { action: 'acknowledge', customer: current, explanation: 'This scripted example treats the question as a follow-up about the current customer.' };
}

// The provider owns the credential in a closure. It never enters a prompt,
// a tool result, the recorded snapshot, the event view or an exported result.
function providerFor({ mode, key, model, signal, fetchImpl, replies }) {
  if (mode === 'sample') return mock({ replies });
  if (!key) throw new Error('KEY_REQUIRED');
  let calls = 0;
  const transport = async (url, options) => {
    if (url !== 'https://api.anthropic.com/v1/messages') throw new Error('DESTINATION_REFUSED');
    if (++calls > 6) throw new Error('CALL_LIMIT');
    return (fetchImpl ?? fetch)(url, { ...options, signal, redirect: 'error' });
  };
  const live = browserAnthropic({ apiKey: key, defaultModel: model, defaultMaxTokens: 500, parallelToolCalls: false, _fetch: transport });
  // These short examples render completed answers; exposing only complete()
  // keeps recording observers from implicitly selecting the streaming path.
  return { name: live.name, complete: request => live.complete(request) };
}

export async function runScenario({ kind, mode = 'sample', key, model = DEFAULT_MODEL, question, current = 'Delta Airlines', excluded = [], signal, fetchImpl, timeoutMs = 90000, onActivity = () => {}, onRecord = () => {} }) {
  const deadline = new AbortController();
  const cancel = () => deadline.abort(signal?.reason ?? new Error('Run cancelled'));
  if (signal?.aborted) cancel();
  else signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => deadline.abort(new Error('Run timed out')), Math.max(1, Math.min(timeoutMs, 90000)));
  const runSignal = deadline.signal;
  try {
  if (runSignal.aborted) throw runSignal.reason;
  const events = [];
  const activity = [];
  const consulted = [];
  const toolNames = new Map();
  const active = SOURCES.filter(s => !excluded.includes(s.id));
  let replies;
  if (kind === 'chatbot') replies = [{ content: JSON.stringify(classifySample(question, current)) }];
  else replies = [
    ...active.map((s, i) => ({ toolCalls: [{ id: `sample-${i}`, name: s.id, args: {} }] })),
    { content: active.some(s => s.id === 'social_profile') ? 'Policy Analyst is the scripted recommendation because the social profile emphasizes civic policy. The technical portfolio and coursework also support Data Scientist. This sample is intentionally sensitive to the informal social signal.' : active.length ? 'Data Scientist is the scripted recommendation based on the remaining technical portfolio and coursework. The social-profile signal was excluded.' : 'No evidence sources are available. I cannot make an evidence-based recommendation.' },
  ];
  const provider = providerFor({ mode, key, model, signal: runSignal, fetchImpl, replies });
  const tools = kind === 'evidence' ? active.map(s => defineTool({
    name: s.id, description: `Read the ${s.label.toLowerCase()} for this fictional career-advising example.`,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () => { consulted.push({ ...s }); return s.text; },
  })) : [];
  const system = kind === 'chatbot'
    ? `Classify conversational context for an illustrative customer-search interface. The current customer is ${JSON.stringify(current)}. Return ONLY a JSON object with action (acknowledge, reset, or clarify), customer (a short name), and explanation (one short user-facing sentence). Acknowledge means continue with the current customer. Reset means the user clearly named a different intended customer. If the request is ambiguous, clarify and keep the current customer. Do not invent real customer records. Give a brief decision summary, not hidden chain-of-thought.`
    : `You demonstrate evidence inspection using fictional career-advising data. Before making a recommendation, call each available evidence tool exactly once, one at a time. Available tools: ${active.map(s => s.id).join(', ') || 'none'}. Then give a short recommendation grounded in the evidence actually returned. If no evidence is available, say so. Explain uncertainty about informal social-profile evidence. Do not claim a causal effect, a validated assessment or a real hiring outcome. Do not invent unavailable evidence.`;
  const agent = Agent.create({ provider, model: mode === 'sample' ? 'mock-1' : model, maxTokens: 500, maxIterations: 5, caching: 'off' }).system(system).tools(tools).build();
  agent.on('*', event => {
    events.push(event);
    const type = event.type;
    if (/stream\.(llm_start|tool_start|tool_end|llm_end)$/.test(type)) {
      if (type.endsWith('tool_start')) toolNames.set(event.payload?.toolCallId, event.payload?.toolName);
      const toolId = event.payload?.toolName ?? toolNames.get(event.payload?.toolCallId);
      const toolLabel = SOURCES.find(source => source.id === toolId)?.label ?? 'evidence tool';
      const label = type.endsWith('llm_start') ? 'Model call started' : type.endsWith('llm_end') ? 'Model call completed' : `${type.endsWith('tool_start') ? 'Reading' : 'Read'} ${toolLabel}`;
      activity.push(label); onActivity(label);
      onRecord({ label, eventType: type, eventIndex: events.length, consulted: consulted.map(source => ({ ...source })), activity: [...activity] });
    }
  });
  const out = await agent.run({ message: question }, { env: { signal: runSignal } });
  const answer = contentOf(out);
  let decision = null;
  if (kind === 'chatbot') {
    try { decision = JSON.parse(answer.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()); } catch { throw new Error('INVALID_DECISION'); }
    if (!decision || typeof decision !== 'object' || Array.isArray(decision) || !['acknowledge', 'reset', 'clarify'].includes(decision.action) || typeof decision.customer !== 'string' || !decision.customer.trim() || decision.customer.length > 120 || typeof decision.explanation !== 'string' || decision.explanation.length > 600) throw new Error('INVALID_DECISION');
    decision = { action: decision.action, customer: decision.action === 'reset' ? decision.customer : current, explanation: decision.explanation };
  }
  let ranking = [];
  let flags = [];
  if (kind === 'evidence') {
    const ids = llmCallIdsFromEvents(events);
    const report = await localizeContextBug({ artifacts: { snapshot: agent.getLastSnapshot(), events }, embedder: embeddingCache(mockEmbedder()), atStep: ids.at(-1) });
    flags = [...(report.honestyFlags ?? [])];
    ranking = report.suspects.filter(s => s.hasContentEvidence && s.detail?.toolName && consulted.some(x => x.id === s.detail.toolName)).map(s => ({ id: s.detail.toolName, score: s.score, content: s.detail.text, kind: 'correlational' }));
  }
  return { kind, mode, model: mode === 'sample' ? 'scripted mock provider' : model, question, decision, answer, consulted, excluded: [...excluded], ranking, flags, activity, eventCount: events.length };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}
