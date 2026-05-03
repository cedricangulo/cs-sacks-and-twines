/**
 * @module inventory/render
 * Batch table rendering functions for inventory accordion.
 */
import { escapeHtml, getBasePath, renderEmptyState, renderLoadingRow } from '../utils/dom-utils.js';
import { formatDate } from '../utils/date-utils.js';
import { formatCurrency, getInitials } from '../utils/format.js';

/**
 * Render batch table header.
 *
 * @code INV-renderBatchHeader
 * @returns {string}
 */
export function renderBatchHeader() {
  const tableHeaders = [
    { key: 'batch_code', label: 'Batch Code', align: 'left' },
    { key: 'supplier_name', label: 'Supplier', align: 'left' },
    { key: 'unit_cost', label: 'Unit Cost', align: 'right' },
    { key: 'quantity_received', label: 'Qty Received', align: 'right' },
    { key: 'quantity_remaining', label: 'Qty Remaining', align: 'right' },
    { key: 'status', label: 'Status', align: 'left' },
    { key: 'created_at', label: 'Created At', align: 'left' },
  ];

  return `
    <thead>
      <tr>
        ${tableHeaders.map(header => `
          <th data-batch-sort="${header.key}" class="text-muted-foreground/80 dark:text-muted-foreground font-normal ${header.align === 'right' ? 'text-right' : ''}">
            ${escapeHtml(header.label)}
          </th>
        `).join('')}
        <th class="w-fit"></th>
      </tr>
    </thead>
  `;
}

/**
 * Render batch table rows.
 *
 * @code INV-renderBatchRows
 * @param {Array<Record<string, unknown>>} batches
 * @returns {string}
 */
export function renderBatchRows(batches) {
  if (batches.length === 0) {
    return renderEmptyState('batches');
  }

  return batches.map((batch) => {
    const batchId = escapeHtml(batch.batch_id ?? '');
    const batchStatus = String(batch.status ?? 'active');
    const statusLabel = batchStatus.charAt(0).toUpperCase() + batchStatus.slice(1);
    const canVoid = batchStatus === 'active';
    const canManage = batchStatus === 'active';
    return `
    <tr>
      <td class="type-xs font-medium">${escapeHtml(batch.batch_code ?? '')}</td>
      <td>${escapeHtml(batch.supplier_name ?? '')}</td>
      <td class="text-right">${formatCurrency(batch.unit_cost)}</td>
      <td class="text-right">${escapeHtml(batch.quantity_received ?? '')}</td>
      <td class="text-right">${escapeHtml(batch.quantity_remaining ?? '')}</td>
      <td><span class="badge-${escapeHtml(batchStatus === 'active' ? 'success' : batchStatus === 'voided' ? 'destructive' : 'secondary')}">${escapeHtml(statusLabel)}</span></td>
      <td>${formatDate(batch.created_at)}</td>
      <td class="relative">
        ${canManage ? `
        <button
          type="button"
          class="btn-icon-ghost"
          data-batch-actions="${batchId}"
          aria-label="Batch actions"
          aria-expanded="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="6" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="18" r="1"/></svg>
        </button>
        <div
          class="hidden fixed z-50 w-36 border bg-popover rounded-(--radius-md) shadow-md"
          data-batch-menu="${batchId}"
          role="menu">
          <ul class="p-1 text-sm">
            <li>
              <button
                type="button"
                class="w-full text-left px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                data-batch-action="edit"
                data-batch-id="${batchId}"
                role="menuitem">
                Edit
              </button>
            </li>
            <li>
              <button
                type="button"
                class="w-full text-left px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                data-batch-action="void"
                data-batch-id="${batchId}"
                ${canVoid ? '' : 'disabled aria-disabled="true" title="Only active batches can be voided."'}
                role="menuitem">
                Void
              </button>
            </li>
          </ul>
        </div>
        ` : ``}
      </td>
    </tr>
  `;
  }).join('');
}

/**
 * Render a batch error row.
 *
 * @code INV-renderBatchError
 * @param {string} [message]
 * @returns {string}
 */
export function renderBatchError(message = 'Failed to load batches.') {
  return `
    <tr>
      <td colspan="8" class="py-4 text-center type-sm text-destructive">
        ${escapeHtml(message)}
      </td>
    </tr>
  `;
}

/**
 * Render the show more button row for batch pagination.
 *
 * @code INV-renderBatchShowMore
 * @param {string} productId
 * @param {number} loaded
 * @param {number} total
 * @returns {string}
 */
export function renderBatchShowMore(productId, loaded, total) {
  return `
    <tr>
      <td colspan="8" class="text-center py-2">
        <button
          type="button"
          class="see-more-btn btn-ghost type-xs"
          data-product-id="${productId}"
          data-loaded="${loaded}"
          data-total="${total}"
        >
          Show all ${total} batches
        </button>
      </td>
    </tr>
  `;
}

/**
 * Render a batch detail row container.
 *
 * @code INV-renderBatchDetailRow
 * @param {string} productId
 * @returns {string}
 */
export function renderBatchDetailRow(productId) {
  return `
    <td colspan="8">
      <div class="px-12 space-y-2">
        <div class="overflow-x-auto overflow-y-hidden">
          <table class="table">
            ${renderBatchHeader()}
            <tbody class="batch-tbody" data-product-id="${productId}">
              ${renderLoadingRow(8)}
            </tbody>
          </table>
        </div>
      </div>
    </td>
  `;
}

