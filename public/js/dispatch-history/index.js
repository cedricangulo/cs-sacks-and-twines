/**
 * @module dispatch-history
 * Dispatch history page initialization and event handling.
 */
import { fetchJson } from '../utils/fetch-utils.js';
import { formatCurrency } from '../utils/format.js';
import { createClientTable, renderSortIndicator } from '../utils/data-table.js';
import {
  renderDispatchRows,
  renderDispatchDetailRow,
  // renderDispatchTable,
  renderDispatchError,
  renderDispatchItemsError,
  renderDispatchLoading,
  renderDispatchItemsRows,
} from './render-dispatches.js';
import { renderEmptyState } from '../utils/dom-utils.js';

// Track which dispatch items have been loaded to avoid duplicate fetches
const loadedDispatchIds = new Set();

// Track sort state for each dispatch's items table
const dispatchItemsSortState = {};

// Cache for dispatch items - stores items per dispatch ID
const dispatchItemsCache = {};

/**
 * Fetch dispatches from API.
 * @returns {Promise<Array>}
 */
async function fetchDispatches() {
  const container = document.getElementById('dispatches-container');
  const dispatchesUrl = container?.getAttribute('data-dispatches-url');

  if (!dispatchesUrl) {
    throw new Error('Missing dispatches URL');
  }

  const payload = await fetchJson(dispatchesUrl);

  if (!payload.success) {
    throw new Error(payload.message ?? 'Failed to load dispatches');
  }

  return payload.dispatches ?? [];
}

/**
 * Initialize the dispatch history page.
 */
function initDispatchHistoryPage() {
  const container = document.getElementById('dispatches-container');

  if (!container) {
    return;
  }

  window.dispatchHistoryItemsUrl = container.getAttribute('data-items-url');

  const table = createClientTable({
    container: '#dispatches-container',
    fetchFn: fetchDispatches,
    renderFn: renderDispatchRows,
    sortableColumns: [
      { key: 'created_at', column: 'created_at' },
      { key: 'customer_reference', column: 'customer_reference' },
      { key: 'staff_name', column: 'staff_name' },
      { key: 'total_items', column: 'total_items' },
      { key: 'status', column: 'status' },
    ],
    filterFn: (data, filters) => {
      let result = data;

      // Filter by status if set
      if (filters.status) {
        result = result.filter(item => item.status === filters.status);
      }

      // Filter by search query
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(item => {
          return Object.values(item).some(v => {
            if (v == null) return false;
            return String(v).toLowerCase().includes(q);
          });
        });
      }

      return result;
    },
    filterBar: {
      id: 'dispatch-history',
      searchPlaceholder: 'Search dispatches...',
      selects: [
        {
          key: 'status',
          label: 'All status',
          options: [
            { value: 'completed', label: 'Completed' },
            { value: 'voided', label: 'Voided' },
          ],
        },
      ],
    },
    id: 'dispatch-history',
    afterRender: () => {
      const tbody = document.getElementById('dispatches-container');
      tbody?.addEventListener('click', handleRowClick);
    },
  });

  table.init();
}

/**
 * Load dispatches from API and render the table.
 *
 * @param {HTMLElement} container
 * @param {string} url
 */
async function loadDispatches(container, url) {
  container.innerHTML = "loading... bitch";

  try {
    const payload = await fetchJson(url);

    if (!payload.success) {
      container.innerHTML = renderDispatchError(payload.message ?? 'Failed to load dispatches.');
      return;
    }

    const dispatches = payload.dispatches ?? [];
    container.innerHTML = renderDispatchRows(dispatches);
  } catch (error) {
    console.error('Error loading dispatches:', error);
    container.innerHTML = renderDispatchError('Failed to load dispatches.');
  }
}

/**
 * Handle click events on dispatch rows.
 *
 * @param {Event} event
 */
async function handleRowClick(event) {
  const row = event.target.closest('[data-dispatch-row]');

  if (!row) {
    return;
  }

  const dispatchId = row.getAttribute('data-dispatch-row');
  const isExpanded = row.getAttribute('data-expanded') === 'true';

  if (isExpanded) {
    collapseDispatch(row, dispatchId);
  } else {
    await expandDispatch(row, dispatchId);
  }
}

/**
 * Expand a dispatch row to show its items.
 * Uses inventory's pattern: document.createElement + fetch fresh each time
 *
 * @param {HTMLElement} row
 * @param {string} dispatchId
 */
