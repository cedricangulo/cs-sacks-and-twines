import { fetchJson } from '../utils/fetch-utils.js';
import { escapeHtml, renderEmptyState } from '../utils/dom-utils.js';
import { formatCurrency } from '../utils/format.js';
import {
  renderBatchRows,
  renderBatchDetailRow,
  renderBatchShowMore,
  renderBatchError,
} from './render-batches.js';
import { createClientTable, renderSortIndicator } from '../utils/data-table.js';

let lastSignature = [];
let allProducts = [];
let batchSortState = {};

export async function getProductsForCombobox() {
  const elem = document.querySelector('[data-api-url]');
  const apiUrl = elem?.getAttribute('data-api-url') || '/api/products';
  const payload = await fetchJson(apiUrl);

  if (!Array.isArray(payload)) {
    throw new Error('Products API returned an unexpected response.');
  }

  return payload;
}

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

  const uploadsBase = (() => {
    const apiElem = document.querySelector('[data-api-url]');
    const api = apiElem?.getAttribute('data-api-url') || '/api';
    const pathname = new URL(api, window.location.origin).pathname;
    const idx = pathname.indexOf('/api');
    return idx !== -1 ? pathname.slice(0, idx) : '';
  })();

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

async function getProducts() {
  const container = document.getElementById('products-container');
  const apiUrl = container?.getAttribute('data-api-url') || '/api/products';

  const payload = await fetchJson(apiUrl);

  if (!Array.isArray(payload)) {
    throw new Error('Products API returned an unexpected response.');
  }

  return payload;
}

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

function sortBatches(batches, key, dir) {
  const direction = dir === 'asc' ? 1 : -1;

  return [...batches].sort((a, b) => {
    let va = a[key];
    let vb = b[key];

    if (va == null) va = '';
    if (vb == null) vb = '';

    // Skip numeric check for date-like strings (YYYY-MM-DD or with time)
    const isDateLike = /^\d{4}-\d{2}-\d{2}/.test(va) && /^\d{4}-\d{2}-\d{2}/.test(vb);

    if (!isDateLike) {
      const na = parseFloat(va);
      const nb = parseFloat(vb);
      if (!isNaN(na) && !isNaN(nb)) {
        return (na - nb) * direction;
      }
    }

    return String(va).localeCompare(String(vb), undefined, { numeric: true }) * direction;
  });
}

function applyBatchSorting(productId, batches) {
  const state = batchSortState[productId];
  if (!state || !state.key) return batches;

  return sortBatches(batches, state.key, state.dir);
}

function bindBatchSortHeaders(productId, container) {
  const detailRow = container.querySelector(`.batch-details-row[data-product-id="${productId}"]`);
  if (!detailRow) return;

  const headers = detailRow.querySelectorAll('th[data-batch-sort]');
  headers.forEach((th) => {
    const key = th.getAttribute('data-batch-sort');

    const updateIndicators = () => {
      const current = batchSortState[productId] || {};
      detailRow.querySelectorAll('th[data-batch-sort]').forEach((other) => {
        const otherKey = other.getAttribute('data-batch-sort');
        const isThisOther = other === th;
        renderSortIndicator(other, isThisOther && current.key === key, isThisOther && current.key === key ? current.dir : '');
      });
    };

    updateIndicators();

    th.style.cursor = 'pointer';
    th.classList.add('select-none');
    th.addEventListener('click', () => {
      const current = batchSortState[productId] || {};
      if (current.key === key) {
        batchSortState[productId] = { key, dir: current.dir === 'asc' ? 'desc' : 'asc' };
      } else {
        batchSortState[productId] = { key, dir: 'asc' };
      }

      updateIndicators();
      refreshBatchRows(productId);
    });
  });
}

