/**
 * @module inventory/render-batches
 * Batch table rendering functions for inventory accordion.
 */
import { escapeHtml } from '../utils/dom-utils.js';
import { formatDate } from '../utils/date-utils.js';
import { formatCurrency } from '../utils/format.js';

/**
 * Render batch table header.
 *
 * @returns {string}
 */
export function renderBatchHeader() {
  return `
    <thead>
      <tr>
        <th></th>
        <th>Batch Code</th>
        <th>Supplier</th>
        <th class="text-right">Unit Cost</th>
        <th>Qty Received</th>
        <th class="text-right">Qty Remaining</th>
        <th>Created At</th>
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
    return `
      <tr>
        <td colspan="7" class="py-4 px-6 type-sm text-muted-foreground text-center">
          No batches found.
        </td>
      </tr>
    `;
  }

  return batches.map((batch) => `
    <tr>
      <td class="type-xs font-medium">${escapeHtml(batch.batch_code ?? '')}</td>
      <td>${escapeHtml(batch.supplier_name ?? '')}</td>
      <td class="text-right">${formatCurrency(batch.unit_cost)}</td>
      <td>${escapeHtml(batch.quantity_received ?? '')}</td>
      <td class="text-right">${escapeHtml(batch.quantity_remaining ?? '')}</td>
      <td>${formatDate(batch.created_at)}</td>
    </tr>
  `).join('');
}

/**
 * Render batch table with header and body.
 *
 * @param {Array<Record<string, unknown>>} batches
 * @returns {string}
 */
export function renderBatchTable(batches) {
  return `
    <table class="table">
      ${renderBatchHeader()}
      <tbody>
        ${renderBatchRows(batches)}
      </tbody>
    </table>
  `;
}

/**
 * Render loading state for batch table.
 *
 * @returns {string}
 */
export function renderBatchLoading() {
  return `
    <tr>
      <td colspan="7" class="py-4 text-center type-sm text-muted-foreground">
        Loading batches...
      </td>
    </tr>
  `;
}

/**
 * Render error state for batch table.
 *
 * @param {string} message
 * @returns {string}
 */
export function renderBatchError(message = 'Failed to load batches.') {
  return `
    <tr>
      <td colspan="7" class="py-4 text-center type-sm text-destructive">
        ${escapeHtml(message)}
      </td>
    </tr>
  `;
}

/**
 * Render "show more" button row for batch pagination.
 *
 * @param {number} productId
 * @param {number} loaded
 * @param {number} total
 * @returns {string}
 */
export function renderBatchShowMore(productId, loaded, total) {
  return `
    <tr class="bg-muted/20">
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

/**
 * Render the batch accordion detail row.
 *
 * @param {string} productId
 * @returns {string}
 */
export function renderBatchDetailRow(productId) {
  return `
    <td colspan="7" class="p-0">
      <div class="pl-6 pr-6 py-2 space-y-2">
        <div class="overflow-x-auto">
          <table class="table">
            ${renderBatchHeader()}
            <tbody class="batch-tbody" data-product-id="${productId}">
              ${renderBatchLoading()}
            </tbody>
          </table>
        </div>
      </div>
    </td>
  `;
}