import { build } from 'esbuild';
import { resolve } from 'node:path';
import { buildOptions, root } from '../../build-options.mjs';
// Keep the bundle beside its entry so ../../data remains the fixture URL.
await build({ ...buildOptions(), platform: 'node', entryPoints: [resolve(root, 'tests/runtime/integration.mjs')], outfile: resolve(root, 'tests/runtime/integration.bundle.mjs'), logLevel: 'warning' });
