# Agent Instructions

This is a vanilla PHP MVC-style app styled with Tailwind CSS v4 and Basecoat. It is designed to run from a subfolder install, so generated URLs must stay base-path aware.

## Agent Quick Reference
- **Package manager**: `pnpm` (see `package.json` scripts)
- **Common build commands**: `pnpm run build:css`, `pnpm run build:js`, `pnpm run build`, `pnpm run watch`.
- **Entry point**: [index.php](index.php) — boots [app/core/bootstrap.php](app/core/bootstrap.php).
- **Routing**: [app/config/routes/web.php](app/config/routes/web.php), [app/config/routes/api.php](app/config/routes/api.php), merged by [app/core/routes.php](app/core/routes.php).
- **JS source**: `public/js/` (feature folders) → built by `scripts/build-js.mjs` to `public/dist/`.
- **CSS**: `public/css/input.css` → built by Tailwind to `public/css/output.css`.
- **DB schema & migrations**: [docs/schema.sql](docs/schema.sql), [docs/migrations/](docs/migrations/).
- **Quick agent checklist**: link to docs first; avoid duplicating docs; use `routeUrl()` for subfolder-safe links.

## Start Here
- Read [docs/ROUTING.md](docs/ROUTING.md), [docs/FORMS.md](docs/FORMS.md), [docs/JS-BUILD.md](docs/JS-BUILD.md), and [docs/RUBRICS.md](docs/RUBRICS.md) before changing routing, forms, or client-side behavior.
- Check [docs/data-dictionary.md](docs/data-dictionary.md) for database definitions and [docs/JS-CODES.md](docs/JS-CODES.md) for `@code` tracker block conventions used to map JS functions.
- Prefer linking to those docs instead of repeating their contents here.

## Build & Run
- Use `pnpm run build:css` for production CSS and `pnpm run watch:css` while editing Tailwind classes.
- Use `pnpm run build:js` or `pnpm run watch:js` for the bundled client scripts.
- `pnpm run build` runs both CSS and JS builds.

## Database Setup
- Schema is in [docs/schema.sql](docs/schema.sql) - run this to create tables.
- Migrations are in [docs/migrations/](docs/migrations/) - apply in date order.
- Database connection is in [app/core/db.php](app/core/db.php) (PDO).
- Configure via environment variables: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, or `DB_DSN`.

## Routing & Layout
- All requests enter through `index.php`, which boots `app/core/bootstrap.php`, resolves the route, and renders the correct shell.
- Route metadata lives in [app/config/routes/web.php](app/config/routes/web.php) and [app/config/routes/api.php](app/config/routes/api.php), then merges through [app/core/routes.php](app/core/routes.php).
- Routes must explicitly define `'type' => 'web'` (rendered with layout shells) or `'type' => 'api'` (returns JSON).
- Navigation configurations (icons, labels, groups) live directly inside a `'nav'` array block within the route's definition in `web.php`.
- Use `routeUrl('/path')` from [app/core/path.php](app/core/path.php) for every frontend link and asset path that needs to work in a subfolder install.
- Put page-specific views in `app/views/pages/{route}/index.php` and shared chrome in `app/views/layout/`.
- Controllers may return arrays for view data or short-circuit with JSON responses and redirects.

## Roles & Access
- `owner` - full access to all pages including users, audit-logs, suppliers, reports
- `staff` - limited access (products, inventory, personal audit-logs)
- `guest` - sign-in page only
- RBAC is enforced in index.php based on route metadata `roles` array.

## Forms & Client Scripts
- Follow the field-level error pattern in [docs/FORMS.md](docs/FORMS.md): one general error alert plus per-field error slots, except sign-in which stays general-only.
- Client code lives under `public/js/{feature}/index.js` and is bundled to `public/dist/` by esbuild. Shared helpers belong in `public/js/utils/`.
- Use the existing fetch flow: `fetchJson(...)` for JSON endpoints, `FormData` for submissions, `credentials: 'same-origin'`, and the `X-Requested-With: fetch` header where the app already uses it.
- Validate form input client-side with the shared Zod schemas in `public/js/utils/validation.js`, then validate again on the server.

## Security & PHP Conventions
- Prefix custom helpers in `app/core/` with `app_`.
- Use `require_once __DIR__ . '/...'` for nested includes.
- Use `<?= ... ?>` in views and `htmlspecialchars(..., ENT_QUOTES, 'UTF-8')` for output that can contain user data.
- **Passwords**: Always use `password_hash()` (`PASSWORD_DEFAULT`) and `password_verify()`. Hashes are `VARCHAR(255)`.
- Use prepared statements (PDO) and keep controllers responsible for validation, orchestration, and response shape.
- **DB Injection**: Instantiate models by passing the PDO singleton: `new ModelName(app_db());`. Models do not hold static connections.
- **Filtering & Lists**: Always use `QueryFilter` (`app/core/QueryFilter.php`) for paginated, searchable data grids instead of raw LIMIT/OFFSET.
- **Validation**: Perform validation directly in controllers (type checking, length validation) and return explicit HTTP failure codes (e.g. 422). Do not pull in heavy external validation packages. Never trust frontend validation.
- **File Uploads**: Delegate all upload processing and moving to helpers in `app/core/uploads.php`. Ensure whitelist validations for extensions and proper `.htaccess` setup in upload dirs (`php_flag engine off`).

## Quality Bar
- Follow [docs/RUBRICS.md](docs/RUBRICS.md) for CRUD, async, and CSS expectations.
- Keep logic out of views when a controller or model can own it.
- Prefer small, convention-matching edits over introducing new patterns unless the feature clearly needs one.