async function expandDispatch(row, dispatchId) {
  const chevron = row.querySelector('.dispatch-chevron');

  if (chevron) {
    chevron.classList.add('rotate-90');
  }

  row.setAttribute('data-expanded', 'true');
  // row.classList.add('bg-muted/30');

  const detailsRow = document.createElement('tr');
  detailsRow.className = 'dispatch-details-row';
  detailsRow.setAttribute('data-dispatch-id', dispatchId);
  detailsRow.innerHTML = renderDispatchDetailRow(dispatchId);
  detailsRow.classList.add('hover:bg-transparent!');

  row.after(detailsRow);

  try {
    const itemsUrl = window.dispatchHistoryItemsUrl;
    const url = `${itemsUrl}?dispatch_id=${encodeURIComponent(dispatchId)}`;
    const payload = await fetchJson(url);

    const tbody = detailsRow.querySelector('.dispatch-items-tbody');

    if (!payload.success || !tbody) {
      tbody.innerHTML = renderDispatchItemsError(payload.message ?? 'Failed to load items.');
      return;
    }

    const items = payload.items ?? [];
    const container = document.getElementById('dispatches-container');

    dispatchItemsCache[dispatchId] = items;
    const sorted = applyDispatchItemsSorting(dispatchId, items);

    tbody.innerHTML = renderDispatchItemsRows(sorted);
    bindDispatchItemsSortHeaders(dispatchId, container);
  } catch (error) {
    console.error('Failed to load dispatch items:', error);
    const tbody = detailsRow.querySelector('.dispatch-items-tbody');
    if (tbody) {
      tbody.innerHTML = renderDispatchItemsError();
    }
  }
}

/**
 * Collapse a dispatch row.
 * Uses inventory's pattern
 *
 * @param {HTMLElement} row
 * @param {string} dispatchId
 */
function collapseDispatch(row, dispatchId) {
  const chevron = row.querySelector('.dispatch-chevron');

  if (chevron) {
    chevron.classList.remove('rotate-90');
  }

  row.setAttribute('data-expanded', 'false');
  // row.classList.remove('bg-muted/30');

  const detailsRow = document.querySelector(`.dispatch-details-row[data-dispatch-id="${dispatchId}"]`);
  detailsRow?.remove();
}

/**
 * Render dispatch items directly (for already-loaded dispatches).
 * This renders items without showing loading state.
 *
 * @param {string} dispatchId
 */
