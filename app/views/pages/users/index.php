<?php
include __DIR__ . '/add-user-dialog.php';
include __DIR__ . '/deactivate-user-dialog.php';

$tableHeaders = [
  ['key' => 'name', 'label' => 'Name'],
  ['key' => 'email', 'label' => 'Email'],
  ['key' => 'created_at', 'label' => 'Added At'],
  ['key' => 'action', 'label' => 'Action'],
];

?>

<section class="p-6 pt-23">
  <div class="flex items-center justify-between w-full gap-4">
    <div>
      <h2 class="type-lg">Staff</h2>
      <p class="type-sm text-muted-foreground">
        Add or deactivate staff accounts.
      </p>
    </div>

    <button
      type="button"
      class="btn"
      onclick="document.getElementById('add-user-dialog').showModal()">
      Add Staff
    </button>
  </div>

  <div data-filter-bar-placeholder="users" class="min-h-[4.25rem]"></div>

  <div class="overflow-x-auto">
    <table class="table">
      <thead>
        <tr>
          <?php foreach ($tableHeaders as $header): ?>
            <th class="<?= $header['key'] === 'action' ? 'text-right' : '' ?>" data-sort="<?= htmlspecialchars($header['key'], ENT_QUOTES, 'UTF-8') ?>">
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
      <tbody id="users-container" data-api-url="<?= htmlspecialchars(routeUrl('/api/users'), ENT_QUOTES, 'UTF-8') ?>" data-deactivate-url="<?= htmlspecialchars(routeUrl('/api/users/deactivate'), ENT_QUOTES, 'UTF-8') ?>">
        <tr>
          <td colspan="4" class="py-12">
            <div class="flex flex-col items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="status" aria-label="Loading" class="size-6 animate-spin text-muted-foreground">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span class="text-muted-foreground type-sm">Loading staff...</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

<script type="module" src="<?= htmlspecialchars(routeUrl('/public/dist/users/index.js'), ENT_QUOTES, 'UTF-8') ?>"></script>