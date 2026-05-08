<?php
$statusCode = (int) ($currentPage['status_code'] ?? 404);
$errorDetails = app_error_details($statusCode);
$backFallbackUrl = routeUrl(($currentRole ?? 'guest') === 'guest' ? '/sign-in' : '/dashboard');
?>

<div class="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg p-6 text-center text-balance md:p-12 text-neutral-800 dark:text-neutral-300">
  <header class="flex max-w-sm flex-col items-center gap-3 text-center">
    <h3 class="text-lg font-semibold tracking-tight"><?= htmlspecialchars($errorDetails['title'], ENT_QUOTES, 'UTF-8') ?></h3>
    <p class="text-muted-foreground text-sm/relaxed">
      <?= htmlspecialchars($errorDetails['message'], ENT_QUOTES, 'UTF-8') ?>
    </p>
  </header>
  <section>
    <button
      class="btn"
      type="button"
      onclick="if (window.history.length > 1) { window.history.back(); return; } window.location.href = '<?php echo htmlspecialchars($backFallbackUrl, ENT_QUOTES, 'UTF-8'); ?>';">
      Go Back
    </button>
  </section>
</div>