async function renderDispatchItemsFromCache(dispatchId) {

  const row = document.querySelector(`[data-dispatch-row="${dispatchId}"]`);
  const detailRow = renderDispatchDetailRow(dispatchId);
  row?.insertAdjacentHTML('afterend', detailRow);

  const itemsUrl = window.dispatchHistoryItemsUrl;
  const tbody = document.querySelector(`.dispatch-items-tbody[data-dispatch-id="${dispatchId}"]`);

  if (!tbody || !itemsUrl) {
    return;
  }

  try {
    const url = `${itemsUrl}?dispatch_id=${encodeURIComponent(dispatchId)}`;
    const payload = await fetchJson(url);

    if (!payload.success) {
      tbody.innerHTML = renderDispatchItemsError(payload.message ?? 'Failed to load items.');
      return;
    }

    const items = payload.items ?? [];

    if (items.length === 0) {
      tbody.innerHTML = renderEmptyState('dispatch-items');
      return;
    }

    const itemsHtml = items.map((item) => {
      const productName = item.product_name ?? '-';
      const batchCode = item.batch_code ?? '-';
      const soldQty = item.dispatch_quantity ? `${item.dispatch_quantity} ${item.dispatch_uom}` : '-';
      const deducted = item.quantity_deducted ?? '-';
      const unitCost = item.unit_cost ? formatCurrency(item.unit_cost) : '-';

      return `
        <tr class="border-b border-muted/30">
          <td class="type-sm py-2">${productName}</td>
          <td class="type-xs font-medium py-2">${batchCode}</td>
          <td class="type-sm text-right py-2">${soldQty}</td>
          <td class="type-sm text-right py-2">${deducted}</td>
          <td class="type-sm text-right py-2">${unitCost}</td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = itemsHtml;
  } catch (error) {
    console.error('Error loading dispatch items:', error);
    tbody.innerHTML = renderDispatchItemsError('Failed to load items.');
  }
}

/**
 * Load dispatch items for a specific dispatch.
 *
 * @param {string} dispatchId
 */
async function loadDispatchItems(dispatchId) {

  const itemsUrl = window.dispatchHistoryItemsUrl;
  const tbody = document.querySelector(`.dispatch-items-tbody[data-dispatch-id="${dispatchId}"]`);

  if (!tbody || !itemsUrl) {
    return;
  }

  tbody.innerHTML = renderDispatchItemsLoading();

  try {
    const url = `${itemsUrl}?dispatch_id=${encodeURIComponent(dispatchId)}`;
    const payload = await fetchJson(url);

    if (!payload.success) {
      tbody.innerHTML = renderDispatchItemsError(payload.message ?? 'Failed to load items.');
      return;
    }

    const items = payload.items ?? [];

    if (items.length === 0) {
      tbody.innerHTML = renderEmptyState('dispatch-items');
      return;
    }

    const itemsHtml = items.map((item) => {
      const productName = item.product_name ?? '-';
      const batchCode = item.batch_code ?? '-';
      const soldQty = item.dispatch_quantity ? `${item.dispatch_quantity} ${item.dispatch_uom}` : '-';
      const deducted = item.quantity_deducted ?? '-';
      const unitCost = item.unit_cost ? formatCurrency(item.unit_cost) : '-';

      return `
        <tr class="border-b border-muted/30">
          <td class="type-sm py-2">${productName}</td>
          <td class="type-xs font-medium py-2">${batchCode}</td>
          <td class="type-sm text-right py-2">${soldQty}</td>
          <td class="type-sm text-right py-2">${deducted}</td>
          <td class="type-sm text-right py-2">${unitCost}</td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = itemsHtml;
    loadedDispatchIds.add(dispatchId);
  } catch (error) {
    console.error('Error loading dispatch items:', error);
    tbody.innerHTML = renderDispatchItemsError('Failed to load items.');
  }
}

function sortDispatchItems(items, key, dir) {
  const direction = dir === 'asc' ? 1 : -1;

  return [...items].sort((a, b) => {
    let va = a[key];
    let vb = b[key];

    if (va == null) va = '';
    if (vb == null) vb = '';

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

function applyDispatchItemsSorting(dispatchId, items) {
  const state = dispatchItemsSortState[dispatchId];
  if (!state || !state.key) return items;

  return sortDispatchItems(items, state.key, state.dir);
}

function bindDispatchItemsSortHeaders(dispatchId, container) {
  const detailRow = container.querySelector(`.dispatch-details-row[data-dispatch-id="${dispatchId}"]`);
  if (!detailRow) return;

  const headers = detailRow.querySelectorAll('th[data-dispatch-items-sort]');
  headers.forEach((th) => {
    const key = th.getAttribute('data-dispatch-items-sort');

    const updateIndicators = () => {
      const current = dispatchItemsSortState[dispatchId] || {};
      detailRow.querySelectorAll('th[data-dispatch-items-sort]').forEach((other) => {
        const otherKey = other.getAttribute('data-dispatch-items-sort');
        const isThisOther = other === th;
        renderSortIndicator(other, isThisOther && current.key === key, isThisOther && current.key === key ? current.dir : '');
      });
    };

    updateIndicators();

    th.style.cursor = 'pointer';
    th.classList.add('select-none');
    th.addEventListener('click', () => {
      const current = dispatchItemsSortState[dispatchId] || {};
      if (current.key === key) {
        dispatchItemsSortState[dispatchId] = { key, dir: current.dir === 'asc' ? 'desc' : 'asc' };
      } else {
        dispatchItemsSortState[dispatchId] = { key, dir: 'asc' };
      }

      updateIndicators();
      refreshDispatchItemsRows(dispatchId);
    });
  });
}

function refreshDispatchItemsRows(dispatchId) {
  const container = document.getElementById('dispatches-container');
  if (!container) return;

  const detailRow = container.querySelector(`.dispatch-details-row[data-dispatch-id="${dispatchId}"]`);
  if (!detailRow) return;

  const tbody = detailRow.querySelector(`.dispatch-items-tbody[data-dispatch-id="${dispatchId}"]`);
  if (!tbody) return;

  const cachedItems = dispatchItemsCache[dispatchId];
  if (!cachedItems) return;

  const sorted = applyDispatchItemsSorting(dispatchId, cachedItems);
  tbody.innerHTML = renderDispatchItemsRows(sorted);
}

initDispatchHistoryPage();