async function refreshBatchRows(productId) {
  const container = document.getElementById('products-container');
  if (!container) return;

  const detailRow = container.querySelector(`.batch-details-row[data-product-id="${productId}"]`);
  if (!detailRow) return;

  const tbody = detailRow.querySelector('.batch-tbody');
  const seeMoreRow = detailRow.querySelector('.see-more-row');
  if (!tbody) return;

  try {
    const totalCount = await getBatchCount(parseInt(productId, 10));
    const allBatches = await getBatches(parseInt(productId, 10), 50, 0);
    const sorted = applyBatchSorting(productId, allBatches);

    tbody.innerHTML = renderBatchRows(sorted);

    if (seeMoreRow) seeMoreRow.remove();
  } catch (error) {
    console.error('Failed to refresh batches:', error);
  }
}

export function renderProducts(products) {
  if (products.length === 0) {
    return renderEmptyState('products');
  }

  return products.map((product) => {
    const firstTwo = (product.name ?? '').slice(0, 2).toUpperCase();
    const uploadsBase = (() => {
      const apiElem = document.querySelector('[data-api-url]');
      const api = apiElem?.getAttribute('data-api-url') || '/api';
      const pathname = new URL(api, window.location.origin).pathname;
      const idx = pathname.indexOf('/api');
      return idx !== -1 ? pathname.slice(0, idx) : '';
    })();

    const imageHtml = product.image_path
      ? `<img src="${uploadsBase}/public/uploads/products/${escapeHtml(product.image_path)}" class="size-10 object-cover rounded-(--radius)" alt="${escapeHtml(product.name ?? '')}" />`
      : `<div class="size-10 rounded-(--radius) bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">${firstTwo}</div>`;
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

function buildSignature(products) {
  return products
    .map((product) => `${product.product_id ?? ''}|${product.updated_at ?? ''}`)
    .join('|');
}

let table;

export function initProductsTable() {
  table = createClientTable({
    container: '#products-container',
    fetchFn: getProducts,
    renderFn: renderProducts,
    sortableColumns: [
      { key: 'name', column: 'name' },
      { key: 'sku_code', column: 'sku_code' },
      { key: 'category', column: 'category' },
      { key: 'base_uom', column: 'base_uom' },
      { key: 'current_quantity', column: 'current_quantity' },
      { key: 'total_asset_value', column: 'total_asset_value' },
      { key: 'status', column: 'status' },
    ],
    filterBar: {
      id: 'inventory',
      searchPlaceholder: 'Search products...',
      selects: [
        {
          key: 'category',
          label: 'All categories',
          options: [
            { value: 'sacks', label: 'Sacks' },
            { value: 'twines', label: 'Twines' },
          ],
        },
        {
          key: 'status',
          label: 'All status',
          options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ],
        },
      ],
    },
    filterFn: (data, filters) => {
      const urlParams = new URLSearchParams(window.location.search);
      const category = urlParams.get('category') || '';
      const status = urlParams.get('status') || '';
      const q = (filters.search || urlParams.get('search') || '').toLowerCase();

      return data.filter((item) => {
        if (q !== '') {
          const name = (item.name || '').toLowerCase();
          const sku = (item.sku_code || '').toLowerCase();
          if (!name.includes(q) && !sku.includes(q)) return false;
        }
        if (category !== '' && (item.category || '') !== category) return false;
        if (status !== '' && (item.status || '') !== status) return false;
        return true;
      });
    },
    afterRender: () => {
      const container = document.getElementById('products-container');
      if (container) initAccordion(container);
    },
    id: 'inventory',
  });

  table.init();
}

export async function loadProducts(options = {}) {
  if (table) {
    if (options.force) {
      table.load();
    }
    return;
  }

  const container = document.getElementById('products-container');
  if (!container) {
    return;
  }

  try {
    const products = await getProducts();
    allProducts = products;
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

function initAccordion(container) {
  const rows = container.querySelectorAll('.product-row');

  rows.forEach((row) => {
    row.addEventListener('click', async (event) => {
      if (event.target.closest('.see-more-btn')) return;
      if (event.target.closest('[data-batch-actions]') || event.target.closest('[data-batch-action]') || event.target.closest('[data-batch-menu]')) return;

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
      return;
    }

    const toggleBtn = event.target.closest('[data-batch-actions]');
    if (toggleBtn) {
      event.stopPropagation();
      const batchId = toggleBtn.getAttribute('data-batch-actions');
      const menu = container.querySelector(`[data-batch-menu="${batchId}"]`);
      if (!menu) return;

      const isOpen = !menu.classList.contains('hidden');
      container.querySelectorAll('[data-batch-menu]').forEach((m) => m.classList.add('hidden'));
      container.querySelectorAll('[data-batch-actions]').forEach((b) => b.setAttribute('aria-expanded', 'false'));

      if (!isOpen) {
        const rect = toggleBtn.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.left = `${rect.right - 144}px`;
        menu.classList.remove('hidden');
        toggleBtn.setAttribute('aria-expanded', 'true');
      }
      return;
    }

    const actionBtn = event.target.closest('[data-batch-action]');
    if (actionBtn) {
      event.stopPropagation();
      const action = actionBtn.getAttribute('data-batch-action');
      const batchId = actionBtn.getAttribute('data-batch-id');
      container.querySelectorAll('[data-batch-menu]').forEach((m) => m.classList.add('hidden'));
      container.querySelectorAll('[data-batch-actions]').forEach((b) => b.setAttribute('aria-expanded', 'false'));

      if (action === 'edit') {
        // edit batch action
        console.log(`Edit batch ${batchId} - functionality not implemented yet.`);
      } else if (action === 'void') {
        // void batch action
        console.log(`Void batch ${batchId} - functionality not implemented yet.`);
      }
      return;
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-batch-actions]') && !event.target.closest('[data-batch-menu]')) {
      container.querySelectorAll('[data-batch-menu]').forEach((m) => m.classList.add('hidden'));
      container.querySelectorAll('[data-batch-actions]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    }
  });
}

async function expandRow(row) {
  const productId = row.getAttribute('data-product-id');
  const chevron = row.querySelector('.chevron-icon');

  if (!productId) return;

  if (chevron) {
    chevron.style.transform = 'rotate(180deg)';
  }

  row.setAttribute('data-expanded', 'true');
  // row.classList.add('bg-muted/30');

  const detailsRow = document.createElement('tr');
  detailsRow.className = 'batch-details-row';
  detailsRow.setAttribute('data-product-id', productId);
  detailsRow.innerHTML = renderBatchDetailRow(productId);
  detailsRow.classList.add('hover:bg-transparent!');

  row.after(detailsRow);
  bindBatchSortHeaders(productId, document.getElementById('products-container'));

  try {
    const batches = await getBatches(parseInt(productId, 10));
    const totalCount = await getBatchCount(parseInt(productId, 10));
    const tbody = detailsRow.querySelector('.batch-tbody');
    const sorted = applyBatchSorting(productId, batches);

    if (tbody) {
      tbody.innerHTML = renderBatchRows(sorted);

      if (totalCount > 3) {
        const seeMoreRow = document.createElement('tr');
        seeMoreRow.className = 'see-more-row';
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

function collapseRow(row) {
  const productId = row.getAttribute('data-product-id');
  const chevron = row.querySelector('.chevron-icon');

  if (chevron) {
    chevron.style.transform = 'rotate(0deg)';
  }

  row.setAttribute('data-expanded', 'false');
  // row.classList.remove('bg-muted/30');

  const detailsRow = document.querySelector(`.batch-details-row[data-product-id="${productId}"]`);
  if (detailsRow) {
    detailsRow.remove();
  }
}

async function handleSeeMore(button) {
  const productId = button.getAttribute('data-product-id');
  if (!productId) return;

  const tbody = document.querySelector(`.batch-tbody[data-product-id="${productId}"]`);
  const seeMoreRow = button.closest('tr');

  button.disabled = true;
  button.textContent = 'Loading...';

  try {
    const batches = await getBatches(parseInt(productId), 50, 0);
    const sorted = applyBatchSorting(productId, batches);

    if (tbody) {
      tbody.innerHTML = renderBatchRows(sorted);
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
