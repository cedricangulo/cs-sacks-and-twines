/**
 * @module dispatch-history/render-dispatches
 * Dispatch table rendering functions for dispatch history page.
 */
import { escapeHtml, renderEmptyState, renderLoadingRow } from '../utils/dom-utils.js';
import { formatDate } from '../utils/date-utils.js';
import { formatCurrency } from '../utils/format.js';

/**
 * Render dispatch status badge.
 *
 * @param {string} status
 * @returns {string}
 */
function renderStatusBadge(status) {
  const isCompleted = status === 'completed';
  const classes = isCompleted ? 'primary' : 'secondary';
  const label = isCompleted ? 'Completed' : 'Voided';

  return `<span class="badge-${classes}">${escapeHtml(label)}</span>`;
}

/**
 * Render dispatch table rows.
 *
 * @param {Array<Record<string, unknown>>} dispatches
 * @returns {string}
 */
export function renderDispatchRows(dispatches) {
  if (dispatches.length === 0) {
    return renderEmptyState('dispatch-history');
  }

  return dispatches.map((dispatch) => {
    const dispatchId = String(dispatch.dispatch_id ?? '');
    const time = dispatch.created_at ? formatDate(dispatch.created_at) : '-';
    const reference = dispatch.customer_reference || '-';
    const staffName = escapeHtml(dispatch.staff_name ?? '-');
    const totalItems = String(dispatch.total_items ?? '0');
    const status = dispatch.status ?? 'completed';

    return `
      <tr class="cursor-pointer transition-colors" data-dispatch-row="${dispatchId}">
        <td class="pl-2 flex gap-2 items-center">
          <svg class="dispatch-chevron size-4 shrink-0 text-muted-foreground transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          <span class="type-sm">${escapeHtml(time)}</span>
        </td>
        <td class="type-sm">${escapeHtml(reference)}</td>
        <td class="type-sm">${escapeHtml(staffName)}</td>
        <td class="type-sm">${escapeHtml(totalItems)}</td>
        <td>${renderStatusBadge(status)}</td>
        <td></td>
      </tr>
    `;
  }).join('');
}

/**
 * Render dispatch items table header.
 *
 * @returns {string}
 */
function renderDispatchItemsHeader() {
  const tableHeaders = [
    { key: 'product_name', label: 'Item Name', align: 'left' },
    { key: 'batch_code', label: 'Batch', align: 'left' },
    { key: 'dispatch_quantity', label: 'Sold Qty', align: 'right' },
    { key: 'quantity_deducted', label: 'Deducted', align: 'right' },
    { key: 'unit_cost', label: 'Unit Cost', align: 'right' },
  ]

  return `
    <thead>
      <tr class="text-muted-foreground/80">
        ${tableHeaders.map(header => `
          <th data-dispatch-items-sort="${header.key}" class="text-muted-foreground/80 font-normal ${header.align === 'right' ? 'text-right' : ''}">
            ${escapeHtml(header.label)}
          </th>
        `).join('')}
      </tr>
    </thead>
  `;
}

/**
 * Render dispatch items table rows.
 *
 * @param {Array<Record<string, unknown>>} items
 * @returns {string}
 */
export function renderDispatchItemsRows(items) {
  items.length === 0 ? renderEmptyState('dispatch-history') : null;

  return items.map((item) => {
    const productName = escapeHtml(item.product_name ?? '-');
    const batchCode = escapeHtml(item.batch_code ?? '-');
    const soldQty = item.dispatch_quantity ? `${item.dispatch_quantity} ${item.dispatch_uom}` : '-';
    const deducted = item.quantity_deducted ?? '-';
    const unitCost = formatCurrency(item.unit_cost);

    return `
      <tr>
        <td>${productName}</td>
        <td class="type-xs font-medium">${batchCode}</td>
        <td class="text-right">${escapeHtml(String(soldQty))}</td>
        <td class="text-right">${escapeHtml(String(deducted))}</td>
        <td class="text-right">${unitCost}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Render dispatch detail row (expandable container).
 *
 * @param {string} dispatchId
 * @returns {string}
 */
export function renderDispatchDetailRow(dispatchId) {
  return `
    <tr class="dispatch-detail-row" data-dispatch-detail="${dispatchId}">
      <td colspan="7">
        <div class="px-12 space-y-2">
          <div class="overflow-x-auto overflow-y-hidden">
            <table class="table">
              ${renderDispatchItemsHeader()}
              <tbody class="dispatch-items-tbody" data-dispatch-id="${dispatchId}">
                ${renderDispatchItemsLoading()}
              </tbody>
            </table>
          </div>
        </div>
      </td>
    </tr>
  `;
}

/**
 * Render the full dispatch table with header and body.
 *
 * @param {Array<Record<string, unknown>>} dispatches
 * @returns {string}
 */
export function renderDispatchTable(dispatches) {
  return `
    <table class="table">
      ${renderDispatchHeader()}
      <tbody id="dispatches-tbody">
        ${renderDispatchRows(dispatches)}
      </tbody>
    </table>
  `;
}

/**
 * Render loading state for dispatch table.
 *
 * @returns {string}
 */
export function renderDispatchLoading() {
  return renderLoadingRow(6, 'Loading dispatches...');
}

/**
 * Render loading state for dispatch items.
 *
 * @returns {string}
 */
export function renderDispatchItemsLoading() {
  return renderLoadingRow(5, 'Loading items...');
}

/**
 * Render error state for dispatch items.
 *
 * @param {string} message
 * @returns {string}
 */
export function renderDispatchItemsError(message = 'Failed to load items.') {
  return `
    <tr>
      <td colspan="5" class="py-4 text-center type-sm text-destructive">
        ${escapeHtml(message)}
      </td>
    </tr>
  `;
}

/**
 * Render error state for dispatch table.
 *
 * @param {string} message
 * @returns {string}
 */
export function renderDispatchError(message = 'Failed to load dispatches.') {
  return `
    <tr>
      <td colspan="6" class="py-8 text-center type-sm text-destructive">
        ${escapeHtml(message)}
      </td>
    </tr>
  `;
}