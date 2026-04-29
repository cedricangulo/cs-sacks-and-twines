<?php
// The top navigation changes based on the active role to keep owner and
// cashier workflows separate.
?>
<header class="flex p-4 border-b">
  <?php if (app_current_user_role() === 'owner'): ?>
    <!-- Owners get the sidebar toggle because they can navigate the full app. -->
    <button class="btn-icon-outline" type="button" onclick="document.dispatchEvent(new CustomEvent('basecoat:sidebar'))">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-left-dashed-icon lucide-panel-left-dashed">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 14v1" />
        <path d="M9 19v2" />
        <path d="M9 3v2" />
        <path d="M9 9v1" />
      </svg>
    </button>
  <?php elseif (app_current_user_role() === 'cashier'): ?>
    <!-- Cashiers get a slimmer action set focused on common tasks. -->
    <div class="flex items-center gap-4 ml-auto">
      <button class="btn">Add Product</button>
      <a href="<?= routeUrl('/audit-logs/personal') ?>">
        <button class="btn-outline" type="button">
          Audit Logs
        </button>
      </a>
    </div>
  <?php endif; ?>
</header>