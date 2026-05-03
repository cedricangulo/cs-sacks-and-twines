import { escapeHtml, renderEmptyState } from '../utils/dom-utils.js';
import { formatDate } from '../utils/date-utils.js';

export function renderLogRow(log, includeUser = true) {
  const actionBadge = getActionBadge(log.action);

  const userColumn = includeUser ? `
    <td>
      <div class="flex flex-col">
        <span class="font-medium">${escapeHtml(log.user_name || '')}</span>
        <span class="type-xs text-muted-foreground">${escapeHtml(log.user_email || '')}</span>
      </div>
    </td>
  ` : '';

  return `
    <tr>
      <td class="whitespace-nowrap">${formatDate(log.created_at)}</td>
      ${userColumn}
      <td>${actionBadge}</td>
      <td>
        <p class="max-w-prose type-base truncate line-clamp-1">
          ${escapeHtml(log.description || '')}
        </p>
      </td>
    </tr>
  `;
}

function getActionBadge(action) {
  const badgeClass = action === 'stock_in' ? '-secondary' : action === 'stock_out' ? '-outline' : '-ghost';
  const label = action === 'stock_in' ? 'Stock In' : action === 'stock_out' ? 'Stock Out' : action;

  return `<span class="badge${badgeClass}">${escapeHtml(label)}</span>`;
}

export function renderLogsTable(logs, includeUser = true) {
  if (logs.length === 0) {
    return renderEmptyState('audit-logs', 'No audit logs found', 'Activity history will appear here once actions are recorded.');
  }

  return logs.map(log => renderLogRow(log, includeUser)).join('');
}

export function renderPagination(pagination, containerId) {
  const { page, total_pages } = pagination;

  if (total_pages <= 1) {
    return '';
  }

  const prevDisabled = page <= 1;
  const nextDisabled = page >= total_pages;

  let pages = '';
  for (let i = 1; i <= total_pages; i++) {
    const isCurrent = i === page;
    const btnClass = isCurrent ? 'btn-icon' : 'btn-icon-ghost';
    pages += `
      <li>
        <button
          type="button"
          class="${btnClass}"
          data-page="${i}"
          ${isCurrent ? 'aria-current="page"' : ''}
        >
          ${i}
        </button>
      </li>
    `;
  }

  if (total_pages > 5) {
    pages = `
      <li>
        <button type="button" class="btn-icon-ghost" data-page="1">1</button>
      </li>
      <li>
        <div class="size-9 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4 shrink-0">
            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
          </svg>
        </div>
      </li>
      <li>
        <button type="button" class="btn-icon-ghost" data-page="${total_pages}">${total_pages}</button>
      </li>
    `;
  }

  return `
    <nav role="navigation" aria-label="pagination" class="ml-auto flex w-full justify-center">
      <ul class="flex flex-row items-center gap-1">
        <li>
          <button
            type="button"
            class="btn-ghost"
            data-page="${page - 1}"
            ${prevDisabled ? 'disabled' : ''}
            ${prevDisabled ? 'aria-disabled="true"' : ''}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4 shrink-0">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Previous
          </button>
        </li>
        ${pages}
        <li>
          <button
            type="button"
            class="btn-ghost"
            data-page="${page + 1}"
            ${nextDisabled ? 'disabled' : ''}
            ${nextDisabled ? 'aria-disabled="true"' : ''}
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4 shrink-0">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </li>
      </ul>
    </nav>
  `;
}