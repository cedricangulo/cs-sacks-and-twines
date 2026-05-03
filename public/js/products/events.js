import { getProductsList } from './get-products.js';
import { setProducts } from './state.js';
import { renderProductsGrid, initProductCardHandlers, initQueueHandlers, renderDispatchQueue } from './render.js';

let allProducts = [];
let currentFilter = { search: '', type: '', stock_status: '', sort: '' };

/**
 * Read filter parameters from the URL.
 *
 * @code PRD-readUrlParams
 * @returns {{ search: string, type: string, stock_status: string, sort: string }}
 */
export function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    search: params.get('search') || '',
    type: params.get('type') || '',
    stock_status: params.get('stock_status') || '',
    sort: params.get('sort') || '',
  };
}

/**
 * Sync current filter state to the URL.
 *
 * @code PRD-syncUrlParams
 */
export function syncUrlParams() {
  const url = new URL(window.location.href);
  const entries = Object.entries(currentFilter).filter(([, v]) => v !== '');
  const current = Object.fromEntries(entries);
  const existing = Object.fromEntries(url.searchParams);

  if (JSON.stringify(existing) === JSON.stringify(current)) return;

  const newUrl = new URL(window.location.pathname, window.location.origin);
  entries.forEach(([k, v]) => newUrl.searchParams.set(k, v));
  window.history.pushState({ pf: current }, '', newUrl.toString());
}

/**
 * Apply filters and sorting to products.
 *
 * @code PRD-applyFilters
 * @returns {unknown[]}
 */
export function applyFiltersAndSort() {
  let result = [...allProducts];

  if (currentFilter.search) {
    const q = currentFilter.search.toLowerCase();
    result = result.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }

  if (currentFilter.type) {
    result = result.filter(p => p.category === currentFilter.type);
  }

  if (currentFilter.stock_status) {
    if (currentFilter.stock_status === 'in_stock') {
      result = result.filter(p => (p.quantity_remaining ?? 0) > 0);
    } else if (currentFilter.stock_status === 'low_stock') {
      result = result.filter(p => (p.quantity_remaining ?? 0) > 0 && (p.quantity_remaining ?? 0) <= 10);
    } else if (currentFilter.stock_status === 'out_of_stock') {
      result = result.filter(p => (p.quantity_remaining ?? 0) <= 0);
    }
  }

  if (currentFilter.sort) {
    const [key, dir] = currentFilter.sort.split(':');
    const d = dir === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      if (va == null || vb == null) return 0;
      return String(va).localeCompare(String(vb), undefined, { numeric: true }) * d;
    });
  }

  return result;
}

/**
 * Render filtered products grid.
 *
 * @code PRD-renderFilteredGrid
 */
export function renderFilteredGrid() {
  const filtered = applyFiltersAndSort();
  document.getElementById('products-grid').innerHTML = renderProductsGrid(filtered);
  initProductCardHandlers(document.getElementById('products-grid'));
  updateClearButton();
}

/**
 * Update clear button visibility.
 *
 * @code PRD-updateClearBtn
 */
export function updateClearButton() {
  const btn = document.getElementById('clear-filters-btn');
  if (!btn) return;
  const hasFilters = Object.values(currentFilter).some(v => v !== '');
  btn.classList.toggle('hidden', !hasFilters);
}

/**
 * Render the filter bar.
 *
 * @code PRD-renderFilterBar
 * @param {{ search: string, type: string, stock_status: string, sort: string }} urlParams
 */
export function renderFilterBar(urlParams) {
  currentFilter = {
    search: urlParams.search || '',
    type: urlParams.type || '',
    stock_status: urlParams.stock_status || '',
    sort: urlParams.sort || '',
  };

  const typeSelect = document.getElementById('filter-type');
  if (typeSelect) typeSelect.value = currentFilter.type;

  const stockSelect = document.getElementById('filter-stock-status');
  if (stockSelect) stockSelect.value = currentFilter.stock_status;

  renderFilteredGrid();
}

/**
 * Get the current filter select value.
 *
 * @code PRD-getSelectValue
 * @param {string} key
 * @returns {string}
 */
export function getSelectValue(key) {
  return currentFilter[key] || '';
}

/**
 * Bind filter bar event handlers.
 *
 * @code PRD-bindFilterBar
 */
export function bindFilterBar() {
  const searchInput = document.getElementById('products-search');
  if (searchInput) {
    searchInput.value = currentFilter.search;
    searchInput.addEventListener('input', (e) => {
      currentFilter.search = e.target.value;
      syncUrlParams();
      renderFilteredGrid();
    });
  }

  const typeSelect = document.getElementById('filter-type');
  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      currentFilter.type = e.target.value;
      syncUrlParams();
      renderFilteredGrid();
    });
  }

  const stockSelect = document.getElementById('filter-stock-status');
  if (stockSelect) {
    stockSelect.addEventListener('change', (e) => {
      currentFilter.stock_status = e.target.value;
      syncUrlParams();
      renderFilteredGrid();
    });
  }

  const clearBtn = document.getElementById('clear-filters-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      currentFilter = { search: '', type: '', stock_status: '', sort: '' };
      const searchInput = document.getElementById('products-search');
      if (searchInput) searchInput.value = '';
      const typeSelect = document.getElementById('filter-type');
      if (typeSelect) typeSelect.value = '';
      const stockSelect = document.getElementById('filter-stock-status');
      if (stockSelect) stockSelect.value = '';
      syncUrlParams();
      renderFilteredGrid();
    });
  }
}

/**
 * Initialize the products page.
 *
 * @code PRD-initPage
 */
export async function initProductsPage() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  allProducts = await getProductsList();
  setProducts(allProducts);

  const urlParams = readUrlParams();
  renderFilterBar(urlParams);
  bindFilterBar();
}