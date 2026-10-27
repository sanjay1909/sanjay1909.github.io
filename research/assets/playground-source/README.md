# Paper playgrounds

Later illustrative examples for the two HCII papers. These use the public libraries rather than reproducing the papers’ original experiments.

- AgentFootprint 7.7.0
- FootPrint 9.11.0
- Zod 4.4.3
- esbuild 0.28.1 (build tool)

To rebuild from this folder with Node.js 20.6 or newer:

```sh
npm install --no-save agentfootprint@7.7.0 footprintjs@9.11.0 zod@4.4.3 esbuild@0.28.1
node build.mjs
```

The output is `../playground.js`. Serve the website through a static HTTP server; ES modules do not run correctly when opened as local files. The build script provides throwing stubs for Node-only adapters, following the browser reference implementation. The browser provider uses `fetch` directly.

Sample mode runs the library with scripted model replies and synthetic tool outputs. Live mode uses the visitor’s Anthropic key, held only in tab memory; the key goes only to `https://api.anthropic.com/v1/messages`, with redirects refused. Neither key nor raw request headers are included in run exports.

Evidence scores use the library’s deterministic mock embedder. A single paired rerun is an observation, not proof of causality. Original Bedrock/Titan experiments and participant data are not included.

The library code is MIT-licensed; see [third-party notices](../THIRD-PARTY-NOTICES.txt). Paper figures and abstracts remain attributed to the original papers.
