<?php

require_once __DIR__ . '/../../../core/sanitize.php';

if (!isset($suppliers) || !is_array($suppliers)) {
  $suppliers = [];
}

?>

<dialog id="edit-inventory-dialog" class="w-full dialog sm:max-w-lg" aria-labelledby="edit-inventory-dialog-title" aria-describedby="edit-inventory-dialog-description" data-edit-inventory-dialog onclick="if (event.target === this) this.close()">
  <div>
    <header>
      <h2 id="edit-inventory-dialog-title">Edit Batch</h2>
      <p id="edit-inventory-dialog-description" class="text-muted-foreground"></p>
    </header>

    <section class="overflow-y-auto scrollbar">
      <form id="edit-inventory-form" class="pb-4 form" data-edit-inventory-form action="<?= escape_for_html(routeUrl('/api/inventory/batches/update')) ?>" method="POST" novalidate>
        <input type="hidden" name="batch_id" value="" data-field-input="batch_id" data-edit-batch-id />
        <input type="hidden" name="product_id" value="" data-field-input="product_id" data-edit-product-id />

        <div class="hidden px-4 py-3 mb-4 text-sm text-red-700 border border-red-200 bg-red-50" role="alert" data-edit-form-error></div>

        <div class="space-y-5">
          <div class="space-y-2">
            <label class="label" for="edit-inventory-supplier">Supplier</label>
            <select class="w-full select" id="edit-inventory-supplier" name="supplier_id" required data-field-input="supplier_id" aria-describedby="edit-supplier-id-error">
              <option value="">Select supplier</option>
              <?php foreach ($suppliers as $supplier): ?>
                <option value="<?= escape_for_html((string) ($supplier['supplier_id'] ?? '')) ?>"><?= escape_for_html((string) ($supplier['company_name'] ?? '')) ?></option>
              <?php endforeach; ?>
            </select>
            <p id="edit-supplier-id-error" class="hidden text-sm text-destructive" role="alert" data-field-error="supplier_id"></p>
          </div>

          <div class="space-y-2">
            <label class="label" for="edit-inventory-quantity">Quantity Received</label>
            <input class="w-full input" type="number" id="edit-inventory-quantity" name="quantity_received" min="0.01" step="0.01" placeholder="0.00" required data-field-input="quantity_received" aria-describedby="edit-quantity-received-error" />
            <p id="edit-quantity-received-error" class="hidden text-sm text-destructive" role="alert" data-field-error="quantity_received"></p>
          </div>

          <p class="hidden text-sm text-muted-foreground" data-edit-quantity-lock-note>
            Quantity fields are locked because this batch already has dispatch or adjustment history.
          </p>

          <div class="space-y-2">
            <label class="label" for="edit-inventory-cost">Total Procurement Cost</label>
            <input class="w-full input" type="number" id="edit-inventory-cost" name="total_procurement_cost" min="0.01" step="0.01" placeholder="0.00" required data-field-input="total_procurement_cost" aria-describedby="edit-total-procurement-cost-error" />
            <p id="edit-total-procurement-cost-error" class="hidden text-sm text-destructive" role="alert" data-field-error="total_procurement_cost"></p>
          </div>
        </div>
      </form>
    </section>

    <footer>
      <div class="flex items-center justify-end gap-3">
        <button class="btn-outline" type="button" data-edit-cancel-button>Cancel</button>
        <button class="btn" type="submit" form="edit-inventory-form" data-edit-save-button>Save changes</button>
      </div>
    </footer>

    <button type="button" aria-label="Close dialog" onclick="this.closest('dialog').close()">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
  </div>
</dialog>