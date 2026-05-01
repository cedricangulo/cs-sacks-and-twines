<?php
include __DIR__ . '/add-inventory-dialog.php';
?>
<section class="p-6 pt-23">
  <div class="flex w-full items-center justify-between gap-4">
    <div class="space-y-2">
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

<div class="mt-6 overflow-x-auto">
    <table class="table">
      <thead>
        <tr>
          <th>Product Name</th>
          <th>SKU</th>
          <th>Category</th>
          <th>Base Unit</th>
          <th class="text-right">Current Stock</th>
          <th class="text-right">Total Asset Value</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="products-container" data-api-url="<?= htmlspecialchars(routeUrl('/api/products'), ENT_QUOTES, 'UTF-8') ?>" data-batches-url="<?= htmlspecialchars(routeUrl('/api/inventory/batches'), ENT_QUOTES, 'UTF-8') ?>" data-batches-count-url="<?= htmlspecialchars(routeUrl('/api/inventory/batches/count'), ENT_QUOTES, 'UTF-8') ?>">
      </tbody>
    </table>
  </div>
</section>

<script type="module" src="<?= htmlspecialchars(routeUrl('/public/dist/inventory/index.js'), ENT_QUOTES, 'UTF-8') ?>"></script>