/**
 * Render a single combobox option for a product.
 *
 * @code INV-renderComboboxOption
 * @param {Record<string, unknown>} product
 * @returns {string}
 */
export function renderComboboxOption(product) {
  const productId = String(product.product_id ?? '');
  const productName = String(product.name ?? '');
  const productSku = String(product.sku_code ?? '');
  const productCategory = String(product.category ?? '');
  const productUnit = String(product.base_uom ?? '');
  const productWeight = String(product.weight_per_unit ?? '');
  const productImage = String(product.image_path ?? '');
  const defaultSupplierId = String(product.default_supplier_id ?? '');
  const productLowStockThreshold = String(product.low_stock_threshold ?? '0.00');
  const filterText = `${productName} ${productSku} ${productCategory} ${productUnit}`;

  const uploadsBase = getBasePath();

  return `
    <div
      role="option"
      tabindex="0"
      class="flex-col items-start w-full gap-1 transition h-fit btn-ghost inventory-option"
      data-combobox-option
      data-value="${escapeHtml(productId)}"
      data-label="${escapeHtml(productName)}"
      data-sku="${escapeHtml(productSku)}"
      data-category="${escapeHtml(productCategory)}"
      data-unit="${escapeHtml(productUnit)}"
      data-weight="${escapeHtml(productWeight)}"
      data-image="${escapeHtml(productImage)}"
      data-supplier-id="${escapeHtml(defaultSupplierId)}"
      data-low-stock-threshold="${escapeHtml(productLowStockThreshold)}"
      data-filter="${escapeHtml(filterText)}">
      <h4 class="font-medium type-base text-foreground">${escapeHtml(productName)}</h4>
      <div class="type-xs text-muted-foreground">${escapeHtml(productSku)} · ${escapeHtml(productCategory)} · ${escapeHtml(productUnit)}</div>
    </div>
  `;
}

/**
 * Render inventory products table markup.
 *
 * @code INV-renderProducts
 * @param {Array<Record<string, unknown>>} products
 * @returns {string}
 */
export function renderProducts(products) {
  if (products.length === 0) {
    return renderEmptyState('products');
  }

  return products.map((product) => {
    const uploadsBase = getBasePath();

    const imageHtml = product.image_path
      ? `<img src="${uploadsBase}/public/uploads/products/${escapeHtml(product.image_path)}" class="size-10 object-cover rounded-(--radius)" alt="${escapeHtml(product.name ?? '')}" />`
      : `<div class="size-10 rounded-(--radius) bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">${getInitials(product.name)}</div>`;
    const isLowStock = (parseFloat(product.current_quantity) || 0) < (parseFloat(product.low_stock_threshold) || 0);

    return `
    <tr class="product-row cursor-pointer transition-colors" data-product-id="${product.product_id}" data-current-quantity="${product.current_quantity}">
      <td class="pl-2 flex gap-2 items-center">
        <svg class="chevron-icon size-4 shrink-0 text-muted-foreground transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        ${imageHtml}
        <span class="font-medium">${escapeHtml(product.name ?? '')}</span>
      </td>
      <td class="type-sm font-mono font-medium">${escapeHtml(product.sku_code ?? '')}</td>
      <td>${escapeHtml(product.category ?? '')}</td>
      <td>${escapeHtml(product.base_uom ?? '')}</td>
      <td class="text-right">${escapeHtml(product.current_quantity ?? '')}</td>
      <td class="text-right">${formatCurrency(product.total_asset_value)}</td>
      <td><span class="badge-${escapeHtml((product.status ?? 'active') === 'active' ? 'success' : 'secondary')}">${escapeHtml(product.status ?? '')}</span></td>
      <td>${isLowStock ? '<span class="badge-destructive">Low</span>' : ''}</td>
    </tr>
  `;
  }).join('');
}

/**
 * Refresh the combobox options with current products.
 *
 * @code INV-refreshComboboxOptions
 * @param {{ fillExistingItem?: (option: HTMLElement) => void }} [handlers]
 * @returns {Promise<HTMLElement[]>}
 */
export async function refreshComboboxOptions(handlers = {}) {
  const listbox = document.getElementById('inventory-item-listbox');
  if (!listbox) {
    return [];
  }

  const addNewButton = listbox.querySelector('[data-add-new-item]');
  const products = await getProductsForCombobox();

  const optionsHtml = products.map(renderComboboxOption).join('');

  if (addNewButton) {
    addNewButton.insertAdjacentHTML('beforebegin', optionsHtml);
  } else {
    listbox.innerHTML = optionsHtml;
  }

  const newOptions = Array.from(listbox.querySelectorAll('[data-combobox-option]'));

  if (handlers.fillExistingItem) {
    newOptions.forEach((option) => {
      option.addEventListener('click', () => handlers.fillExistingItem(option));
      option.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handlers.fillExistingItem(option);
        }
      });
    });
  }

  return newOptions;
}

/**
 * Build a signature string for product list equality.
 *
 * @code INV-buildSignature
 * @param {Array<Record<string, unknown>>} products
 * @returns {string}
 */
export function buildSignature(products) {
  return products
    .map((product) => `${product.product_id ?? ''}|${product.updated_at ?? ''}`)
    .join('|');
}
