<?php
$escape = static fn($value) => htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
?>
<header class="fixed w-full p-4 bg-background border-b z-50">
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
  <?php elseif (app_current_user_role() === 'staff'): ?>
    <!-- Staff get a slimmer action set focused on common tasks. -->
    <div class="flex items-center gap-4 ml-auto">
      <a class="btn-secondary" href="<?= routeUrl('/audit-logs/personal') ?>">
        Audit Logs
      </a>
      <form action="<?php echo $escape(routeUrl('/sign-out')); ?>" method="post">
        <button class="btn-destructive" type="submit">
          <?php echo app_icon_svg('sign-out'); ?>
          <span>Sign Out</span>
        </button>
      </form>
    </div>
  <?php endif; ?>
</header>