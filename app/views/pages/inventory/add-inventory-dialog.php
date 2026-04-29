<?php
$products = is_array($products ?? null) ? $products : [];
$suppliers = is_array($suppliers ?? null) ? $suppliers : [];
?>

<dialog id="add-inventory-dialog" class="w-full dialog sm:max-w-5xl max-h-164" aria-labelledby="add-inventory-dialog-title" aria-describedby="add-inventory-dialog-description" data-inventory-dialog onclick="if (event.target === this) this.close()">
  <div class="max-w-5xl">
    <header>
      <h2 id="add-inventory-dialog-title">Add Inventory</h2>
      <p id="add-inventory-dialog-description">Select an existing item for fast stock entry or create a new item inline.</p>
    </header>

    <section class="overflow-y-auto scrollbar">
      <form id="inventory-form" class="form pb-4" data-inventory-form action="<?= htmlspecialchars(routeUrl('/api/inventory/save'), ENT_QUOTES, 'UTF-8') ?>" method="POST" novalidate>
        <input type="hidden" name="mode" value="existing" data-inventory-mode />
        <input type="hidden" name="product_id" value="" data-product-id />

        <div class="hidden px-4 py-3 text-sm text-red-700 border border-red-200 bg-red-50" role="alert" data-form-error></div>

        <fieldset class="fieldset">
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-4">
              <div role="group" class="field" data-field="product_id" data-existing-item-panel>
                <label for="inventory-item-search">Item Name</label>
                <div class="relative" data-combobox>
                  <button
                    type="button"
                    id="inventory-item-trigger"
                    class="flex items-center justify-between w-full gap-3 btn-outline"
                    aria-haspopup="listbox"
                    aria-expanded="false"
                    aria-controls="inventory-item-listbox"
                    data-combobox-trigger
                    data-field-input="product_id"
                    aria-describedby="product_id-error">
                    <span class="text-left truncate" data-combobox-trigger-label>Select an item or add a new one</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-up-down-icon lucide-chevrons-up-down shrink-0 text-muted-foreground opacity-60">
                      <path d="m7 15 5 5 5-5" />
                      <path d="m7 9 5-5 5 5" />
                    </svg>
                  </button>

                  <div class="absolute z-30 hidden w-full mt-2 overflow-hidden bg-white border border-border" data-combobox-popover>
                    <div class="p-2 border-b border-border">
                      <input
                        id="inventory-item-search"
                        type="text"
                        class="w-full input"
                        placeholder="Search existing items..."
                        autocomplete="off"
                        autocorrect="off"
                        spellcheck="false"
                        aria-autocomplete="list"
                        role="combobox"
                        aria-expanded="false"
                        aria-controls="inventory-item-listbox"
                        aria-labelledby="inventory-item-trigger"
                        data-combobox-search />
                    </div>

                    <div class="p-2 space-y-2 overflow-auto max-h-45" role="listbox" id="inventory-item-listbox" aria-labelledby="inventory-item-trigger" data-combobox-listbox>
                      <?php if ($products === []): ?>
                        <div class="px-3 py-4 text-sm text-destructive" data-combobox-empty>No items found yet.</div>
                      <?php endif; ?>

                      <?php foreach ($products as $product): ?>
                        <?php
                        $productId = (string) ($product['id'] ?? '');
                        $productName = (string) ($product['name'] ?? '');
                        $productSku = (string) ($product['sku_code'] ?? '');
                        $productCategory = (string) ($product['category'] ?? '');
                        $productUnit = (string) ($product['base_uom'] ?? '');
                        $defaultSupplierId = (string) ($product['default_supplier_id'] ?? '');
                        $filterText = trim($productName . ' ' . $productSku . ' ' . $productCategory . ' ' . $productUnit);
                        ?>
                        <div
                          role="option"
                          tabindex="0"
                          class="flex-col items-start w-full gap-1 transition h-fit btn-ghost inventory-option"
                          data-combobox-option
                          data-value="<?= htmlspecialchars($productId, ENT_QUOTES, 'UTF-8') ?>"
                          data-label="<?= htmlspecialchars($productName, ENT_QUOTES, 'UTF-8') ?>"
                          data-sku="<?= htmlspecialchars($productSku, ENT_QUOTES, 'UTF-8') ?>"
                          data-category="<?= htmlspecialchars($productCategory, ENT_QUOTES, 'UTF-8') ?>"
                          data-unit="<?= htmlspecialchars($productUnit, ENT_QUOTES, 'UTF-8') ?>"
                          data-supplier-id="<?= htmlspecialchars($defaultSupplierId, ENT_QUOTES, 'UTF-8') ?>"
                          data-filter="<?= htmlspecialchars($filterText, ENT_QUOTES, 'UTF-8') ?>">
                          <h4 class="font-medium type-base text-foreground"><?= htmlspecialchars($productName, ENT_QUOTES, 'UTF-8') ?></h4>
                          <div class="type-xs text-muted-foreground"><?= htmlspecialchars($productSku, ENT_QUOTES, 'UTF-8') ?> · <?= htmlspecialchars($productCategory, ENT_QUOTES, 'UTF-8') ?> · <?= htmlspecialchars($productUnit, ENT_QUOTES, 'UTF-8') ?></div>
                        </div>
                      <?php endforeach; ?>

                      <button
                        type="button"
                        class="w-full btn-outline"
                        data-add-new-item>
                        <span class="text-base leading-none">+</span>
                        <span>Add New Item</span>
                      </button>
                    </div>
                  </div>
                  <p id="product_id-error" class="hidden text-sm text-destructive" role="alert" data-field-error="product_id"></p>
                </div>
              </div>

              <div class="hidden alert" data-new-item-alert>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info-icon lucide-info">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                <h2>Creating a new item</h2>
                <button type="button" class="btn-outline w-fit" data-cancel-new-item>Cancel</button>
              </div>
              <div role="group" class="field" hidden data-new-item-panel data-field="name">
                <label for="inventory-item-name">Item Name</label>
                <input
                  class="w-full input"
                  type="text"
                  id="inventory-item-name"
                  name="name"
                  placeholder="Enter a new item name"
                  autocomplete="off"
                  required
                  disabled
                  data-field-input="name"
                  aria-describedby="name-error" />
                <p id="name-error" class="hidden text-sm text-destructive" role="alert" data-field-error="name"></p>
              </div>

              <div class="grid gap-3" data-field-group="image">
                <div class="flex items-center justify-between gap-4">
                  <label class="label" for="inventory-item-image">Item Image</label>
                  <button type="button" class="hidden text-xs font-medium text-primary" data-edit-field="image">Edit</button>
                </div>
                <div class="flex items-center gap-3 p-3 border border-dashed border-border bg-muted">
                  <div class="flex items-center justify-center overflow-hidden text-xs font-medium size-14 text-muted-foreground" data-image-preview>Preview</div>
                  <p class="text-sm text-muted-foreground" data-image-preview-message>Locked until you choose or create an item.</p>
                </div>
                <input class="w-full" type="file" name="image" id="inventory-item-image" accept="image/*" disabled data-field-input="image" />
              </div>

            </div>
            <div class="grid gap-4">
              <div class="grid grid-cols-2 gap-4">
                <div role="group" class="field" data-field="sku_code">
                  <label class="label" for="inventory-item-sku">SKU</label>
                  <input class="w-full input" type="text" id="inventory-item-sku" disabled name="sku_code" value="Generated on save" readonly data-field-input="sku" />
                </div>

                <div role="group" class="field" data-field="batch_code">
                  <label class="label" for="inventory-item-batch">Batch ID</label>
                  <input class="w-full input" type="text" id="inventory-item-batch" disabled name="batch_code" value="Generated on save" readonly data-field-input="batch" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div role="group" class="field" data-field="category" data-field-group="category">
                  <div class="flex items-center justify-between gap-4">
                    <label class="label" for="inventory-item-category">Category</label>
                    <button type="button" class="hidden text-xs font-medium text-primary" data-edit-field="category">Edit</button>
                  </div>
                  <select class="w-full select" id="inventory-item-category" name="category" disabled data-field-input="category" aria-describedby="category-error">
                    <option value="">Select category</option>
                    <option value="sacks">Sacks</option>
                    <option value="twines">Twines</option>
                  </select>
                  <p id="category-error" class="hidden text-sm text-destructive" role="alert" data-field-error="category"></p>
                </div>

                <div role="group" class="field" data-field="base_uom" data-field-group="base_uom">
                  <div class="flex items-center justify-between gap-4">
                    <label class="label" for="inventory-item-unit">Unit / Measurement</label>
                    <button type="button" class="hidden text-xs font-medium text-primary" data-edit-field="base_uom">Edit</button>
                  </div>
                  <select class="w-full select" id="inventory-item-unit" name="base_uom" disabled required data-field-input="base_uom" aria-describedby="base_uom-error">
                    <option value="">Select unit</option>
                    <option value="pieces">Pieces</option>
                    <option value="kilos">Kilos</option>
                  </select>
                  <p id="base_uom-error" class="hidden text-sm text-destructive" role="alert" data-field-error="base_uom"></p>
                </div>
              </div>

              <div role="group" class="field" data-field="supplier_id" data-field-group="supplier_id">
                <div class="flex items-center justify-between gap-4">
                  <label class="label" for="inventory-item-supplier">Supplier</label>
                  <button type="button" class="hidden text-xs font-medium text-primary" data-edit-field="supplier_id">Edit</button>
                </div>
                <select class="w-full select" id="inventory-item-supplier" name="supplier_id" disabled required data-field-input="supplier_id" aria-describedby="supplier_id-error">
                  <option value="">Select supplier</option>
                  <?php foreach ($suppliers as $supplier): ?>
                    <option value="<?= htmlspecialchars((string) ($supplier['id'] ?? ''), ENT_QUOTES, 'UTF-8') ?>"><?= htmlspecialchars((string) ($supplier['company_name'] ?? ''), ENT_QUOTES, 'UTF-8') ?></option>
                  <?php endforeach; ?>
                </select>
                <p id="supplier_id-error" class="hidden text-sm text-destructive" role="alert" data-field-error="supplier_id"></p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div role="group" class="field" data-field="quantity_received">
                  <label class="label" for="inventory-item-quantity">Quantity</label>
                  <input class="w-full input" type="number" id="inventory-item-quantity" name="quantity_received" min="0.01" step="0.01" placeholder="0.00" required data-field-input="quantity_received" aria-describedby="quantity_received-error" />
                  <p id="quantity_received-error" class="hidden text-sm text-destructive" role="alert" data-field-error="quantity_received"></p>
                </div>

                <div role="group" class="field" data-field="unit_cost">
                  <label class="label" for="inventory-item-cost">Total Procurement Cost</label>
                  <input class="w-full input" type="number" id="inventory-item-cost" name="unit_cost" min="0.01" step="0.01" placeholder="0.00" required data-field-input="unit_cost" aria-describedby="unit_cost-error" />
                  <p id="unit_cost-error" class="hidden text-sm text-destructive" role="alert" data-field-error="unit_cost"></p>
                </div>
              </div>
            </div>
        </fieldset>
      </form>
    </section>

    <footer>
      <button class="btn-outline" type="button" onclick="this.closest('dialog').close()">Cancel</button>
      <button class="btn" type="submit" form="inventory-form" data-save-button>Save stock</button>
    </footer>

    <button type="button" aria-label="Close dialog" onclick="this.closest('dialog').close()">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
  </div>
</dialog>