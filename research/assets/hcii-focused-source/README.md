# HCII focused research playgrounds

Browser companions to **Visible Reasoning: User-Facing Decision Transparency for Generative AI Systems** (HCII 2026) and **Bridging UI Design and Chatbot Interactions: Applying Form-Based Principles to Conversational Agents** (HCII 2025).

Each dashboard has a request pane, an evidence or decision pane, and an exploration history. Both start in scripted sample mode. Live Anthropic mode is optional and requires the visitor’s own key and an explicit run action.

## Rebuild the website bundle

Use Node.js 20.6 or newer and npm. Clone the website so the paper pages, shared fonts, images and dashboard HTML are present:

```sh
git clone https://github.com/sanjay1909/sanjay1909.github.io.git
cd sanjay1909.github.io/research/assets/hcii-focused-source
npm ci
npm test
npm run build
cd ../../..
python3 -m http.server 4173
```

Open either dashboard:

- `http://localhost:4173/research/visible-reasoning/demo/`
- `http://localhost:4173/research/bridging-ui-chatbot-interactions/demo/`

The build writes `research/assets/focused-playground.js` and copies this folder’s `hcii-focus.css` to `research/assets/hcii-focus.css`. It uses local npm dependencies and no machine-specific paths. Serving the whole website preserves the dashboards’ relative links. The existing paper HTML, figures, abstracts and citations remain separate from the interactive bundle.

## Exact dependency versions

| Package | Version | Role |
| --- | --- | --- |
| `agentfootprint` | 7.7.0 | Agent execution, typed events and evidence inspection |
| `footprintjs` | 9.11.0 | Execution substrate used by this AgentFootprint version |
| `zod` | 4.4.3 | Compatible schema peer dependency |
| `esbuild` | 0.28.1 | Browser bundling |

`package-lock.json` pins the registry artifacts and integrity values, including esbuild’s platform packages. These intentionally fixed versions describe this companion; capabilities of newer library releases should be checked separately. Dependency license notices are in `licenses/`.

## Source files

- `demo-core.mjs`: sample/live providers, fictional scenario tools, structured decisions and recorded evidence.
- `focused-browser.mjs`: dashboard controls, key handling, captured-state history and replay.
- `trail.mjs`: bounded history, branches, cursor navigation, saved-session export and validation.
- `hcii-focus.css`: desktop panes and mobile layout.
- `test-demo.mjs`: scenario, evidence exclusion, credential-boundary and mocked live-transport checks.
- `test-trail.mjs`: history, branching, import/export and invalid-session checks.
- `test-capture-trail.mjs`: actual agent/core and trail integration, partial evidence capture, completed outputs and credential-free replay.
- `test-controller.mjs`: the unchanged controller and real trail executed in a Node VM, with DOM, provider and file interfaces represented by test doubles. It checks deferred imports, live-history handling, bounded trails, cancellation and observer-abort races. It complements real-browser layout checks.
- `build.mjs`: a portable browser build with guards for unused Node-only adapter paths.

The tests use scripted responses or a fake transport. They make no paid model calls and require no API key.
The deadline test deliberately triggers a provider timeout, so an expected runtime diagnostic can appear while all four test files pass.

## What execution and replay mean here

The sample provider returns scripted replies while the actual AgentFootprint agent executes and emits runtime events. The evidence example consults fictional source tools and calculates illustrative alignment with a deterministic mock embedder. These scores are correlational signals. The simplified sample classifier illustrates acknowledgment, clarification and explicit customer switching.

The exploration trail captures request settings, displayed results, selected execution-event progress and fictional customer-session changes. Time travel and replay restore those captured UI states. They do not resume an AgentFootprint agent, replay a FootPrint transaction log, call a model or rerun tools. The saved display history is distinct from the full internal agent recording.

Navigating to an earlier state and making a new run or session change retains an alternative exploration path. Opening or replaying a saved live history does not restore credentials or arm a paid run: request mode returns to the scripted sample. A visitor must explicitly choose live mode and supply their own key for a new live request.

Saved-session validation checks the supported structure, scenario kind and size bounds. It is not a signature or independent proof that imported interactions occurred. Inputs and outputs in a downloaded session are the content supplied or captured by that session.

## Live mode and credentials

The dedicated API-key field is held in this tab’s memory. The provider sends it only as a request credential to `https://api.anthropic.com/v1/messages`; it is excluded from prompts, captured states and run/session exports. Forgetting the key or reloading clears it. There is no automatic model call on load, import, time travel or replay.

Live runs send the question and selected fictional evidence, or the fictional customer context, to Anthropic using the visitor’s API account. Each run has a six-request ceiling, a 500-output-token ceiling per request and a 90-second deadline. A comparison is a separate run. A request already sent may still be billed after cancellation. Model availability depends on the account. Questions and model outputs are included in captured sessions; use the supplied fictional examples when sharing a session publicly.

## Research scope and citations

These are later illustrative implementations, separate from the original papers’ experimental systems. They do not reproduce the HCII participant studies or validate a career recommendation. No real customer, hiring or booking service is connected. Source removal followed by one live rerun can reveal a changed answer; it alone does not establish a causal effect.

The original abstracts, figures, scope notes and BibTeX citations are on the [Visible Reasoning paper page](../../visible-reasoning/) and the [Bridging UI and Chatbot Interactions paper page](../../bridging-ui-chatbot-interactions/). Cite the relevant paper for its research contribution and identify the pinned software versions when describing this companion.
