<?php

$tableHeaders = [
  ['key' => 'created_at', 'label' => 'Date/Time'],
  ['key' => 'user_name', 'label' => 'User'],
  ['key' => 'action', 'label' => 'Action'],
  ['key' => 'description', 'label' => 'Description'],
];

?>

<section class="p-6 pt-23">
  <div class="flex items-center justify-between w-full gap-4">
    <div>
      <h2 class="type-lg">Audit logs</h2>
      <p class="type-sm text-muted-foreground">
        View all system activity history.
      </p>
    </div>
    <button class="btn">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-up-icon lucide-file-up">
        <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
        <path d="M14 2v5a1 1 0 0 0 1 1h5" />
        <path d="M12 12v6" />
        <path d="m15 15-3-3-3 3" />
      </svg>
      Export Logs
    </button>
  </div>

  <div data-filter-bar-placeholder="audit-logs" class="min-h-[4.25rem]"></div>

  <div class="overflow-x-auto">
    <table class="table">
      <thead>
        <tr>
          <?php foreach ($tableHeaders as $header): ?>
            <th data-sort="<?= htmlspecialchars($header['key'], ENT_QUOTES, 'UTF-8') ?>">
              <button
                type="button"
                data-sort-btn="<?= htmlspecialchars($header['key'], ENT_QUOTES, 'UTF-8') ?>"
                class="h-auto gap-2 p-1 -ml-3 font-medium btn-ghost text-muted-foreground/80">
                <?= htmlspecialchars($header['label'], ENT_QUOTES, 'UTF-8') ?>
              </button>
            </th>
          <?php endforeach; ?>
        </tr>
      </thead>
      <tbody id="audit-logs-container" data-api-url="<?= htmlspecialchars(routeUrl('/api/audit-logs'), ENT_QUOTES, 'UTF-8') ?>">
        <tr>
          <td colspan="4" class="py-12">
            <div class="flex flex-col items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="status" aria-label="Loading" class="size-6 animate-spin text-muted-foreground">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span class="text-muted-foreground type-sm">Loading audit logs...</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div id="pagination-container" class="mt-6"></div>
</section>

<script type="module" src="<?= htmlspecialchars(routeUrl('/public/dist/audit-logs/index.js'), ENT_QUOTES, 'UTF-8') ?>"></script>