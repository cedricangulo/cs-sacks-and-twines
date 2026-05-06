import { formatDate } from '../utils/date-utils.js';
import { escapeHtml, renderEmptyState } from '../utils/dom-utils.js';

/**
 * Render table rows for suppliers.
 *
 * @code SUP-renderRows
 * @param {Array<Record<string, unknown>>} suppliers
 * @param {{ edit: string, delete: string }} urls
 * @returns {string}
 */
export function renderSupplierRows(suppliers, urls = {}) {
  if (suppliers.length === 0) {
    return renderEmptyState('suppliers');
  }

  const canManage = urls.edit && urls.delete;

  return suppliers.map((supplier) => {
    const supplierId = supplier.supplier_id;

    return `
    <tr>
      <td class="font-medium">${escapeHtml(supplier.company_name ?? '')}</td>
      <td>${escapeHtml(supplier.contact_person ?? '')}</td>
      <td class="font-mono">${escapeHtml(supplier.contact_number ?? '')}</td>
      <td>${escapeHtml(supplier.address ?? '')}</td>
      <td>${escapeHtml(formatDate(supplier.created_at ?? ''))}</td>
      <td class="relative">
        ${canManage ? `
        <button
          type="button"
          class="btn-icon-ghost"
          data-supplier-actions="${supplierId}"
          aria-label="Supplier actions"
          aria-expanded="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="6" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="18" r="1"/></svg>
        </button>
        <div
          class="hidden fixed z-50 w-36 border bg-popover rounded-(--radius-md) shadow-md"
          data-supplier-menu="${supplierId}"
          role="menu">
          <ul class="p-1 text-sm">
            <li>
              <button
                type="button"
                class="w-full text-left px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                data-supplier-action="edit"
                data-supplier-id="${supplierId}"
                role="menuitem">
                Edit
              </button>
            </li>
            <li>
              <button
                type="button"
                class="w-full text-left px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-destructive"
                data-supplier-action="delete"
                data-supplier-id="${supplierId}"
                role="menuitem">
                Delete
              </button>
            </li>
          </ul>
        </div>
        ` : ''}
      </td>
    </tr>
  `;
  }).join('');
}