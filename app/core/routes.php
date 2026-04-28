<?php

/**
 * Load and cache the route catalog from the config file.
 */
if (!function_exists('app_routes')) {
  function app_routes(): array
  {
    static $routes = null;

    if ($routes === null) {
      $routes = require __DIR__ . '/../config/routes.php';
    }

    return $routes;
  }
}

/**
 * Get a single route definition by path.
 */
if (!function_exists('app_route_for_path')) {
  function app_route_for_path(string $path): ?array
  {
    $routes = app_routes();

    return $routes[$path] ?? null;
  }
}

/**
 * Resolve the current route using the normalized request path.
 */
if (!function_exists('app_current_route')) {
  function app_current_route(): array
  {
    $currentRoute = app_route_for_path(request_path());

    if ($currentRoute !== null) {
      return $currentRoute;
    }

    return app_route_for_path('/') ?? [];
  }
}

/**
 * Build the sidebar navigation for a single user role from route metadata.
 */
if (!function_exists('app_navigation_for_role')) {
  function app_navigation_for_role(string $role): array
  {
    $sectionLabels = [
      'owner' => 'Owner',
      'cashier' => 'Cashier',
    ];

    if (!isset($sectionLabels[$role])) {
      return [];
    }

    $links = [];

    foreach (app_routes() as $path => $route) {
      if (($route['show_in_nav'] ?? true) !== true) {
        continue;
      }

      $routeRoles = $route['roles'] ?? [];

      if (!in_array($role, $routeRoles, true)) {
        continue;
      }

      $links[] = [
        'label' => $route['label'] ?? $route['title'],
        'href' => $path,
        'icon' => $route['icon'] ?? '',
      ];
    }

    return [[
      'label' => $sectionLabels[$role],
      'links' => $links,
    ]];
  }
}