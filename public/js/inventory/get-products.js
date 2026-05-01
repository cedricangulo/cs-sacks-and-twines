import { fetchJson } from '../utils/fetch-utils.js';
import { escapeHtml, renderEmptyState } from '../utils/dom-utils.js';
import { formatCurrency } from '../utils/format.js';
import {
  renderBatchRows,
  renderBatchDetailRow,
  renderBatchShowMore,
  renderBatchError,
} from './render-batches.js';

let lastSignature = [];

/**
 * Fetch all products for the combobox (includes supplier info).
 *
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function getProductsForCombobox() {
  const apiUrl = '/cs-sacks-and-twines/api/products';
  const payload = await fetchJson(apiUrl);

  if (!Array.isArray(payload)) {
    throw new Error('Products API returned an unexpected response.');
  }

  return payload;
}

/**
 * Render a single combobox option element.
 *
 * @param {Record<string, unknown>} product
 * @returns {string}
 */
function renderComboboxOption(product) {
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
 * Refresh the inventory combobox options with latest products.
 *
 * @param {{ fillExistingItem?: function }} handlers - Optional handlers to attach to new options
 * @returns {Promise<Array<HTMLElement>>} New option elements
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
 * Fetch product data for the inventory table.
 *
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function getProducts() {
  const container = document.getElementById('products-container');
  const apiUrl = container?.getAttribute('data-api-url') || '/api/products';

  const payload = await fetchJson(apiUrl);

  if (!Array.isArray(payload)) {
    throw new Error('Products API returned an unexpected response.');
  }

  return payload;
}

/**
 * Fetch batches for a product.
 *
 * @param {number} productId
 * @param {number} [limit]
 * @param {number} [offset]
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function getBatches(productId, limit = 3, offset = 0) {
  const container = document.getElementById('products-container');
  const baseUrl = container?.getAttribute('data-batches-url') || '/api/inventory/batches';
  const url = `${baseUrl}?product_id=${productId}&limit=${limit}&offset=${offset}`;

  const payload = await fetchJson(url);

  if (!payload?.success || !Array.isArray(payload.batches)) {
    throw new Error('Failed to fetch batches.');
  }

  return payload.batches;
}

/**
 * Get total batch count for a product.
 *
 * @param {number} productId
 * @returns {Promise<number>}
 */
export async function getBatchCount(productId) {
  const container = document.getElementById('products-container');
  const baseUrl = container?.getAttribute('data-batches-count-url') || '/api/inventory/batches/count';
  const url = `${baseUrl}?product_id=${productId}`;

  const payload = await fetchJson(url);

  if (!payload?.success) {
    throw new Error('Failed to fetch batch count.');
  }

  return payload.count ?? 0;
}

/**
 * Render inventory products table rows.
 *
 * @param {Array<Record<string, unknown>>} products
 * @returns {string}
 */
export function renderProducts(products) {
  if (products.length === 0) {
    return renderEmptyState('products');
  }

  return products.map((product) => {
    const firstTwo = (product.name ?? '').slice(0, 2).toUpperCase();
    const imageHtml = product.image_path
      ? `<img src="/cs-sacks-and-twines/public/uploads/products/${escapeHtml(product.image_path)}" class="size-10 object-cover rounded" alt="" />`
      : `<div class="size-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">${firstTwo}</div>`;
    const isLowStock = (parseFloat(product.current_quantity) || 0) < (parseFloat(product.low_stock_threshold) || 0);

    return `
    <tr class="product-row cursor-pointer hover:bg-muted/50 transition-colors" data-product-id="${product.product_id}" data-current-quantity="${product.current_quantity}">
      <td class="pl-2 flex gap-2 items-center">
        <svg class="chevron-icon size-4 shrink-0 text-muted-foreground transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        ${imageHtml}
        <span class="font-medium">${escapeHtml(product.name ?? '')}</span>
      </td>
      <td><span>${escapeHtml(product.sku_code ?? '')}</span></td>
      <td>${escapeHtml(product.category ?? '')}</td>
      <td>${escapeHtml(product.base_uom ?? '')}</td>
      <td class="text-right">${escapeHtml(product.current_quantity ?? '')}</td>
      <td class="text-right">${formatCurrency(product.total_asset_value)}</td>
      <td><span class="badge-${escapeHtml((product.status ?? 'active') === 'active' ? 'success' : 'secondary')}">${escapeHtml(product.status ?? '')}</span></td>
      <td>${isLowStock ? '<span class="badge-destructive">Alert</span>' : ''}</td>
    </tr>
  `;
  }).join('');
}

/**
 * Build a signature for change detection.
 *
 * @param {Array<Record<string, unknown>>} products
 * @returns {string}
 */
function buildSignature(products) {
  return products
    .map((product) => `${product.product_id ?? ''}|${product.updated_at ?? ''}`)
    .join('|');
}

/**
 * Load products into the inventory table.
 *
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<void>}
 */
export async function loadProducts(options = {}) {
  const container = document.getElementById('products-container');
  if (!container) {
    return;
  }

  try {
    const products = await getProducts();
    const signature = buildSignature(products);

    if (!options.force && signature === lastSignature) {
      return;
    }

    lastSignature = signature;
    container.innerHTML = renderProducts(products);
    initAccordion(container);
  } catch (error) {
    console.error('Failed to load products:', error);
    container.innerHTML = renderEmptyState('error', 'Failed to load products', 'Please try again later.');
  }
}

/**
 * Initialize accordion behavior on product rows.
 *
 * @param {HTMLElement} container
 */
function initAccordion(container) {
  const rows = container.querySelectorAll('.product-row');

  rows.forEach((row) => {
    row.addEventListener('click', async (event) => {
      if (event.target.closest('.see-more-btn')) return;

      const isExpanded = row.getAttribute('data-expanded') === 'true';

      if (isExpanded) {
        collapseRow(row);
      } else {
        expandRow(row);
      }
    });
  });

  container.addEventListener('click', async (event) => {
    const seeMoreBtn = event.target.closest('.see-more-btn');

    if (seeMoreBtn) {
      event.stopPropagation();
      await handleSeeMore(seeMoreBtn);
    }
  });
}

/**
 * Expand a product row to show batches.
 *
 * @param {HTMLElement} row
 */
async function expandRow(row) {
  const productId = row.getAttribute('data-product-id');
  const chevron = row.querySelector('.chevron-icon');

  if (!productId) return;

  if (chevron) {
    chevron.style.transform = 'rotate(180deg)';
  }

  row.setAttribute('data-expanded', 'true');
  row.classList.add('bg-muted/30');

  const detailsRow = document.createElement('tr');
  detailsRow.className = 'batch-details-row';
  detailsRow.setAttribute('data-product-id', productId);
  detailsRow.innerHTML = renderBatchDetailRow(productId);

  row.after(detailsRow);

  try {
    const batches = await getBatches(parseInt(productId, 10));
    const totalCount = await getBatchCount(parseInt(productId, 10));
    const tbody = detailsRow.querySelector('.batch-tbody');

    if (tbody) {
      tbody.innerHTML = renderBatchRows(batches);

      if (totalCount > 3) {
        const seeMoreRow = document.createElement('tr');
        seeMoreRow.innerHTML = renderBatchShowMore(productId, 3, totalCount);
        tbody.after(seeMoreRow);
      }
    }
  } catch (error) {
    console.error('Failed to load batches:', error);
    const tbody = detailsRow.querySelector('.batch-tbody');
    if (tbody) {
      tbody.innerHTML = renderBatchError();
    }
  }
}

/**
 * Collapse a product row.
 *
 * @param {HTMLElement} row
 */
function collapseRow(row) {
  const productId = row.getAttribute('data-product-id');
  const chevron = row.querySelector('.chevron-icon');

  if (chevron) {
    chevron.style.transform = 'rotate(0deg)';
  }

  row.setAttribute('data-expanded', 'false');
  row.classList.remove('bg-muted/30');

  const detailsRow = document.querySelector(`.batch-details-row[data-product-id="${productId}"]`);
  if (detailsRow) {
    detailsRow.remove();
  }
}

/**
 * Handle "Show all" button click to load all batches.
 *
 * @param {HTMLButtonElement} button
 */
async function handleSeeMore(button) {
  const productId = button.getAttribute('data-product-id');
  if (!productId) return;

  const tbody = document.querySelector(`.batch-tbody[data-product-id="${productId}"]`);
  const seeMoreRow = button.closest('tr');

  button.disabled = true;
  button.textContent = 'Loading...';

  try {
    const batches = await getBatches(parseInt(productId), 50, 0);

    if (tbody) {
      tbody.innerHTML = renderBatchRows(batches);
    }

    if (seeMoreRow) {
      seeMoreRow.remove();
    }
  } catch (error) {
    console.error('Failed to load more batches:', error);
    button.disabled = false;
    button.textContent = 'Try again';
  }
}
