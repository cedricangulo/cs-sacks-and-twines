import { escapeHtml, renderEmptyState } from '../utils/dom-utils.js';
import { formatDate, formatRelativeTime } from '../utils/date-utils.js';
import { formatCurrency } from '../utils/format.js';

/**
 * Parse a log description as JSON when possible.
 *
 * @code AUD-parseDescription
 * @param {string} description
 * @param {string} action
 * @returns {Record<string, unknown> | null}
 */
function parseDescription(description, action) {
  if (!description) return null;
  try {
    const parsed = JSON.parse(description);
    if (parsed && typeof parsed === 'object') return parsed;
    return null;
  } catch {
    return null;
  }
}

/**
 * Format a field key into a friendly label.
 *
 * @code AUD-formatFieldLabel
 * @param {string} field
 * @returns {string}
 */
function formatFieldLabel(field) {
  const labels = {
    supplier_id: 'Supplier',
    quantity_received: 'Qty Received',
    quantity_remaining: 'Qty Remaining',
    total_cost: 'Total Cost',
    unit_cost: 'Unit Cost',
    expiry_date: 'Expiry Date',
    status: 'Status',
    quantity_initial: 'Initial Qty',
    quantity_consumed: 'Consumed Qty',
    total_procurement_cost: 'Total Cost',
    batch_code: 'Batch Code',
  };
  return labels[field] || field.replace(/_/g, ' ');
}

/**
 * Render a badge for a log action.
 *
 * @code AUD-getActionBadge
 * @param {string} action
 * @returns {string}
 */
function getActionBadge(action) {
  const badges = {
    'stock_in': { class: '-secondary', label: 'Stock In' },
    'stock_out': { class: '-outline', label: 'Stock Out' },
    'batch_update': { class: '-outline', label: 'Batch Update' },
    'batch_void': { class: '-destructive', label: 'Batch Void' },
    'auth_sign_in': { class: '-secondary', label: 'Sign In' },
    'auth_sign_in_failed': { class: '-destructive', label: 'Failed Sign In' },
    'auth_sign_out': { class: '-ghost', label: 'Sign Out' },
    'user_create': { class: '-secondary', label: 'User Created' },
    'user_deactivate': { class: '-destructive', label: 'User Deactivated' },
    'supplier_create': { class: '-secondary', label: 'Supplier Created' },
  };
  const { class: badgeClass, label } = badges[action] || { class: '-ghost', label: action };
  return `<span class="badge${badgeClass}">${escapeHtml(label)}</span>`;
}

/**
 * Build a compact description string for a log.
 *
 * @code AUD-getShortDescription
 * @param {string} description
 * @param {string} action
 * @returns {string}
 */
