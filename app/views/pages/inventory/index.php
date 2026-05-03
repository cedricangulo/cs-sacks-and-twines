<?php

include __DIR__ . '/add-inventory-dialog.php';

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

  <div data-filter-bar-placeholder="inventory" class="min-h-[4.25rem]"></div>

  <div class="overflow-x-auto">
    <table class="table">
      <thead>
        <tr>
          <?php foreach ($tableHeaders as $header): ?>
            <th
              class="<?= $header['key'] === 'current_quantity' || $header['key'] === 'total_asset_value' ? 'text-right' : '' ?>"
              data-sort="<?= htmlspecialchars($header['key'], ENT_QUOTES, 'UTF-8') ?>">
              <button
                type="button"
                data-sort-btn="<?= htmlspecialchars($header['key'], ENT_QUOTES, 'UTF-8') ?>"
                class="h-auto gap-2 p-1 -ml-3 font-medium btn-ghost text-muted-foreground/80">
                <?= htmlspecialchars($header['label'], ENT_QUOTES, 'UTF-8') ?>
              </button>
            </th>
          <?php endforeach; ?>
          <th></th>
        </tr>
      </thead>
      <tbody id="products-container" data-api-url="<?= htmlspecialchars(routeUrl('/api/products'), ENT_QUOTES, 'UTF-8') ?>" data-batches-url="<?= htmlspecialchars(routeUrl('/api/inventory/batches'), ENT_QUOTES, 'UTF-8') ?>" data-batches-count-url="<?= htmlspecialchars(routeUrl('/api/inventory/batches/count'), ENT_QUOTES, 'UTF-8') ?>">
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

<script type="module" src="<?= htmlspecialchars(routeUrl('/public/dist/inventory/index.js'), ENT_QUOTES, 'UTF-8') ?>"></script>