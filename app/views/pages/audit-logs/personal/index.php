<?php
require_once __DIR__ . '/../../../../core/sanitize.php';
?>

<section class="p-6 pt-23 space-y-6">
  <a class="block w-fit" href="<?= escape_for_html(routeUrl('/products')) ?>">
    <button class="btn-ghost">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left-icon lucide-arrow-left">
        <path d="m12 19-7-7 7-7" />
        <path d="M19 12H5" />
      </svg>
      Back
    </button>
  </a>

  <div>
    <h2 class="type-lg">Personal audit logs</h2>
    <p class="type-sm text-muted-foreground">
      Your activity history.
    </p>
  </div>

  <table class="table">
    <tbody id="audit-logs-container" data-api-url="<?= escape_for_html(routeUrl('/api/audit-logs/personal')) ?>">
      <tr>
        <td colspan="4" class="py-12">
          <div class="flex flex-col items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="status" aria-label="Loading" class="size-6 animate-spin text-muted-foreground"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            <span class="text-muted-foreground type-sm">Loading audit logs...</span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>

  <div id="pagination-container"></div>
</section>

<script type="module" src="<?= escape_for_html(routeUrl('/public/dist/audit-logs/index.js?v=5')) ?>"></script>