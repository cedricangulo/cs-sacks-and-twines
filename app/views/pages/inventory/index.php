<?php

include __DIR__ . '/add-inventory-dialog.php';
include __DIR__ . '/edit-inventory-dialog.php';
include __DIR__ . '/void-batch-dialog.php';

require_once __DIR__ . '/../../../core/sanitize.php';

$tableHeaders = [
  ['key' => 'name', 'label' => 'Product Name'],
  ['key' => 'sku_code', 'label' => 'SKU'],
  ['key' => 'category', 'label' => 'Category'],
  ['key' => 'base_uom', 'label' => 'Base Unit'],
  ['key' => 'current_quantity', 'label' => 'Current Stock'],
  ['key' => 'total_asset_value', 'label' => 'Total Asset Value'],
  ['key' => 'status', 'label' => 'Status'],
];

?>

<section class="p-6 pt-23">
  <div class="flex items-center justify-between w-full gap-4">
    <div>
      <h2 class="type-lg">Inventory</h2>
      <p class="type-sm text-muted-foreground">
        Choose an existing product for fast stock intake or add a new product inline.
      </p>
    </div>

    <button
      type="button"
      class="btn"
      onclick="document.getElementById('add-inventory-dialog').showModal()">
      Add Inventory
    </button>
  </div>

  <div data-filter-bar-placeholder="inventory" class="min-h-17"></div>

  <div class="overflow-x-auto">
    <table class="table">
      <thead>
        <tr>
          <?php foreach ($tableHeaders as $header): ?>
            <th
              class="<?= $header['key'] === 'current_quantity' || $header['key'] === 'total_asset_value' ? 'text-right' : '' ?>"
              data-sort="<?= escape_for_html($header['key']) ?>">
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
      <tbody id="products-container" data-api-url="<?= escape_for_html(routeUrl('/api/products')) ?>" data-batches-url="<?= escape_for_html(routeUrl('/api/inventory/batches')) ?>" data-batches-count-url="<?= escape_for_html(routeUrl('/api/inventory/batches/count')) ?>" data-batch-detail-url="<?= escape_for_html(routeUrl('/api/inventory/batches/detail')) ?>">
        <tr>
          <td colspan="8" class="py-12">
            <div class="flex flex-col items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="status" aria-label="Loading" class="size-6 animate-spin text-muted-foreground">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span class="text-muted-foreground type-sm">Loading products...</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

<script type="module" src="<?= escape_for_html(routeUrl('/public/dist/inventory/index.js')) ?>"></script>