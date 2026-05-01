<?php
include __DIR__ . '/add-supplier-dialog.php';
?>
<section class="p-6 pt-23">
  <div class="flex w-full items-center justify-between gap-4">
    <div class="space-y-2">
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

  <div class="overflow-x-auto">
    <table class="table mt-6">
      <thead>
        <tr class="text-muted-foreground/70">
          <th>Supplier Name</th>
          <th>Contact Person</th>
          <th>Contact Number</th>
          <th>Address</th>
          <th>Added At</th>
        </tr>
      </thead>
      <tbody id="suppliers-container" data-api-url="<?= htmlspecialchars(routeUrl('/api/suppliers'), ENT_QUOTES, 'UTF-8') ?>">
      </tbody>
    </table>
  </div>
</section>

<script type="module" src="<?= htmlspecialchars(routeUrl('/public/dist/suppliers/index.js'), ENT_QUOTES, 'UTF-8') ?>"></script>