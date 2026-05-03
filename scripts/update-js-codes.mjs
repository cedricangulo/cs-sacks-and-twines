import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

const root = path.join(__dirname, '..', 'public', 'js');
const jsFiles = walk(root).filter((file) => file.endsWith('.js') && !file.endsWith('.min.js'));

const codes = [];
for (const file of jsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /@code\s+([A-Za-z0-9-]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const relativePath = path.relative(process.cwd(), file).replace(/\\/g, '/');
    codes.push({ code: match[1], file: relativePath });
  }
}

codes.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

const lines = [
  '# JavaScript Function Codes',
  '',
  "This file indexes all JavaScript functions by their `@code` tag for easy reference. Search by code (e.g., `VAL-supplier`) to find functions quickly.",
  '',
  '## Code Reference',
  '',
  '| Code                          | File                                              |',
  '|-------------------------------|---------------------------------------------------|'
];

for (const { code, file } of codes) {
  const pad = ' '.repeat(30 - code.length);
  lines.push('| ' + code + pad + '| `' + file + '` |');
}

fs.writeFileSync('docs/JS-CODES.md', lines.join('\n'));
console.log('Updated docs/JS-CODES.md');