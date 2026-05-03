import { createClientTable, renderSortIndicator } from '../utils/data-table.js';
import { fetchJson } from '../utils/fetch-utils.js';
import { formatCurrency } from '../utils/format.js';
import { renderEmptyState } from '../utils/dom-utils.js';
import { fetchDispatches } from './get-dispatches.js';
import {
  renderDispatchRows,
  renderDispatchDetailRow,
  renderDispatchError,
  renderDispatchItemsError,
  renderDispatchLoading,
  renderDispatchItemsRows,
} from './render.js';

const loadedDispatchIds = new Set();
const dispatchItemsSortState = {};
const dispatchItemsCache = {};

/**
 * Expand a dispatch row to show its items.
 *
 * @code DSP-expandDispatch
 * @param {HTMLElement} row
 * @param {string} dispatchId
 */
export async function expandDispatch(row, dispatchId) {
  const chevron = row.querySelector('.dispatch-chevron');

  if (chevron) {
    chevron.classList.add('rotate-90');
  }

  row.setAttribute('data-expanded', 'true');

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
 *
 * @code DSP-collapseDispatch
 * @param {HTMLElement} row
 * @param {string} dispatchId
 */
export function collapseDispatch(row, dispatchId) {
  const chevron = row.querySelector('.dispatch-chevron');

  if (chevron) {
    chevron.classList.remove('rotate-90');
  }

  row.setAttribute('data-expanded', 'false');

  const detailsRow = document.querySelector(`.dispatch-details-row[data-dispatch-id="${dispatchId}"]`);
  detailsRow?.remove();
}

/**
 * Handle click events on dispatch rows.
 *
 * @code DSP-handleRowClick
 * @param {Event} event
 */
export async function handleRowClick(event) {
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
 * Sort dispatch items by key and direction.
 *
 * @code DSP-sortItems
 * @param {Array<Record<string, unknown>>} items
 * @param {string} key
 * @param {string} dir
 * @returns {Array<Record<string, unknown>>}
 */
export function sortDispatchItems(items, key, dir) {
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

/**
 * Apply current sort state to dispatch items.
 *
 * @code DSP-applyItemsSort
 * @param {string} dispatchId
 * @param {Array<Record<string, unknown>>} items
 * @returns {Array<Record<string, unknown>>}
 */
function applyDispatchItemsSorting(dispatchId, items) {
  const state = dispatchItemsSortState[dispatchId];
  if (!state || !state.key) return items;

  return sortDispatchItems(items, state.key, state.dir);
}

/**
 * Bind sort handlers for dispatch item headers.
 *
 * @code DSP-bindItemsSort
 * @param {string} dispatchId
 * @param {HTMLElement} container
 */
export function bindDispatchItemsSortHeaders(dispatchId, container) {
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

/**
 * Refresh dispatch items rows with current sort.
 *
 * @code DSP-refreshItemsRows
 * @param {string} dispatchId
 */
export function refreshDispatchItemsRows(dispatchId) {
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

/**
 * Initialize the dispatch history page.
 *
 * @code DSP-initPage
 */
export function initDispatchHistoryPage() {
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

      if (filters.status) {
        result = result.filter(item => item.status === filters.status);
      }

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