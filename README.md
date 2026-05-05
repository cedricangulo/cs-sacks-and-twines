# Sacks & Twines

A vanilla PHP MVC inventory system for sacks and twines, styled with Tailwind CSS v4 and Basecoat. The app is designed to run from a subfolder install, so links and asset URLs must stay base-path aware.

## Requirements

- PHP 8.2+ with PDO enabled
- MySQL or MariaDB
- Node.js 18+ with `pnpm`
- XAMPP or another local PHP web server for Windows

## Installation

1. Place the project in your web root.
   - Example: `C:\xampp\htdocs\cs-sacks-and-twines`
2. Start Apache and MySQL in XAMPP.
3. Open a terminal in the project root.
4. Install the frontend dependencies:

```bash
pnpm install
```

5. Create the database.
   - Recommended database name: `sacks_and_twines_inventory`
6. Import the schema file into MySQL/MariaDB:

```sql
/docs/schema.sql
```

7. If you need initial data, apply the migration files in `docs/migrations/` in date order.
8. Configure the database connection using environment variables or your local server setup:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_DSN`
9. If you are running the app in a subfolder, keep the base path consistent with your install path.
   - Example URL: `http://localhost/cs-sacks-and-twines`

## Running the App

- Open the site through your local web server, not by opening PHP files directly.
- The front controller is [`public/index.php`](public/index.php), which boots [`app/core/bootstrap.php`](app/core/bootstrap.php).
- The root [`.htaccess`](.htaccess) forwards requests into `/public` so URLs do not include `/public`.
- Main routing lives in [`app/config/routes/web.php`](app/config/routes/web.php) and [`app/config/routes/api.php`](app/config/routes/api.php).

## Build Commands

```bash
pnpm run build:css
pnpm run build:js
pnpm run build
pnpm run watch:css
pnpm run watch:js
pnpm run watch
```

- `build:css` compiles `public/css/input.css` to `public/css/output.css`
- `build:js` bundles feature scripts from `public/js/` into `public/dist/`
- `build` runs both CSS and JS builds
- `watch` runs both watchers during development

## Project Structure

- [`app/`](app/) - controllers, models, core helpers, routes, and views
- [`public/`](public/) - front controller, built CSS/JS, uploaded files, and static assets
- [`docs/`](docs/) - schema, migrations, rubrics, and implementation notes
- [`scripts/`](scripts/) - build scripts and utility tooling

## Security and Conventions

- Use [`routeUrl()`](app/core/path.php) for links and asset paths so the app works in subfolder installs.
- Use prepared statements for database queries.
- Use `password_hash()` and `password_verify()` for user passwords.
- Escape view output with `escape_for_html()` or `htmlspecialchars(..., ENT_QUOTES, 'UTF-8')`.
- Keep upload handling in [`app/core/uploads.php`](app/core/uploads.php).

## Authentication

- `owner` - full access to admin pages
- `staff` - limited access to products, inventory, and personal audit logs
- `guest` - sign-in only

## Notes

- Audit logs are stored in the database and mirrored to local files under `app/logs/audit/`.
- Uploaded product images are stored under `public/uploads/products/`.
- The app expects route and view assets to stay aligned with the folder structure.
