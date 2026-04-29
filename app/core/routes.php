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
 * Resolve the current user's role from session state.
 *
 * The app accepts both the nested session structure used by the current
 * sign-in flow and the flat legacy key for compatibility.
 */
if (!function_exists('app_current_user_role')) {
  function app_current_user_role(): string
  {
    if (isset($_SESSION['user']['role']) && is_string($_SESSION['user']['role'])) {
      return $_SESSION['user']['role'];
    }

    if (isset($_SESSION['user_role']) && is_string($_SESSION['user_role'])) {
      return $_SESSION['user_role'];
    }

    return 'guest';
  }
}

/**
 * Get the layout shell for a route.
 */
if (!function_exists('app_route_shell')) {
  function app_route_shell(array $route): string
  {
    return $route['layout'] ?? 'app';
  }
}

/**
 * Determine whether the current shell should render the sidebar.
 */
if (!function_exists('app_should_show_sidebar')) {
  function app_should_show_sidebar(array $route, string $role): bool
  {
    return app_route_shell($route) === 'app' && $role === 'owner';
  }
}

/**
 * Build the sidebar navigation for a single user role from route metadata.
 *
 * Route metadata drives the menu, so the view layer stays thin and does not
 * need hardcoded links.
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
      // Hidden routes stay out of the menu even if they share a role.
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