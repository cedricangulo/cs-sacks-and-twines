<section class="grid grid-cols-12 gap-6 pt-17 h-dvh">
  <div class="col-span-9 p-6">
    <div class="flex items-center justify-between w-full gap-4 mb-6">
      <div class="space-y-2">
        <h2 class="type-lg">Products</h2>
        <p class="type-sm text-muted-foreground">
          Select products and dispatch to customers.
        </p>
      </div>
    </div>
    <div
      id="products-grid"
      class="grid grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3"
      data-products-url="<?= htmlspecialchars(routeUrl('/api/products/list'), ENT_QUOTES, 'UTF-8') ?>"
      data-dispatch-url="<?= htmlspecialchars(routeUrl('/api/stock-out'), ENT_QUOTES, 'UTF-8') ?>">
    </div>
  </div>

  <aside class="h-full col-span-3 border-l bg-sidebar">
    <nav class="flex flex-col justify-between h-full" aria-label="Dispatch Queue">
      <div>
        <header class="px-4 pt-4">
          <h3 class="font-semibold type-base">Dispatch Queue</h3>
          <p class="type-xs text-muted-foreground" id="queue-count">0 items selected</p>
        </header>
        <section class="px-4 py-4 space-y-2" id="dispatch-queue">
          <p class="py-4 text-center type-sm text-muted-foreground">No items selected</p>
        </section>
      </div>
      <footer class="p-4 space-y-4 border-t">
        <div class="grid gap-2">
          <label for="customer-reference" class="type-sm">Customer Reference</label>
          <input
            type="text"
            id="customer-reference"
            class="input"
            placeholder="Name or plate number" />
        </div>
        <button
          type="button"
          id="dispatch-btn"
          class="w-full btn"
          disabled>
          Dispatch
        </button>
      </footer>
    </nav>
  </aside>
</section>

<script type="module" src="<?= htmlspecialchars(routeUrl('/public/dist/products/index.js'), ENT_QUOTES, 'UTF-8') ?>"></script>