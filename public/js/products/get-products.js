import { fetchJson } from '../utils/fetch-utils.js';
import { escapeHtml } from '../utils/dom-utils.js';

export async function getProductsList() {
  const grid = document.getElementById('products-grid');
  const apiUrl = grid?.getAttribute('data-products-url') || '/api/products/list';

  const payload = await fetchJson(apiUrl);

  if (!Array.isArray(payload)) {
    throw new Error('Products API returned an unexpected response.');
  }

  return payload;
}
