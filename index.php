<?php

require_once __DIR__ . '/app/core/bootstrap.php';
$currentPage = app_current_route();
$pageTitle = $currentPage['title'] ?? 'Sacks and Twines';
$pageView = $currentPage['view'] ?? __DIR__ . '/app/views/pages/dashboard/index.php';
?>
<?php require_once __DIR__ . '/app/views/layout/head.php'; ?>

<body>
  <?php require_once __DIR__ . '/app/views/layout/sidebar.php'; ?>
  <main>
    <?php require_once __DIR__ . '/app/views/layout/nav.php'; ?>
    <?php require_once $pageView; ?>
  </main>
</body>
<?php require_once __DIR__ . '/app/views/layout/footer.php'; ?>