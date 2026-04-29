import { formatDate } from '../utils/date-utils.js';
import { fetchJson } from '../utils/fetch-utils.js';
import { escapeHtml, renderEmptyRow } from '../utils/dom-utils.js';

let lastSignature = '';

/**
 * Fetch suppliers for the table.
 *
 * @returns {Promise<Array<Record<string, unknown>>>}
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

/**
 * Render supplier rows.
 *
 * @param {Array<Record<string, unknown>>} suppliers
 * @returns {string}
 */
export function renderSuppliers(suppliers) {
  if (suppliers.length === 0) {
    return renderEmptyRow({ colspan: 5, message: 'No suppliers found.' });
  }

  return suppliers.map((supplier) => `
    <tr>
      <td class="font-medium">${escapeHtml(supplier.company_name ?? '')}</td>
      <td>${escapeHtml(supplier.contact_person ?? '')}</td>
      <td>${escapeHtml(supplier.contact_number ?? '')}</td>
      <td>${escapeHtml(supplier.address ?? '')}</td>
      <td>${escapeHtml(formatDate(supplier.created_at ?? ''))}</td>
    </tr>
  `).join('');
}

/**
 * Build a signature for change detection.
 *
 * @param {Array<Record<string, unknown>>} suppliers
 * @returns {string}
 */
function buildSignature(suppliers) {
  return suppliers
    .map((supplier) => `${supplier.id ?? ''}|${supplier.updated_at ?? ''}`)
    .join('|');
}

/**
 * Load suppliers into the table body.
 *
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<void>}
 */
export async function loadSuppliers(options = {}) {
  const container = document.getElementById('suppliers-container');
  if (!container) {
    return;
  }

  try {
    const suppliers = await getSuppliers();
    const signature = buildSignature(suppliers);

    if (!options.force && signature === lastSignature) {
      return;
    }

    lastSignature = signature;
    container.innerHTML = renderSuppliers(suppliers);
  } catch (error) {
    console.error('Failed to load suppliers:', error);
    container.innerHTML = renderEmptyRow({ colspan: 5, message: 'Failed to load suppliers. Please try again.' });
  }
}
