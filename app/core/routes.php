<?php

declare(strict_types=1);

/**
 * Load and cache the route catalog from the config file.
 *
 * @return array
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
 *
 * @param string $path
 * @return array|null
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
 *
 * @return array
 */
if (!function_exists('app_current_route')) {
  function app_current_route(): array
  {
    $currentRoute = app_route_for_path(request_path());

    if ($currentRoute !== null) {
      return $currentRoute;
    }

    return app_route_for_path('/not-found') ?? (app_route_for_path('/') ?? []);
  }
}

/**
 * Resolve the current user's role from session state.
 *
 * The app accepts both the nested session structure used by the current
 * sign-in flow and the flat legacy key for compatibility.
 *
 * @return string
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
 *
 * @param array $route
 * @return string
 */
if (!function_exists('app_route_shell')) {
  function app_route_shell(array $route): string
  {
    return $route['layout'] ?? 'app';
  }
}

/**
 * Determine whether the current shell should render the sidebar.
 *
 * @param array $route
 * @param string $role
 * @return bool
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
 * Route metadata drives both visibility and section grouping, so the view
 * layer stays thin and does not need hardcoded labels.
 *
 * @param string $role
 * @return array
 */
if (!function_exists('app_navigation_for_role')) {
  function app_navigation_for_role(string $role): array
  {
    $sections = [];

    foreach (app_routes() as $path => $route) {
      // Hidden routes stay out of the menu even if they share a role.
      if (($route['show_in_nav'] ?? true) !== true) {
        continue;
      }

      $routeRoles = $route['roles'] ?? [];

      if (!in_array($role, $routeRoles, true)) {
        continue;
      }

      $groupLabel = $route['group'] ?? 'Other';

      if (!isset($sections[$groupLabel])) {
        $sections[$groupLabel] = [
          'label' => $groupLabel,
          'links' => [],
        ];
      }

      $sections[$groupLabel]['links'][] = [
        'label' => $route['label'] ?? $route['title'],
        'href' => $path,
        'icon' => $route['icon'] ?? '',
      ];
    }

    return array_values(array_filter($sections, static fn(array $section): bool => $section['links'] !== []));
  }
}

/**
 * Render a route icon as inline SVG.
 *
 * Sidebar links use the route metadata key and this helper returns the SVG
 * markup needed to display it.
 */
if (!function_exists('app_icon_svg')) {
  function app_icon_svg(string $name): string
  {
    static $icons = [
      'dashboard' => '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-dashboard-icon lucide-layout-dashboard"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>',
      'inventory' => '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shelving-unit-icon lucide-shelving-unit"><path d="M12 12V9a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/><path d="M16 20v-3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3"/><path d="M20 22V2"/><path d="M4 12h16"/><path d="M4 20h16"/><path d="M4 2v20"/><path d="M4 4h16"/></svg>',
      'products' => '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-box-icon lucide-box"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
      'reports' => '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-notepad-text-icon lucide-notepad-text"><path d="M8 2v4"/><path d="M12 2v4"/><path d="M16 2v4"/><rect width="16" height="18" x="4" y="4" rx="2"/><path d="M8 10h6"/><path d="M8 14h8"/><path d="M8 18h5"/></svg>',
      'suppliers' => '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-container-icon lucide-container"><path d="M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-3.9a1.72 1.72 0 0 0-1.7 0l-10.3 6c-.5.2-.9.8-.9 1.4v6.6c0 .5.4 1.2.8 1.5l6.3 3.9a1.72 1.72 0 0 0 1.7 0l10.3-6c.5-.3.9-1 .9-1.5Z"/><path d="M10 21.9V14L2.1 9.1"/><path d="m10 14 11.9-6.9"/><path d="M14 19.8v-8.1"/><path d="M18 17.5V9.4"/></svg>',
      'audit-logs' => '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-logs-icon lucide-logs"><path d="M3 5h1"/><path d="M3 12h1"/><path d="M3 19h1"/><path d="M8 5h1"/><path d="M8 12h1"/><path d="M8 19h1"/><path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/></svg>',
      'audit-logs-personal' => '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-logs-icon lucide-logs"><path d="M3 5h1"/><path d="M3 12h1"/><path d="M3 19h1"/><path d="M8 5h1"/><path d="M8 12h1"/><path d="M8 19h1"/><path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/></svg>',
      'users' => '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-icon lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>',
      'sign-in' => '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-in-icon lucide-log-in"><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></svg>',
      'sign-out' => '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out-icon lucide-log-out"><path d="m14 17 5-5-5-5"/><path d="M19 12H9"/><path d="M11 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/></svg>',
    ];

    return $icons[$name] ?? '';
  }
}
