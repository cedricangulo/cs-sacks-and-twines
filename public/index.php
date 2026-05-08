<?php

// The front controller boots shared helpers, resolves the current route,
// and renders the selected page inside the correct shell.
require_once __DIR__ . '/../app/core/bootstrap.php';

$requestPath = request_path();

if (app_request_is_api() && app_route_for_path($requestPath) === null) {
  header('Content-Type: application/json; charset=UTF-8');
  http_response_code(404);
  echo json_encode([
    'success' => false,
    'message' => 'Resource not found.',
  ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{"success":false}';
  exit;
}

$currentPage = app_resolve_page_route();

$pageController = $currentPage['controller'] ?? null;
$allowedRoles = $currentPage['roles'] ?? [];
$currentRole = app_current_user_role();
$requestMethod = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$pageResponse = (string) ($currentPage['response'] ?? 'html');

// Send guests to sign-in before any protected page renders.
if ($currentRole === 'guest' && !in_array('guest', $allowedRoles, true)) {
  if ($pageResponse === 'json') {
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code(401);
    echo json_encode([
      'success' => false,
      'message' => 'You must be signed in to access this resource.',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{"success":false}';
    exit;
  }

  header('Location: ' . routeUrl('/sign-in'));
  exit;
}

if (($currentPage['status_code'] ?? 200) !== 404 && !app_route_accepts_method($currentPage, $requestMethod)) {
  if ($pageResponse === 'json') {
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code(405);
    echo json_encode([
      'success' => false,
      'message' => 'Method not allowed.',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{"success":false}';
    exit;
  }

  http_response_code(405);
  header('Content-Type: text/plain; charset=UTF-8');
  echo 'Method Not Allowed';
  exit;
}

// Some routes, such as sign-in, need to run a controller before the view is
// rendered so they can handle POST requests or short-circuit with redirects.
$controllerOutput = [];
if (is_string($pageController) && $pageController !== '' && is_file($pageController)) {
  require_once $pageController;
  
  if (isset($currentPage['class'], $currentPage['method'])) {
    $className = $currentPage['class'];
    $methodName = $currentPage['method'];
    
    if (class_exists($className) && method_exists($className, $methodName)) {
      $controllerInstance = new $className();
      $controllerOutput = $controllerInstance->$methodName();
      
      // Extract array return values into variables for the view
      if (is_array($controllerOutput)) {
        if (isset($controllerOutput['status_code']) && is_numeric($controllerOutput['status_code'])) {
          $currentPage['status_code'] = (int) $controllerOutput['status_code'];
        }

        extract($controllerOutput);
      }
    }
  }
}

$statusCode = (int) ($currentPage['status_code'] ?? 200);
$isErrorPage = $statusCode >= 400;
$errorDetails = $isErrorPage ? app_error_details($statusCode) : null;

$pageTitle = $isErrorPage ? $errorDetails['title'] : ($currentPage['title'] ?? 'Sacks and Twines');
$pageView = $isErrorPage
  ? __DIR__ . '/../app/views/pages/not-found.php'
  : ($currentPage['view'] ?? __DIR__ . '/../app/views/pages/not-found.php');
$pageShell = $isErrorPage ? 'auth' : app_route_shell($currentPage);
$showSidebar = !$isErrorPage && app_should_show_sidebar($currentPage, $currentRole);

http_response_code($statusCode);

?>
<?php require_once __DIR__ . '/../app/views/layout/head.php'; ?>

<body>
  <!-- The app shell is only used for authenticated pages; auth pages render
       their view directly without the sidebar or nav chrome. -->
  <?php if ($pageShell === 'app'): ?>
    <?php if ($showSidebar): ?>
      <?php require_once __DIR__ . '/../app/views/layout/sidebar.php'; ?>
    <?php endif; ?>
    <main>
      <?php require_once __DIR__ . '/../app/views/layout/nav.php'; ?>
      <?php require_once $pageView; ?>
    </main>
  <?php else: ?>
    <?php require_once $pageView; ?>
  <?php endif; ?>
</body>
<?php require_once __DIR__ . '/../app/views/layout/footer.php'; ?>
