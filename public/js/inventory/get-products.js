import { fetchJson } from '../utils/fetch-utils.js';
import { escapeHtml, renderEmptyState } from '../utils/dom-utils.js';
import { formatCurrency, getInitials } from '../utils/format.js';
import {
  renderBatchRows,
  renderBatchShowMore,
  renderBatchError,
  renderComboboxOption,
  renderProducts,
  buildSignature
} from './render.js';
import { applyBatchSorting, bindBatchSortHeaders, initAccordion } from './events.js';

let lastSignature = [];
let allProducts = [];

/**
 * Fetch product list for use in the inventory combobox.
 *
 * @code INV-getProductsCombobox
 * @returns {Promise<unknown[]>}
 */
export async function getProductsForCombobox() {
  const elem = document.querySelector('[data-api-url]');
  const apiUrl = elem?.getAttribute('data-api-url') || '/api/products';
  const payload = await fetchJson(apiUrl);

  if (!Array.isArray(payload)) {
    throw new Error('Products API returned an unexpected response.');
  }

  return payload;
}

/**
 * Fetch products for inventory table.
 *
 * @code INV-getProducts
 * @returns {Promise<unknown[]>}
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
 * Fetch batches for a given product.
 *
 * @code INV-getBatches
 * @param {string} productId
 * @param {number} [limit]
 * @param {number} [offset]
 * @returns {Promise<unknown[]>}
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
 * Get the batch count for a product.
 *
 * @code INV-getBatchCount
 * @param {string} productId
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
 * Load products into the inventory table.
 *
 * @code INV-loadProducts
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<void>}
 */
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

/**
 * Sort batches by key and direction.
 *
 * @code INV-sortBatches
 * @param {Array<Record<string, unknown>>} batches
 * @param {string} key
 * @param {string} dir
 * @returns {Array<Record<string, unknown>>}
 */
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
