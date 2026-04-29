import { fetchJson } from '../utils/fetch-utils.js';
import { escapeHtml, renderEmptyRow } from '../utils/dom-utils.js';

let lastSignature = '';

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
 * Render inventory products table rows.
 *
 * @param {Array<Record<string, unknown>>} products
 * @returns {string}
 */
export function renderProducts(products) {
  if (products.length === 0) {
    return renderEmptyRow({ colspan: 5, message: 'No products found.' });
  }

  return products.map((product) => `
    <tr>
      <td>${escapeHtml(product.sku_code ?? '')}</td>
      <td class="font-medium">${escapeHtml(product.name ?? '')}</td>
      <td>${escapeHtml(product.category ?? '')}</td>
      <td>${escapeHtml(product.base_uom ?? '')}</td>
      <td class="text-right">${escapeHtml(product.current_stock ?? '')}</td>
    </tr>
  `).join('');
}

/**
 * Build a signature for change detection.
 *
 * @param {Array<Record<string, unknown>>} products
 * @returns {string}
 */
function buildSignature(products) {
  return products
    .map((product) => `${product.id ?? ''}|${product.updated_at ?? ''}`)
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
  } catch (error) {
    console.error('Failed to load products:', error);
    container.innerHTML = renderEmptyRow({ colspan: 5, message: 'Failed to load products. Please try again.' });
  }
}
