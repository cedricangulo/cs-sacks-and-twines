# Routing

This app uses a small front-controller router in native PHP.

## File Layout

- `app/config/routes/web.php` for page routes
- `app/config/routes/api.php` for JSON endpoints
- `app/config/routes.php` as the merged catalog
- `app/core/routes.php` for normalization and lookup helpers

## Route Shape

```php
'path' => [
  'title' => 'Inventory',
  'type' => 'web',
  'methods' => ['GET'],
  'controller' => '/abs/path/to/controller.php',
  'class' => 'InventoryController',
  'method' => 'index',
  'view' => '/abs/path/to/view.php',
  'layout' => 'app',
  'roles' => ['owner'],
  'nav' => [
    'label' => 'Inventory',
    'icon' => 'inventory',
    'group' => 'Operations',
    'show' => true,
  ],
],
```

## Rules

- Use `type => 'web'` for pages.
- Use `type => 'api'` for JSON endpoints.
- Keep menu data inside `nav`.
- Set `methods` explicitly for non-GET routes.
- Do not put API routes in the sidebar.

## Current Pattern

- Pages render through `index.php` and a layout shell.
- API routes return JSON and skip the shell.
- Controllers can still short-circuit with redirects or JSON responses.
