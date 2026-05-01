<?php
if (!isset($products) || !is_array($products)) { $products = []; }
if (!isset($suppliers) || !is_array($suppliers)) { $suppliers = []; }
?>

<dialog id="add-inventory-dialog" class="w-full dialog sm:max-w-5xl max-h-164" aria-labelledby="add-inventory-dialog-title" aria-describedby="add-inventory-dialog-description" data-inventory-dialog onclick="if (event.target === this) this.close()">
  <div class="max-w-5xl">
    <header>
      <h2 id="add-inventory-dialog-title">Add Inventory</h2>
      <p id="add-inventory-dialog-description">Select an existing item for fast stock entry or create a new item inline.</p>
    </header>

    <section class="overflow-y-auto scrollbar">
      <form id="inventory-form" class="form pb-4" data-inventory-form action="<?= htmlspecialchars(routeUrl('/api/stock-in'), ENT_QUOTES, 'UTF-8') ?>" method="POST" novalidate>
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
                        $productId = (string) ($product['product_id'] ?? '');
                        $productName = (string) ($product['name'] ?? '');
                        $productSku = (string) ($product['sku_code'] ?? '');
                        $productCategory = (string) ($product['category'] ?? '');
                        $productUnit = (string) ($product['base_uom'] ?? '');
                        $productWeight = (string) ($product['weight_per_unit'] ?? '');
                        $productImage = (string) ($product['image_path'] ?? '');
                        $defaultSupplierId = (string) ($product['default_supplier_id'] ?? '');
                        $productLowStockThreshold = (string) ($product['low_stock_threshold'] ?? '0.00');
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
                          data-weight="<?= htmlspecialchars($productWeight, ENT_QUOTES, 'UTF-8') ?>"
                          data-image="<?= htmlspecialchars($productImage, ENT_QUOTES, 'UTF-8') ?>"
                          data-supplier-id="<?= htmlspecialchars($defaultSupplierId, ENT_QUOTES, 'UTF-8') ?>"
                          data-low-stock-threshold="<?= htmlspecialchars($productLowStockThreshold, ENT_QUOTES, 'UTF-8') ?>"
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
                  <label class="label" for="dropzone-file">Item Image</label>
                  <button type="button" class="hidden text-xs font-medium text-primary" data-edit-field="image">Edit</button>
                </div>
                <div id="image-upload-container">
                  <div id="image-upload-area" class="flex items-center justify-center w-full">
                    <div class="flex flex-col items-center justify-center w-full h-40 bg-muted border border-dashed border-border rounded-base">
                      <div class="flex flex-col items-center justify-center text-body text-center">
                        <svg class="w-8 h-8 mb-2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v9m-5 0H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2M8 9l4-5 4 5m1 8h.01" />
                        </svg>
                        <p class="mb-1 text-sm">Click the button below to upload</p>
                        <p class="text-xs mb-3">Max. File Size: <span class="font-semibold">5MB</span></p>
                        <button type="button" onclick="document.getElementById('dropzone-file').click()" class="inline-flex items-center btn text-white bg-primary hover:bg-primary-strong">
                          <svg class="w-4 h-4 me-1.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                          </svg>
                          Browse file
                        </button>
                      </div>
                    </div>
                    <input id="dropzone-file" type="file" class="hidden" name="image" accept="image/jpeg,image/png" disabled data-field-input="image" data-image-input />
                  </div>
                </div>
                <div id="image-preview-container" class="hidden w-full h-40 rounded-base border border-border overflow-hidden relative">
                  <img id="image-preview-img" class="block w-auto h-full object-cover mx-auto" src="" alt="" />
                  <button type="button" id="remove-image-btn" class="absolute top-2 right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive-strong" title="Remove image">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
                <p id="image-error" class="hidden text-sm text-destructive" role="alert" data-field-error="image"></p>
                <p class="text-xs text-muted-foreground" data-image-preview-message></p>
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
                    <option value="piece">Piece</option>
                    <option value="roll">Roll</option>
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
                    <option value="<?= htmlspecialchars((string) ($supplier['supplier_id'] ?? ''), ENT_QUOTES, 'UTF-8') ?>"><?= htmlspecialchars((string) ($supplier['company_name'] ?? ''), ENT_QUOTES, 'UTF-8') ?></option>
                  <?php endforeach; ?>
                </select>
                <p id="supplier_id-error" class="hidden text-sm text-destructive" role="alert" data-field-error="supplier_id"></p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div role="group" class="field" data-field="weight_per_unit" data-field-group="weight_per_unit">
                  <div class="flex items-center justify-between gap-4">
                    <label class="label" for="inventory-item-weight">Weight per Unit (kg)</label>
                    <button type="button" class="hidden text-xs font-medium text-primary" data-edit-field="weight_per_unit">Edit</button>
                  </div>
                  <input class="w-full input" type="number" id="inventory-item-weight" name="weight_per_unit" step="0.0001" placeholder="Optional" disabled data-field-input="weight_per_unit" aria-describedby="weight_per_unit-error" />
                  <p id="weight_per_unit-error" class="hidden text-sm text-destructive" role="alert" data-field-error="weight_per_unit"></p>
                </div>

                <div role="group" class="field" data-field="quantity_received">
                  <label class="label" for="inventory-item-quantity">Quantity</label>
                  <input class="w-full input" type="number" id="inventory-item-quantity" name="quantity_received" min="0.01" step="0.01" placeholder="0.00" required data-field-input="quantity_received" aria-describedby="quantity_received-error" />
                  <p id="quantity_received-error" class="hidden text-sm text-destructive" role="alert" data-field-error="quantity_received"></p>
                </div>
              </div>

              <div role="group" class="field" data-field="total_procurement_cost">
                <label class="label" for="inventory-item-cost">Total Procurement Cost</label>
                <input class="w-full input" type="number" id="inventory-item-cost" name="total_procurement_cost" min="0.01" step="0.01" placeholder="0.00" required data-field-input="total_procurement_cost" aria-describedby="total_procurement_cost-error" />
                <p id="total_procurement_cost-error" class="hidden text-sm text-destructive" role="alert" data-field-error="total_procurement_cost"></p>
              </div>

              <div role="group" class="field" data-field="low_stock_threshold" data-field-group="low_stock_threshold">
                <div class="flex items-center justify-between gap-4">
                  <label class="label" for="inventory-item-low-stock">Low Stock Threshold</label>
                  <button type="button" class="hidden text-xs font-medium text-primary" data-edit-field="low_stock_threshold">Edit</button>
                </div>
                <input class="w-full input" type="number" id="inventory-item-low-stock" name="low_stock_threshold" min="0" step="0.01" value="0.00" placeholder="0.00" disabled data-field-input="low_stock_threshold" aria-describedby="low_stock_threshold-error" />
                <p id="low_stock_threshold-error" class="hidden text-sm text-destructive" role="alert" data-field-error="low_stock_threshold"></p>
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
