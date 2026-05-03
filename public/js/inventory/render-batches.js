/**
 * @module inventory/render-batches
 * Batch table rendering functions for inventory accordion.
 */
import { escapeHtml, renderEmptyState, renderLoadingRow } from '../utils/dom-utils.js';
import { formatDate } from '../utils/date-utils.js';
import { formatCurrency } from '../utils/format.js';

/**
 * Render batch table header.
 *
 * @returns {string}
 */
export function renderBatchHeader() {
  const tableHeaders = [
    { key: 'batch_code', label: 'Batch Code', align: 'left' },
    { key: 'supplier_name', label: 'Supplier', align: 'left' },
    { key: 'unit_cost', label: 'Unit Cost', align: 'right' },
    { key: 'quantity_received', label: 'Qty Received', align: 'right' },
    { key: 'quantity_remaining', label: 'Qty Remaining', align: 'right' },
    { key: 'created_at', label: 'Created At', align: 'left' },
  ];

  return `
    <thead>
      <tr>
        ${tableHeaders.map(header => `
          <th data-batch-sort="${header.key}" class="text-muted-foreground/80 font-normal ${header.align === 'right' ? 'text-right' : ''}">
            ${escapeHtml(header.label)}
          </th>
        `).join('')}
        <th class="w-fit"></th>
      </tr>
    </thead>
  `;
}

/**
 * Render batch table rows.
 *
 * @param {Array<Record<string, unknown>>} batches
 * @returns {string}
 */
export function renderBatchRows(batches) {
  if (batches.length === 0) {
    return renderEmptyState('batches');
  }

  return batches.map((batch) => {
    const batchId = escapeHtml(batch.batch_id ?? '');
    return `
    <tr>
      <td class="type-xs font-medium">${escapeHtml(batch.batch_code ?? '')}</td>
      <td>${escapeHtml(batch.supplier_name ?? '')}</td>
      <td class="text-right">${formatCurrency(batch.unit_cost)}</td>
      <td class="text-right">${escapeHtml(batch.quantity_received ?? '')}</td>
      <td class="text-right">${escapeHtml(batch.quantity_remaining ?? '')}</td>
      <td>${formatDate(batch.created_at)}</td>
      <td class="relative">
        <button
          type="button"
          class="btn-icon-ghost"
          data-batch-actions="${batchId}"
          aria-label="Batch actions"
          aria-expanded="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="6" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="18" r="1"/></svg>
        </button>
        <div
          class="hidden fixed z-50 w-36 border bg-popover rounded-(--radius-md) shadow-md"
          data-batch-menu="${batchId}"
          role="menu">
          <ul class="p-1 text-sm">
            <li>
              <button
                type="button"
                class="w-full text-left px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                data-batch-action="edit"
                data-batch-id="${batchId}"
                role="menuitem">
                Edit
              </button>
            </li>
            <li>
              <button
                type="button"
                class="w-full text-left px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-destructive"
                data-batch-action="void"
                data-batch-id="${batchId}"
                role="menuitem">
                Void
              </button>
            </li>
          </ul>
        </div>
      </td>
    </tr>
  `;
  }).join('');
}

export function renderBatchError(message = 'Failed to load batches.') {
  return `
    <tr>
      <td colspan="7" class="py-4 text-center type-sm text-destructive">
        ${escapeHtml(message)}
      </td>
    </tr>
  `;
}

export function renderBatchShowMore(productId, loaded, total) {
  return `
    <tr>
      <td colspan="7" class="text-center py-2">
        <button
          type="button"
          class="see-more-btn btn-ghost type-xs"
          data-product-id="${productId}"
          data-loaded="${loaded}"
          data-total="${total}"
        >
          Show all ${total} batches
        </button>
      </td>
    </tr>
  `;
}

export function renderBatchDetailRow(productId) {
  return `
    <td colspan="9">
      <div class="px-12 space-y-2">
        <div class="overflow-x-auto overflow-y-hidden">
          <table class="table">
            ${renderBatchHeader()}
            <tbody class="batch-tbody" data-product-id="${productId}">
              ${renderLoadingRow(7)}
            </tbody>
          </table>
        </div>
      </div>
    </td>
  `;
}