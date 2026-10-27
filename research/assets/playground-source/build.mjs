import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
await build({ entryPoints: [resolve(here, 'demo-browser.mjs')], outfile: resolve(here, '../playground.js'), bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, legalComments: 'eof', plugins: [{ name: 'browser-node-guard', setup(builder) { builder.onResolve({ filter: /^node:(module|path|url)$/ }, args => ({ path: args.path, namespace: 'node-guard' })); builder.onLoad({ filter: /.*/, namespace: 'node-guard' }, args => {
  if (args.path === 'node:module') return { contents: 'export const createRequire = () => name => { throw new Error(`Node-only adapter unavailable in browser: ${name}`); };', loader: 'js' };
  if (args.path === 'node:path') return { contents: 'export const dirname = () => { throw new Error("Node-only path operation"); }; export const join = dirname; export const resolve = dirname;', loader: 'js' };
  if (args.path === 'node:url') return { contents: 'export const fileURLToPath = () => { throw new Error("Node-only URL operation"); };', loader: 'js' };
  throw new Error(`Unexpected Node dependency: ${args.path}`);
}); } }] });
