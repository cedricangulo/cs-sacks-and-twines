import { getProductsList } from './get-products.js';
import { setProducts } from './state.js';
import { renderProductsGrid, initProductCardHandlers, initQueueHandlers } from './render.js';
import { renderBasecoatSelect } from '../utils/data-table.js';
import { initDispatchButton } from './submit.js';

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
  let products = [...allProducts];
  const { search, type, stock_status, sort } = currentFilter;

  if (search !== '') {
    const q = search.toLowerCase();
    products = products.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const sku = (p.sku_code || '').toLowerCase();
      return name.includes(q) || sku.includes(q);
    });
  }

  if (type !== '') {
    products = products.filter((p) => (p.category || '') === type);
  }

  if (stock_status !== '') {
    products = products.filter((p) => {
      const stock = parseFloat(p.current_quantity) || 0;
      const threshold = parseFloat(p.low_stock_threshold) || 0;
      if (stock_status === 'in_stock') return stock > threshold;
      if (stock_status === 'low_stock') return stock > 0 && stock < threshold;
      if (stock_status === 'out_of_stock') return stock <= 0;
      return true;
    });
  }

  if (sort === 'name_asc') {
    products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (sort === 'name_desc') {
    products.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
  } else if (sort === 'stock_high') {
    products.sort((a, b) => (parseFloat(b.current_quantity) || 0) - (parseFloat(a.current_quantity) || 0));
  } else if (sort === 'stock_low') {
    products.sort((a, b) => (parseFloat(a.current_quantity) || 0) - (parseFloat(b.current_quantity) || 0));
  }

  return products;
}

/**
 * Render filtered products grid.
 *
 * @code PRD-renderFilteredGrid
 */
export function renderFilteredGrid() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const filtered = applyFiltersAndSort();
  grid.innerHTML = renderProductsGrid(filtered);
  initProductCardHandlers(grid);
  updateClearButton();
}

/**
 * Update clear button visibility.
 *
 * @code PRD-updateClearBtn
 */
export function updateClearButton() {
  const bar = document.getElementById('products-filter-bar');
  if (!bar) return;
  const clearBtn = bar.querySelector('[data-filter-clear]');
  if (!clearBtn) return;

  const hasFilters = currentFilter.search !== '' || currentFilter.type !== '' || currentFilter.stock_status !== '' || currentFilter.sort !== '';
  clearBtn.classList.toggle('hidden', !hasFilters);
}

/**
 * Render the filter bar.
 *
 * @code PRD-renderFilterBar
 * @param {{ search: string, type: string, stock_status: string, sort: string }} urlParams
 */
export function renderFilterBar(urlParams) {
  const bar = document.getElementById('products-filter-bar');
  if (!bar) return;

  const typeHtml = renderBasecoatSelect({
    id: 'products-select-type',
    key: 'type',
    placeholder: 'All types',
    options: [
      { value: '', label: 'All types' },
      { value: 'sacks', label: 'Sacks' },
      { value: 'twines', label: 'Twines' },
    ],
    value: urlParams.type || '',
  });

  const stockHtml = renderBasecoatSelect({
    id: 'products-select-stock_status',
    key: 'stock_status',
    placeholder: 'All stock',
    options: [
      { value: '', label: 'All stock' },
      { value: 'in_stock', label: 'In Stock' },
      { value: 'low_stock', label: 'Low Stock' },
      { value: 'out_of_stock', label: 'Out of Stock' },
    ],
    value: urlParams.stock_status || '',
  });

  const sortHtml = renderBasecoatSelect({
    id: 'products-select-sort',
    key: 'sort',
    placeholder: 'Sort by',
    options: [
      { value: '', label: 'Sort by' },
      { value: 'name_asc', label: 'Name A-Z' },
      { value: 'name_desc', label: 'Name Z-A' },
      { value: 'stock_high', label: 'Stock: High to Low' },
      { value: 'stock_low', label: 'Stock: Low to High' },
    ],
    value: urlParams.sort || '',
  });

  bar.innerHTML = `
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 min-w-48 max-w-xs">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="search" data-product-search class="input pl-9" placeholder="Search products..." />
      </div>
      ${typeHtml}
      ${stockHtml}
      ${sortHtml}
      <button type="button" data-filter-clear class="btn-ghost text-sm h-9 px-3 hidden">
        Clear filters
      </button>
    </div>
  `;
}

/**
 * Get the current filter select value.
 *
 * @code PRD-getSelectValue
 * @param {string} key
 * @returns {string}
 */
export function getSelectValue(key) {
  const el = document.querySelector(`#products-filter-bar [data-filter="${key}"]`);
  return el ? el.value : '';
}

/**
 * Bind filter bar event handlers.
 *
 * @code PRD-bindFilterBar
 */
export function bindFilterBar() {
  const bar = document.getElementById('products-filter-bar');
  if (!bar) return;

  const searchInput = bar.querySelector('[data-product-search]');
  if (searchInput) {
    searchInput.value = currentFilter.search;
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      currentFilter.search = searchInput.value;
      syncUrlParams();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(renderFilteredGrid, 250);
    });
  }

  bar.querySelectorAll('.select[data-filter]').forEach((bcSelect) => {
    bcSelect.addEventListener('change', (event) => {
      const key = bcSelect.getAttribute('data-filter');
      const value = event.detail?.value ?? bcSelect.value ?? '';
      currentFilter[key] = value;
      syncUrlParams();
      renderFilteredGrid();
    });
  });

  const clearBtn = bar.querySelector('[data-filter-clear]');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      currentFilter = { search: '', type: '', stock_status: '', sort: '' };
      if (searchInput) searchInput.value = '';
      bar.querySelectorAll('.select[data-filter]').forEach((s) => { s.value = ''; });
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
  if (!grid) {
    console.error('Products grid not found');
    return;
  }

  try {
    const urlParams = readUrlParams();
    currentFilter = {
      search: urlParams.search || '',
      type: urlParams.type || '',
      stock_status: urlParams.stock_status || '',
      sort: urlParams.sort || '',
    };

    allProducts = await getProductsList();
    setProducts(allProducts);

    renderFilterBar(urlParams);
    renderFilteredGrid();
    initQueueHandlers(document.getElementById('dispatch-queue'));
    initDispatchButton();
    bindFilterBar();
  } catch (error) {
    console.error('Failed to load products:', error);
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center">
        <p class="type-md text-destructive">Failed to load products</p>
        <p class="type-sm text-muted-foreground">Please try again later.</p>
      </div>
    `;
  }
}