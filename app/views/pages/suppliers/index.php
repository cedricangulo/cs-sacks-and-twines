<?php

include __DIR__ . '/add-supplier-dialog.php';
include __DIR__ . '/delete-supplier-dialog.php';
require_once __DIR__ . '/../../../core/sanitize.php';

$tableHeaders = [
  ['key' => 'company_name', 'label' => 'Supplier Name'],
  ['key' => 'contact_person', 'label' => 'Contact Person'],
  ['key' => 'contact_number', 'label' => 'Contact Number'],
  ['key' => 'address', 'label' => 'Address'],
  ['key' => 'created_at', 'label' => 'Added At'],
  ['key' => 'actions', 'label' => ''],
];

$userRole = $_SESSION['user_role'] ?? 'guest';
$canManage = $userRole === 'owner';

?>

<section class="p-6 pt-23">
  <div class="flex items-center justify-between w-full gap-4">
    <div>
      <h2 class="type-lg">Suppliers</h2>
      <p class="type-sm text-muted-foreground">
        Manage your suppliers.
      </p>
    </div>

    <button
      type="button"
      class="btn"
      onclick="document.getElementById('add-supplier-dialog').showModal()">
      Add Supplier
    </button>
  </div>

  <div data-filter-bar-placeholder="suppliers" class="min-h-17"></div>

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
        </tr>
      </thead>
      <tbody
        id="suppliers-container"
        data-api-url="<?= escape_for_html(routeUrl('/api/suppliers')) ?>"
        data-edit-url="<?= $canManage ? escape_for_html(routeUrl('/api/suppliers/show?id=')) : '' ?>"
        data-delete-url="<?= $canManage ? escape_for_html(routeUrl('/api/suppliers/delete')) : '' ?>">
        <tr>
          <td colspan="6" class="py-12">
            <div class="flex flex-col items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="status" aria-label="Loading" class="size-6 animate-spin text-muted-foreground">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span class="text-muted-foreground type-sm">Loading suppliers...</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

<script type="module" src="<?= escape_for_html(routeUrl('/public/dist/suppliers/index.js')) ?>"></script>