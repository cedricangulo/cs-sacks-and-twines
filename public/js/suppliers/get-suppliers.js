import { formatDate } from '../utils/date-utils.js';
import { fetchJson } from '../utils/fetch-utils.js';

/**
 * Fetch suppliers from the API.
 *
 * @code SUP-getSuppliers
 * @returns {Promise<unknown[]>}
 */
export async function getSuppliers() {
  const container = document.getElementById('suppliers-container');
  const apiUrl = container?.getAttribute('data-api-url') || '/api/suppliers';

  const payload = await fetchJson(apiUrl);

  if (!Array.isArray(payload)) {
    throw new Error('Suppliers API returned an unexpected response.');
  }

  return payload;
}