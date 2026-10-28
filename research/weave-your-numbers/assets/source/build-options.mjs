import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = dirname(fileURLToPath(import.meta.url));
const pin = JSON.parse(readFileSync(join(root, 'vizfootprint-source-pin.json'), 'utf8'));

function sourceTreeSha256(directory) {
  const names = [];
  const walk = (path, prefix = '') => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const relative = prefix + entry.name;
      if (entry.isDirectory()) walk(join(path, entry.name), `${relative}/`);
      else if (entry.isFile()) names.push(relative);
      else throw new Error('The pinned source tree must contain regular files and directories only.');
    }
  };
  walk(directory);
  const hash = createHash('sha256');
  for (const name of names.sort()) {
    const bytes = readFileSync(join(directory, name));
    hash.update(name).update('\0').update(String(bytes.length)).update('\0').update(bytes);
  }
  return hash.digest('hex');
}

export function buildOptions() {
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Use Node.js 24 or later for this source package.');
  const library = resolve(root, '.vendor/vizfootprint/src');
  if (!existsSync(library)) throw new Error('Clone and check out the pinned VizFootprint source in .vendor/vizfootprint as described in README.md.');
  if (sourceTreeSha256(library) !== pin.sourceTreeSha256) throw new Error(`VizFootprint source differs from pinned commit ${pin.commit}. Check the checkout and remove local changes.`);
  const dependencies = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).dependencies;
  for (const [name, version] of Object.entries(dependencies)) {
    const installed = JSON.parse(readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8'));
    if (installed.version !== version) throw new Error(`Expected ${name} ${version}; run npm ci.`);
  }
  return {
    bundle: true, format: 'esm', target: 'es2022', sourcemap: false,
    external: ['@duckdb/duckdb-wasm'],
    nodePaths: [resolve(root, 'node_modules')],
    alias: {
      'vizfootprint/def': resolve(library, 'def/index.ts'),
      'vizfootprint/data': resolve(library, 'data/index.ts'),
    },
  };
}

export const sourcePin = Object.freeze(pin);
