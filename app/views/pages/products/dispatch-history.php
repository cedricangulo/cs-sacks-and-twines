<?php

require_once __DIR__ . '/../../../core/sanitize.php';

$tableHeaders = [
  ['key' => 'created_at', 'label' => 'Time'],
  ['key' => 'customer_reference', 'label' => 'Reference'],
  ['key' => 'staff_name', 'label' => 'User'],
  ['key' => 'total_items', 'label' => 'Total Items'],
  ['key' => 'status', 'label' => 'Status'],
];

?>

<section class="p-6 space-y-6 pt-23">
  <a class="btn-ghost" href="<?= escape_for_html(routeUrl('/products')) ?>" aria-label="Back to products">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
    Back
  </a>
  <div class="flex items-center gap-4">
    <div>
      <h2 class="type-lg">Dispatch History - Today</h2>
      <p class="type-sm text-muted-foreground">
        Review today's dispatches and their details.
      </p>
    </div>
  </div>

  <div data-filter-bar-placeholder="dispatch-history" class="min-h-[4.25rem]"></div>

  <div class="overflow-x-auto">
    <table class="table">
      <thead>
        <tr>
          <?php foreach ($tableHeaders as $header): ?>
            <th data-sort="<?= escape_for_html($header['key']) ?>">
              <button
                type="button"
                data-sort-btn="<?= escape_for_html($header['key']) ?>"
                class="h-auto gap-2 p-1 -ml-1 font-medium btn-ghost text-muted-foreground/80 dark:text-muted-foreground">
                <?= escape_for_html($header['label']) ?>
              </button>
            </th>
          <?php endforeach; ?>
          <th></th>
        </tr>
      </thead>
      <tbody id="dispatches-container" data-dispatches-url="<?= escape_for_html(routeUrl('/api/dispatches/today')) ?>" data-items-url="<?= escape_for_html(routeUrl('/api/dispatches/items')) ?>">
        <tr>
          <td colspan="7" class="py-12">
            <div class="flex flex-col items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="status" aria-label="Loading" class="size-6 animate-spin text-muted-foreground">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span class="text-muted-foreground type-sm">Loading dispatches...</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

<script type="module" src="<?= escape_for_html(routeUrl('/public/dist/dispatch-history/index.js')) ?>"></script>