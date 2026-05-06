import { createClientTable, renderSortIndicator } from "../utils/data-table";
import { getBatchCount, getBatches, getProducts, sortBatches } from "./get-products";
import { renderBatchDetailRow, renderBatchRows, renderProducts } from "./render.js";
import { openEditBatchDialog } from './edit-inventory.js';
import { openVoidBatchDialog } from './void-batch.js';

let batchSortState = {};
let accordionBoundContainer = null;
let table;
let expandedProductId = null;

/**
 * Initialize the inventory products table.
 *
 * @code INV-initProductsTable
 * @returns {object} The table controller with load/refresh methods
 */
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
      if (container) {
        closeBatchMenus(container);
        initAccordion(container);
      }
    },
    id: 'inventory',
  });

  table.init();

  return table;
}

/**
 * Initialize accordion interactions for product rows.
 *
 * @code INV-initAccordion
 * @param {HTMLElement} container
 */
export function initAccordion(container) {
  if (accordionBoundContainer !== container) {
    accordionBoundContainer = container;
  }

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

  if (container.dataset.batchAccordionBound !== 'true') {
    container.dataset.batchAccordionBound = 'true';

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
        closeBatchMenus(container);

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
        if (actionBtn.disabled) {
          return;
        }
        const action = actionBtn.getAttribute('data-batch-action');
        const batchId = actionBtn.getAttribute('data-batch-id');
        closeBatchMenus(container);

        if (action === 'edit') {
          openEditBatchDialog(batchId);
        } else if (action === 'void') {
          openVoidBatchDialog(batchId);
        }
        return;
      }
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('[data-batch-actions]') && !event.target.closest('[data-batch-menu]')) {
        closeBatchMenus(container);
      }
    });
  }
}

/**
 * Refresh the batch rows for a product.
 *
 * @code INV-refreshBatchRows
 * @param {string} productId
 * @returns {Promise<void>}
 */
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

/**
 * Apply current batch sorting to a product.
 *
 * @code INV-applyBatchSorting
 * @param {string} productId
 * @param {Array<Record<string, unknown>>} batches
 * @returns {Array<Record<string, unknown>>}
 */
export function applyBatchSorting(productId, batches) {
  const state = batchSortState[productId];
  if (!state || !state.key) return batches;

  return sortBatches(batches, state.key, state.dir);
}

/**
 * Bind batch sort header handlers.
 *
 * @code INV-bindBatchSortHeaders
 * @param {string} productId
 * @param {HTMLElement} container
 */
export function bindBatchSortHeaders(productId, container) {
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

/**
 * Close any currently expanded product row.
 *
 * @code INV-closeExpandedRow
 */
function closeExpandedRow() {
  if (expandedProductId) {
    const container = document.getElementById('products-container');
    const expandedRow = container?.querySelector(`[data-product-id="${expandedProductId}"][data-expanded="true"]`);
    if (expandedRow) {
      collapseRowInternal(expandedRow);
    }
    expandedProductId = null;
  }
}

/**
 * Collapse a product row (internal without tracking).
 *
 * @code INV-collapseRowInternal
 * @param {HTMLElement} row
 */
function collapseRowInternal(row) {
  const productId = row.getAttribute('data-product-id');
  const chevron = row.querySelector('.chevron-icon');

  if (chevron) {
    chevron.style.transform = 'rotate(0deg)';
  }

  row.setAttribute('data-expanded', 'false');

  const detailsRow = document.querySelector(`.batch-details-row[data-product-id="${productId}"]`);
  if (detailsRow) {
    detailsRow.remove();
  }
}

/**
 * Expand a product row to show batches.
 *
 * @code INV-expandRow
 * @param {HTMLElement} row
 * @returns {Promise<void>}
 */
export async function expandRow(row) {
  const productId = row.getAttribute('data-product-id');
  const chevron = row.querySelector('.chevron-icon');

  if (!productId) return;

  // Close any other expanded row first
  closeExpandedRow();

  if (chevron) {
    chevron.style.transform = 'rotate(180deg)';
  }

  row.setAttribute('data-expanded', 'true');

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

  // Track this as the expanded row
  expandedProductId = productId;
}

/**
 * Collapse a product row.
 *
 * @code INV-collapseRow
 * @param {HTMLElement} row
 */
export function collapseRow(row) {
  const productId = row.getAttribute('data-product-id');
  const chevron = row.querySelector('.chevron-icon');

  if (chevron) {
    chevron.style.transform = 'rotate(0deg)';
  }

  row.setAttribute('data-expanded', 'false');
  expandedProductId = null;
  // row.classList.remove('bg-muted/30');

  const detailsRow = document.querySelector(`.batch-details-row[data-product-id="${productId}"]`);
  if (detailsRow) {
    detailsRow.remove();
  }
}

/**
 * Load more batches for a product.
 *
 * @code INV-handleSeeMore
 * @param {HTMLButtonElement} button
 * @returns {Promise<void>}
 */
export async function handleSeeMore(button) {
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

/**
 * Close any open batch action menus.
 *
 * @code INV-closeBatchMenus
 * @param {HTMLElement | null} [container]
 */
export function closeBatchMenus(container = document.getElementById('products-container')) {
  if (!container) {
    return;
  }

  container.querySelectorAll('[data-batch-menu]').forEach((menu) => {
    menu.classList.add('hidden');
  });

  container.querySelectorAll('[data-batch-actions]').forEach((button) => {
    button.setAttribute('aria-expanded', 'false');
  });
}
