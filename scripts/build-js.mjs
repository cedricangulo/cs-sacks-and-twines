import * as esbuild from 'esbuild';
import { readdir, stat, writeFile, unlink } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
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
let startTime = Date.now();

const options = {
  entryPoints: entryFiles,
  bundle: true,
  format: 'esm',
  outdir: OUT_DIR,
  outbase: JS_DIR,
  sourcemap: true,
  metafile: true,
  plugins: [{
    name: 'reload-plugin',
    setup(build) {
      build.onEnd(async (result) => {
        console.log('--- PLUGIN FIRED, errors:', result.errors.length);
        if (result.errors.length > 0) {
          console.error('Build errors:', result.errors);
          return;
        }

        const duration = Date.now() - startTime;
        try {
          console.log('CWD:', process.cwd());
          const outPath = join(process.cwd(), 'public', 'dist', 'latest.json');
          console.log('Writing to:', outPath);
          writeFileSync(outPath, JSON.stringify({ t: Date.now() }));
        } catch (e) {
          console.error('Failed to write latest.json:', e.message);
          return;
        }

        console.log(`\n[${new Date().toLocaleTimeString()}] Rebuild complete (${duration}ms)`);

        if (result.metafile) {
          const outputs = result.metafile.outputs;
          Object.keys(outputs).forEach(file => {
            if (file.endsWith('.js')) {
              console.log(`  \x1b[34m${file.padEnd(45)}\x1b[0m \x1b[32m${formatSize(outputs[file].bytes)}\x1b[0m`);
            }
          });
        }

        startTime = Date.now();
      });
    },
  }],
};

async function runBuild() {
  startTime = Date.now();
  if (isWatch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    writeFileSync(join(process.cwd(), 'public', 'dist', 'latest.json'), JSON.stringify({ t: Date.now() }));
    await esbuild.build(options);
    console.log('\nWatching for changes... (Ctrl+C to stop)');
    // Handle manual exit (Ctrl+C) to prevent zombie processes
    process.on('SIGINT', async () => {
      console.log('\nStopping watcher...');
      try { await unlink(join(OUT_DIR, 'latest.json')); } catch {}
      await ctx.dispose();
      process.exit(0);
    });
    await new Promise(() => { });
  } else {
    await esbuild.build(options);
    console.log('Done.');
  }
}

runBuild();
