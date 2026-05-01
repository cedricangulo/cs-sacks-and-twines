import { fetchJson } from '../utils/fetch-utils.js';
import { escapeHtml, renderEmptyState } from '../utils/dom-utils.js';
import { formatDate } from '../utils/date-utils.js';
import { formatCurrency } from '../utils/format.js';

let lastSignature = [];

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
 * Render batch subtable rows.
 *
 * @param {Array<Record<string, unknown>>} batches
 * @returns {string}
 */
function renderBatchRows(batches) {
  if (batches.length === 0) {
    return `
      <tr>
        <td colspan="8" class="py-4 px-6 type-sm text-muted-foreground text-center">
          No batches found.
        </td>
      </tr>
    `;
  }

  return batches.map((batch) => `
    <tr class="bg-muted/10">
      <td></td>
      <td class="type-xs font-medium">${escapeHtml(batch.batch_code ?? '')}</td>
      <td>${escapeHtml(batch.supplier_name ?? '')}</td>
      <td class="text-right">${formatCurrency(batch.unit_cost)}</td>
      <td>${escapeHtml(batch.quantity_received ?? '')}</td>
      <td class="text-right">${escapeHtml(batch.quantity_remaining ?? '')}</td>
      <td><span class="badge-${escapeHtml((batch.status ?? 'active') === 'active' ? 'success' : 'destructive')}">${escapeHtml(batch.status ?? '')}</span></td>
      <td>${formatDate(batch.created_at)}</td>
    </tr>
  `).join('');
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
      <td class="pl-6">
        ${imageHtml}
      </td>
      <td>
        <div class="flex items-center gap-2">
          <svg class="chevron-icon size-4 shrink-0 text-muted-foreground transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          <span>${escapeHtml(product.sku_code ?? '')}</span>
        </div>
      </td>
      <td class="font-medium">${escapeHtml(product.name ?? '')}</td>
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
      if (event.target.closest('.see-more-btn')) {
        event.stopPropagation();
        await handleSeeMore(row);
        return;
      }

      const isExpanded = row.getAttribute('data-expanded') === 'true';

      if (isExpanded) {
        collapseRow(row);
      } else {
        expandRow(row);
      }
    });
  });
}

/**
 * Expand a product row to show batches.
 *
 * @param {HTMLElement} row
 */
async function expandRow(row) {
  const productId = row.getAttribute('data-product-id');
  const currentStock = row.getAttribute('data-current-quantity');
  const chevron = row.querySelector('.chevron-icon');

  if (!productId) return;

  if (chevron) {
    chevron.style.transform = 'rotate(90deg)';
  }

  row.setAttribute('data-expanded', 'true');
  row.classList.add('bg-muted/30');

  const detailsRow = document.createElement('tr');
  detailsRow.className = 'batch-details-row';
  detailsRow.setAttribute('data-product-id', productId);
  detailsRow.innerHTML = `
    <td colspan="8" class="p-0">
      <div class="pl-6 pr-6 py-2 space-y-2">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th></th>
                <th>Batch Code</th>
                <th>Supplier</th>
                <th class="text-right">Unit Cost</th>
                <th>Qty Received</th>
                <th class="text-right">Qty Remaining</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody class="batch-tbody" data-product-id="${productId}">
              <tr>
                <td colspan="8" class="py-4 text-center type-sm text-muted-foreground">Loading batches...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </td>
  `;

  row.after(detailsRow);

  try {
    const batches = await getBatches(parseInt(productId, 10));
    const totalCount = await getBatchCount(parseInt(productId, 10));
    const tbody = detailsRow.querySelector('.batch-tbody');

    if (tbody) {
      tbody.innerHTML = renderBatchRows(batches);

      if (totalCount > 3) {
        const seeMoreRow = document.createElement('tr');
        seeMoreRow.className = 'bg-muted/20';
        seeMoreRow.innerHTML = `
          <td colspan="8" class="text-center py-2">
            <button type="button" class="see-more-btn btn-ghost type-xs" data-product-id="${productId}" data-loaded="3" data-total="${totalCount}">
              Show all ${totalCount} batches
            </button>
          </td>
        `;
        tbody.after(seeMoreRow);
      }
    }
  } catch (error) {
    console.error('Failed to load batches:', error);
    const tbody = detailsRow.querySelector('.batch-tbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="py-4 text-center type-sm text-destructive">
            Failed to load batches.
          </td>
        </tr>
      `;
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
 * Handle "See More" button click to load all batches.
 *
 * @param {HTMLElement} row
 */
async function handleSeeMore(row) {
  const productId = row.getAttribute('data-product-id');
  if (!productId) return;

  const tbody = document.querySelector(`.batch-tbody[data-product-id="${productId}"]`);
  const button = row.querySelector('.see-more-btn');

  if (button) {
    button.disabled = true;
    button.textContent = 'Loading...';
  }

  try {
    const batches = await getBatches(parseInt(productId), 50, 0);

    if (tbody) {
      tbody.innerHTML = renderBatchRows(batches);
    }

    const seeMoreRow = button?.closest('tr');
    if (seeMoreRow) {
      seeMoreRow.remove();
    }
  } catch (error) {
    console.error('Failed to load more batches:', error);
    if (button) {
      button.disabled = false;
      button.textContent = 'Try again';
    }
  }
}
