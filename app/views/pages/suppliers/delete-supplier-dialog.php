<?php
require_once __DIR__ . '/../../../core/sanitize.php';
?>

<dialog id="delete-supplier-dialog" class="w-full dialog sm:max-w-md" data-delete-supplier-dialog onclick="if (event.target === this) this.close()">
  <div>
    <header>
      <h2 id="delete-supplier-dialog-title">Delete Supplier</h2>
      <p id="delete-supplier-dialog-description">This action cannot be undone.</p>
    </header>

    <section class="overflow-y-auto scrollbar">
      <div class="hidden rounded-(--radius) px-4 py-3 text-sm text-destructive-foreground border border-red-500 bg-destructive" role="alert" data-delete-supplier-error></div>
      <div class="py-4" data-delete-supplier-content>
        <p class="type-sm text-muted-foreground">Are you sure you want to delete this supplier?</p>
        <p class="mt-2 font-medium" data-delete-supplier-name></p>
      </div>
    </section>

    <footer>
      <button class="btn-outline" type="button" data-delete-supplier-cancel>Cancel</button>
      <button class="btn btn-destructive" type="button" data-delete-supplier-confirm>Delete supplier</button>
    </footer>

    <button type="button" aria-label="Close dialog" onclick="this.closest('dialog').close()">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
  </div>
</dialog>