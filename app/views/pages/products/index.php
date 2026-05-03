<section class="flex pt-17 h-dvh overflow-hidden">
  <div class="flex-1 p-6 overflow-y-auto space-y-6">
    <div class="flex items-center justify-between w-full gap-4">
      <div>
        <h2 class="type-lg">Products</h2>
        <p class="type-sm text-muted-foreground">
          Select products and dispatch to customers.
        </p>
      </div>
      <a class="btn-secondary" href="<?= routeUrl('/dispatch-history') ?>">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-history-icon lucide-history">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l4 2" />
        </svg>
        History
      </a>
    </div>
    <div id="products-filter-bar"></div>
    <div
      id="products-grid"
      class="grid grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 pb-6"
      data-products-url="<?= htmlspecialchars(routeUrl('/api/products/list'), ENT_QUOTES, 'UTF-8') ?>"
      data-dispatch-url="<?= htmlspecialchars(routeUrl('/api/stock-out'), ENT_QUOTES, 'UTF-8') ?>">
      <div class="col-span-full py-12">
        <div class="flex flex-col items-center justify-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="status" aria-label="Loading" class="size-6 animate-spin text-muted-foreground">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span class="text-muted-foreground type-md">Loading products...</span>
        </div>
      </div>
    </div>
  </div>

  <aside class="h-full border-l bg-sidebar w-(--sidebar-width)">
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