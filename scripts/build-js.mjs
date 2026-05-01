import * as esbuild from 'esbuild';
import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { statSync, readdirSync } from 'node:fs';

const JS_DIR = 'public/js';
const OUT_DIR = 'public/dist';

async function getEntryFiles() {
  const entries = [];
  const items = await readdir(JS_DIR);

  for (const item of items) {
    const indexPath = join(JS_DIR, item, 'index.js');

    try {
      const s = await stat(indexPath);
      if (s.isFile()) {
        entries.push(indexPath);
      }
    } catch {
      // no index.js in this folder, skip
    }
  }

  return entries;
}

function formatSize(bytes) {
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(1)}kb` : `${(kb / 1024).toFixed(2)}mb`;
}

function printOutput() {
  const walk = (dir) => {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, name.name);
      if (name.isDirectory()) {
        walk(full);
      } else if (name.name.endsWith('.js')) {
        const rel = relative(process.cwd(), full);
        const size = statSync(full).size;
        console.log(`  ${rel.padEnd(40)} ${formatSize(size)}`);
      }
    }
  };
  walk(OUT_DIR);
  console.log();
}

const entryFiles = await getEntryFiles();

if (entryFiles.length === 0) {
  console.error('No entry files found in public/js/*/index.js');
  process.exit(1);
}

console.log(`Bundling ${entryFiles.length} entries...\n`);

const isWatch = process.argv.includes('--watch');
const base = {
  entryPoints: entryFiles,
  bundle: true,
  format: 'esm',
  outdir: OUT_DIR,
  outbase: JS_DIR,
  sourcemap: true,
};

if (isWatch) {
  const ctx = await esbuild.context(base);
  await ctx.rebuild();
  printOutput();
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build(base);
  printOutput();
  console.log('Done.');
}
