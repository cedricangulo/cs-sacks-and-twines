# Agent Instructions

This project is a custom, vanilla PHP MVC-like application styled with Tailwind CSS v4. It is designed to run in a local subfolder environment (e.g., XAMPP under `htdocs`).

## Build & Run Commands
- **CSS Build**: Run `pnpm run build:css` to build the Tailwind output for production.
- **CSS Watch**: Run `pnpm run watch:css` to actively watch for Tailwind classes during development.

## Architecture & Routing Conventions
- **Single Entry Point**: All traffic routes through `index.php` at the project root, which handles the main layout wrapper (`head`, `sidebar`, `nav`, and `footer`).
- **Route Configuration**: Routes are explicitly mapped in [`app/config/routes.php`](app/config/routes.php). When adding a new page, add a definition here containing its `title`, `icon`, `roles`, and the corresponding `view` path.
- **Path Resolution**: The project supports subfolder installations. **Always** use the `routeUrl('/path')` helper function defined in [`app/core/path.php`](app/core/path.php) when generating links in the frontend so they resolve correctly regardless of the base path.
- **Views**: UI components and page logic specific to routes should be placed in `app/views/pages/{route}/index.php`. Keep logic inside views minimal.
- **Layouts**: Global UI fragments are maintained in `app/views/layout/`.

## Styling
- **Tailwind v4**: The project uses the new Tailwind CSS v4 CLI. Input CSS is located at `public/css/input.css` and compiled to `public/css/output.css`.
- Base coat library (`basecoat.cdn.min.css` / `basecoat.cdn.min.js`) is used alongside Tailwind.

## PHP Conventions
- Prefix custom framework functions in `app/core/` with `app_` (e.g., `app_base_path`, `app_current_route`).
- Use `<?= ... ?>` shorthand for echoing variables in views. 
- Ensure proper use of `require_once __DIR__ . '/...'` to avoid broken paths when including nested PHP files.

## Quality & Grading Criteria
When generating or modifying code, always adhere to the project's grading criteria defined in [docs/RUBRICS.md](docs/RUBRICS.md). 
Key requirements include:
- **CRUD**: Full validation, security (prepared statements, sanitization), and organized UI.
- **Async**: Robust error handling, loading states, and proper AJAX integration.
- **CSS**: Full responsiveness and extensive component usage using Tailwind CSS v4.