function getShortDescription(description, action) {
  const parsed = parseDescription(description, action);
  if (!parsed) return escapeHtml(description || '');

  switch (action) {
    case 'stock_in':
      return `Added ${parsed.quantity} ${parsed.uom} of ${escapeHtml(parsed.product_name || '')} (${escapeHtml(parsed.batch_code || '')})`;
    case 'stock_out':
      const ref = parsed.customer_reference ? ` — Ref: ${escapeHtml(parsed.customer_reference)}` : '';
      if (parsed.products && parsed.products.length > 0) {
        const productParts = parsed.products.slice(0, 3).map(p => {
          const rollToKg = 20;
          let displayQty;
          if (p.category === 'twines') {
            const kgValue = p.uom === 'roll' ? p.quantity * rollToKg : p.quantity;
            const rollValue = kgValue / rollToKg;
            const rollDecimals = rollValue < 10 ? 2 : 1;
            displayQty = p.uom === 'roll'
              ? `${p.quantity} roll${p.quantity !== 1 ? 's' : ''} (${kgValue}kg)`
              : `${p.quantity}kg (${rollValue.toFixed(rollDecimals)} roll${rollValue !== 1 ? 's' : ''})`;
          } else {
            displayQty = p.uom === 'piece' ? `${p.quantity}x` : `${p.quantity}kg`;
          }
          return `${displayQty} ${escapeHtml(p.name || '')}`;
        }).join(', ');
        const more = parsed.products.length > 3 ? ` +${parsed.products.length - 3} more` : '';
        return `${productParts}${more}${ref}`;
      }
      return `Dispatched ${parsed.total_quantity} units across ${parsed.items_count} product(s)${ref}`;
    case 'batch_update':
      if (parsed.changes && Object.keys(parsed.changes).length > 0) {
        const fieldLabels = Object.keys(parsed.changes).map(f => formatFieldLabel(f)).join(', ');
        return `${escapeHtml(parsed.batch_code || '')} — Updated: ${fieldLabels}`;
      }
      return `${escapeHtml(parsed.batch_code || '')} — Updated`;
    case 'batch_void':
      return `${escapeHtml(parsed.batch_code || '')} — Removed ${parsed.quantity_removed} units (${formatCurrency(parsed.cost_removed)})`;
    case 'auth_sign_in':
      return `Signed in as ${escapeHtml(parsed.email || '')} (${escapeHtml(parsed.role || '')})`;
    case 'auth_sign_in_failed':
      return `Failed sign in attempt for ${escapeHtml(parsed.email || '')} — ${escapeHtml(parsed.reason || '')}`;
    case 'auth_sign_out':
      return `Signed out: ${escapeHtml(parsed.name || '')} (${escapeHtml(parsed.email || '')})`;
    case 'user_create':
      return `Created user ${escapeHtml(parsed.name || '')} (${escapeHtml(parsed.email || '')}) as ${escapeHtml(parsed.role || '')}`;
    case 'user_deactivate':
      return `Deactivated user ${escapeHtml(parsed.name || '')} (${escapeHtml(parsed.email || '')})`;
    case 'supplier_create':
      return `Created supplier ${escapeHtml(parsed.company_name || '')} — Contact: ${escapeHtml(parsed.contact_person || '')}`;
    default:
      return escapeHtml(description);
  }
}

/**
 * Render the log details row.
 *
 * @code AUD-renderDetailsRow
 * @param {Record<string, unknown>} log
 * @returns {string}
 */
export function renderLogDetailsRow(log) {
  const parsed = parseDescription(log.description, log.action);
  const details = [];

  details.push({ label: 'timestamp', value: log.created_at });
  details.push({ label: 'action', value: log.action, isBadge: true });
  details.push({ label: 'actor', value: log.user_name });
  details.push({ label: 'actor_id', value: log.user_id });
  if (log.user_email) details.push({ label: 'actor_email', value: log.user_email });
  if (log.user_role) details.push({ label: 'actor_role', value: log.user_role });

  if (parsed) {
    if (parsed.resource_type) details.push({ label: 'resource_type', value: parsed.resource_type });
    if (parsed.resource_id) details.push({ label: 'resource_id', value: parsed.resource_id });
    if (parsed.reason && parsed.reason !== 'n/a') details.push({ label: 'reason', value: parsed.reason });
    if (parsed.changes && Object.keys(parsed.changes).length > 0) {
      const changesRows = Object.entries(parsed.changes).map(([field, vals]) => `
        <div class="grid grid-cols-2 p-0 hover:bg-muted/50">
          <div class="font-medium text-foreground">${formatFieldLabel(field)}</div>
          <div class="text-muted-foreground">
            <span class="line-through">${escapeHtml(String(vals.old))}</span>
            <span class="mx-1">→</span>
            <span class="font-medium">${escapeHtml(String(vals.new))}</span>
          </div>
        </div>
      `).join('');
      details.push({ label: 'changes', value: changesRows, isHtml: true });
    }
  }

  if (log.ip_address) details.push({ label: 'ip_address', value: log.ip_address });
  if (log.user_agent) details.push({ label: 'user_agent', value: log.user_agent });

  const detailsHtml = details.map(d => {
    if (d.isHtml) {
      return `
        <div class="grid grid-cols-[180px_1fr] py-1 px-4 hover:bg-muted/50">
          <div class="font-medium text-foreground">${d.label}</div>
          <div class="text-muted-foreground">${d.value}</div>
        </div>
      `;
    }
    if (d.isBadge) {
      return `
        <div class="grid grid-cols-[180px_1fr] py-1 px-4 hover:bg-muted/50">
          <div class="font-medium text-foreground">${d.label}</div>
          <div>${getActionBadge(d.value)}</div>
        </div>
      `;
    }
    return `
      <div class="grid grid-cols-[180px_1fr] py-1 px-4 hover:bg-muted/50">
        <div class="font-medium text-foreground">${d.label}</div>
        <div class="text-muted-foreground">${escapeHtml(String(d.value))}</div>
      </div>
    `;
  }).join('');

  return `
    <tr class="log-details-row hover:bg-none!" data-log-id="${log.log_id}">
      <td colspan="4" class="py-4 border-b border-border">
        <div class="grid grid-cols-1">
          ${detailsHtml}
        </div>
      </td>
    </tr>
  `;
}

