# JavaScript Build System

This app uses esbuild to bundle client-side JavaScript into single files per page. This eliminates the hundreds of HTTP requests caused by importing Zod and other modules directly in the browser.

## File Layout

- `scripts/build-js.mjs` — auto-discovers `public/js/*/index.js` entry points and bundles them
- `public/js/` — source code (write here)
- `public/dist/` — bundled output (read-only, generated)

## Entry Point Convention

Each page has **one** entry file named `index.js` inside a folder under `public/js/`:

```
public/js/
  inventory/
    index.js        ← entry point for inventory page
    submit.js       ← imported by index.js
    get-products.js ← imported by index.js
    ...
  suppliers/
    index.js        ← entry point for suppliers page
    ...
  users/
    index.js        ← entry point for users page
    ...
  utils/
    validation.js   ← shared helper, NOT an entry point
    fetch-utils.js  ← shared helper, NOT an entry point
```

The build script scans `public/js/*/index.js` and bundles each one. All imports (including helpers, validation, Zod) are followed automatically.

**To add a new page:**

1. Create `public/js/audit-logs/index.js`
2. Import whatever helpers or submit logic you need
3. Run `pnpm run build:js`
4. Reference the output in your view:

```html
<script type="module" src="<?= htmlspecialchars(routeUrl('/public/dist/audit-logs/index.js'), ENT_QUOTES, 'UTF-8') ?>"></script>
```

No changes to the build script are needed.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm run build:js` | Bundle all entry files once |
| `pnpm run watch:js` | Watch mode — rebuilds on any change |
| `pnpm run build` | Full build (CSS + JS) |
| `pnpm run watch` | Watch both CSS and JS |

## Output

Each entry file produces one `.js` bundle and one `.map` sourcemap in `public/dist/` under the same folder name:

```
public/dist/
  inventory/index.js      ← bundled inventory page (includes Zod)
  suppliers/index.js      ← bundled suppliers page (includes Zod)
  users/index.js          ← bundled users page (includes Zod)
```

## Why Not Browser Native Imports?

Importing Zod directly from `node_modules` in the browser (`<script type="module">`) triggers **hundreds** of individual HTTP requests as the browser resolves the full import graph. In this project that alone took ~2.6s. Esbuild collapses the entire dependency tree into one file per page, resolving it in <100ms.

## Zod Import

Source files import Zod by package name — esbuild resolves it:

```js
import { z } from 'zod';
```

Do **not** use absolute `node_modules` paths in source files.
