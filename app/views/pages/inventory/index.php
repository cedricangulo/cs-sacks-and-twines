<?php
include __DIR__ . '/add-inventory-dialog.php';
?>
<section class="p-6">
  <div class="flex w-full items-center justify-between gap-4">
    <div class="space-y-2">
      <h2 class="type-lg">Inventory</h2>
      <p class="text-sm text-muted-foreground">
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

  <!-- Products container with skeleton loaders -->
  <div class="mt-6" id="products-container" data-api-url="<?= htmlspecialchars(routeUrl('/api/products'), ENT_QUOTES, 'UTF-8') ?>">
    <!-- Skeleton loaders -->
    <div class="space-y-3" id="skeleton-loaders">
      <div class="flex items-center gap-4">
        <div class="bg-accent animate-pulse size-10 shrink-0 rounded-full"></div>
        <div class="grid gap-2 flex-1">
          <div class="bg-accent animate-pulse rounded-md h-4 w-[150px]"></div>
          <div class="bg-accent animate-pulse rounded-md h-4 w-[100px]"></div>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="bg-accent animate-pulse size-10 shrink-0 rounded-full"></div>
        <div class="grid gap-2 flex-1">
          <div class="bg-accent animate-pulse rounded-md h-4 w-[150px]"></div>
          <div class="bg-accent animate-pulse rounded-md h-4 w-[100px]"></div>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="bg-accent animate-pulse size-10 shrink-0 rounded-full"></div>
        <div class="grid gap-2 flex-1">
          <div class="bg-accent animate-pulse rounded-md h-4 w-[150px]"></div>
          <div class="bg-accent animate-pulse rounded-md h-4 w-[100px]"></div>
        </div>
      </div>
    </div>
  </div>
</section>

<script type="module" src="<?= htmlspecialchars(routeUrl('/public/js/inventory.js'), ENT_QUOTES, 'UTF-8') ?>"></script>