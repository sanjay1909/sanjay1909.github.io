import { build } from 'esbuild';
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { buildOptions, root, sourcePin } from './build-options.mjs';

const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--outfile')) throw new Error('Usage: node build.mjs [--outfile relative-or-absolute-path]');
const outfile = resolve(root, args[1] ?? '../demo.js');
mkdirSync(dirname(outfile), { recursive: true });
await build({
  ...buildOptions(), platform: 'browser',
  entryPoints: [resolve(root, 'browser/app.mjs')], outfile,
  minify: true, legalComments: 'eof',
});
for (const name of ['focus.js', 'focus.css']) copyFileSync(resolve(root, 'browser', name), resolve(dirname(outfile), name));
console.log(JSON.stringify({ sourceCommit: sourcePin.commit, sourceTreeSha256: sourcePin.sourceTreeSha256, bundleBytes: statSync(outfile).size }));