/**
 * Render a log table row.
 *
 * @code AUD-renderRow
 * @param {Record<string, unknown>} log
 * @param {boolean} [includeUser]
 * @returns {string}
 */
export function renderLogRow(log, includeUser = true) {
  return `
    <tr class="log-row cursor-pointer" data-log-id="${log.log_id}" data-expanded="false">
      <td colspan="4" class="py-4 px-4">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium text-muted-foreground">${escapeHtml(log.user_name || 'Unknown User')}  —</span> ${getActionBadge(log.action)}
            </div>
            <p class="truncate max-w-prose">${getShortDescription(log.description, log.action)} — ${formatRelativeTime(log.created_at)}</p>
          </div>
          <button type="button" class="log-toggle-btn p-1 hover:bg-muted rounded-md shrink-0" aria-label="Toggle details">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted-foreground">
              <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

/**
 * Render the logs table body.
 *
 * @code AUD-renderTable
 * @param {Array<Record<string, unknown>>} logs
 * @param {boolean} [includeUser]
 * @returns {string}
 */
export function renderLogsTable(logs, includeUser = true) {
  if (logs.length === 0) {
    return renderEmptyState('audit-logs');
  }

  return logs.map(log => renderLogRow(log, includeUser)).join('');
}

/**
 * Render pagination controls for logs.
 *
 * @code AUD-renderPagination
 * @param {{ page: number, total_pages: number }} pagination
 * @param {string} containerId
 * @returns {string}
 */
export function renderPagination(pagination, containerId) {
  const { page, total_pages } = pagination;

  if (total_pages <= 1) return '';

  const prevDisabled = page <= 1;
  const nextDisabled = page >= total_pages;

  let pages = '';
  for (let i = 1; i <= total_pages; i++) {
    const isCurrent = i === page;
    const btnClass = isCurrent ? 'btn-icon' : 'btn-icon-ghost';
    pages += `
      <li>
        <button type="button" class="${btnClass}" data-page="${i}" ${isCurrent ? 'aria-current="page"' : ''}>
          ${i}
        </button>
      </li>
    `;
  }

  if (total_pages > 5) {
    pages = `
      <li><button type="button" class="btn-icon-ghost" data-page="1">1</button></li>
      <li><div class="size-9 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></div></li>
      <li><button type="button" class="btn-icon-ghost" data-page="${total_pages}">${total_pages}</button></li>
    `;
  }

  return `
    <nav role="navigation" aria-label="pagination" class="ml-auto flex w-full justify-center mt-6">
      <ul class="flex flex-row items-center gap-1">
        <li>
          <button type="button" class="btn-ghost" data-page="${page - 1}" ${prevDisabled ? 'disabled' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="m15 18-6-6 6-6"/></svg>
            Previous
          </button>
        </li>
        ${pages}
        <li>
          <button type="button" class="btn-ghost" data-page="${page + 1}" ${nextDisabled ? 'disabled' : ''}>
            Next
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </li>
      </ul>
    </nav>
  `;
}