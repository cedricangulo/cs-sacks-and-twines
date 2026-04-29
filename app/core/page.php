<?php

declare(strict_types=1);

/**
 * Resolve the page route that should actually be rendered for the current request.
 *
 * Unknown URLs and routes without a view/controller fall back to the not-found
 * route, while controller-only routes are allowed to execute normally.
 *
 * @return array
 */
if (!function_exists('app_resolve_page_route')) {
  function app_resolve_page_route(): array
  {
    $requestedPath = request_path();
    $currentPage = app_current_route();

    if ($requestedPath !== '/not-found') {
      $pageViewPath = $currentPage['view'] ?? null;
      $pageController = $currentPage['controller'] ?? null;
      $hasView = is_string($pageViewPath) && $pageViewPath !== '' && is_file($pageViewPath);
      $hasController = is_string($pageController) && $pageController !== '' && is_file($pageController);

      if (!$hasView && !$hasController) {
        $currentPage = app_route_for_path('/not-found') ?? $currentPage;
        $currentPage['status_code'] = 404;

        return $currentPage;
      }
    }

    if ($requestedPath === '/not-found' || ($currentPage['title'] ?? '') === 'Not found') {
      $currentPage['status_code'] = 404;
    }

    return $currentPage;
  }
}
