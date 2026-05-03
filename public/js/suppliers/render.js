import { formatDate } from '../utils/date-utils.js';
import { escapeHtml, renderEmptyState } from '../utils/dom-utils.js';

/**
 * Render table rows for suppliers.
 *
 * @code SUP-renderRows
 * @param {Array<Record<string, unknown>>} suppliers
 * @returns {string}
 */
export function renderSupplierRows(suppliers) {
  if (suppliers.length === 0) {
    return renderEmptyState('suppliers');
  }

  return suppliers.map((supplier) => `
    <tr>
      <td class="font-medium">${escapeHtml(supplier.company_name ?? '')}</td>
      <td>${escapeHtml(supplier.contact_person ?? '')}</td>
      <td class="font-mono">${escapeHtml(supplier.contact_number ?? '')}</td>
      <td>${escapeHtml(supplier.address ?? '')}</td>
      <td>${escapeHtml(formatDate(supplier.created_at ?? ''))}</td>
    </tr>
  `).join('');
}