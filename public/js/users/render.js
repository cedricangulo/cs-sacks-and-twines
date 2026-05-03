import { escapeHtml, renderEmptyState } from '../utils/dom-utils.js';
import { formatDate } from '../utils/date-utils.js';

/**
 * Render table rows for users.
 *
 * @code USR-renderRows
 * @param {Array<Record<string, unknown>>} users
 * @returns {string}
 */
export function renderUserRows(users) {
  if (users.length === 0) {
    return renderEmptyState('users');
  }

  return users.map((user) => {
    const id = String(user.user_id ?? '');
    const name = String(user.name ?? '');
    const email = String(user.email ?? '');
    const createdAt = String(user.created_at ?? '');

    return `
      <tr>
        <td class="font-medium">${escapeHtml(name)}</td>
        <td>
          <a href="mailto:${escapeHtml(email)}" target="_blank" class="btn-link px-0">
            ${escapeHtml(email)}
          </a>
        </td>
        <td>${escapeHtml(formatDate(createdAt))}</td>
        <td class="text-right">
          <button
            type="button"
            class="btn-outline text-xs px-2 py-1 text-destructive"
            data-action="deactivate"
            data-user-id="${escapeHtml(id)}"
            data-user-name="${escapeHtml(name)}">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--destructive)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-minus-icon lucide-user-minus"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}