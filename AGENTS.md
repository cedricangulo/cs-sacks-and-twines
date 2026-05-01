# Agent Instructions

This is a vanilla PHP MVC-style app styled with Tailwind CSS v4 and Basecoat. It is designed to run from a subfolder install, so generated URLs must stay base-path aware.

## Start Here
- Read [docs/ROUTING.md](docs/ROUTING.md), [docs/FORMS.md](docs/FORMS.md), [docs/JS-BUILD.md](docs/JS-BUILD.md), and [docs/RUBRICS.md](docs/RUBRICS.md) before changing routing, forms, or client-side behavior.
- Prefer linking to those docs instead of repeating their contents here.

## Build & Run
- Use `pnpm run build:css` for production CSS and `pnpm run watch:css` while editing Tailwind classes.
- Use `pnpm run build:js` or `pnpm run watch:js` for the bundled client scripts.
- `pnpm run build` runs both CSS and JS builds.

## Routing & Layout
- All requests enter through `index.php`, which boots `app/core/bootstrap.php`, resolves the route, and renders the correct shell.
- Route metadata lives in [app/config/routes/web.php](app/config/routes/web.php) and [app/config/routes/api.php](app/config/routes/api.php), then merges through [app/config/routes.php](app/config/routes.php).
- Use `routeUrl('/path')` from [app/core/path.php](app/core/path.php) for every frontend link and asset path that needs to work in a subfolder install.
- Put page-specific views in `app/views/pages/{route}/index.php` and shared chrome in `app/views/layout/`.
- Controllers may return arrays for view data or short-circuit with JSON responses and redirects.

## Forms & Client Scripts
- Follow the field-level error pattern in [docs/FORMS.md](docs/FORMS.md): one general error alert plus per-field error slots, except sign-in which stays general-only.
- Client code lives under `public/js/{feature}/index.js` and is bundled to `public/dist/` by esbuild. Shared helpers belong in `public/js/utils/`.
- Use the existing fetch flow: `fetchJson(...)` for JSON endpoints, `FormData` for submissions, `credentials: 'same-origin'`, and the `X-Requested-With: fetch` header where the app already uses it.
- Validate form input client-side with the shared Zod schemas in `public/js/utils/validation.js`, then validate again on the server.

## PHP Conventions
- Prefix custom helpers in `app/core/` with `app_`.
- Use `require_once __DIR__ . '/...'` for nested includes.
- Use `<?= ... ?>` in views and `htmlspecialchars(..., ENT_QUOTES, 'UTF-8')` for output that can contain user data.
- Use prepared statements in models and keep controllers responsible for validation, orchestration, and response shape.

## Quality Bar
- Follow [docs/RUBRICS.md](docs/RUBRICS.md) for CRUD, async, and CSS expectations.
- Keep logic out of views when a controller or model can own it.
- Prefer small, convention-matching edits over introducing new patterns unless the feature clearly needs one.