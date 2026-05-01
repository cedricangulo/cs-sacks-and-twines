import { formatDate } from '../utils/date-utils.js';
import { fetchJson } from '../utils/fetch-utils.js';
import { escapeHtml, renderEmptyState } from '../utils/dom-utils.js';

let lastSignature = [];

/**
 * Fetch users for the table.
 *
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function getUsers() {
  const container = document.getElementById('users-container');
  const apiUrl = container?.getAttribute('data-api-url') || '/api/users';

  const payload = await fetchJson(apiUrl);

  if (!Array.isArray(payload)) {
    throw new Error('Users API returned an unexpected response.');
  }

  return payload;
}

/**
 * Render user rows.
 *
 * @param {Array<Record<string, unknown>>} users
 * @returns {string}
 */
export function renderUsers(users) {
  if (users.length === 0) {
    return renderEmptyState('users');
  }

  return users.map((user) => {
    const id = String(user.user_id ?? '');
    const name = String(user.name ?? '');
    const email = String(user.email ?? '');
    const role = String(user.role ?? '');
    const createdAt = String(user.created_at ?? '');

    return `
      <tr>
        <td class="font-medium">${escapeHtml(name)}</td>
        <td>${escapeHtml(email)}</td>
        <td>${role === 'staff' ? 'Staff' : escapeHtml(role)}</td>
        <td>${escapeHtml(formatDate(createdAt))}</td>
        <td class="text-right">
          <button
            type="button"
            class="btn-outline text-xs px-2 py-1 text-destructive"
            data-action="deactivate"
            data-user-id="${escapeHtml(id)}"
            data-user-name="${escapeHtml(name)}">
            Deactivate
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Build a signature for change detection.
 *
 * @param {Array<Record<string, unknown>>} users
 * @returns {string}
 */
function buildSignature(users) {
  return users
    .map((user) => `${user.user_id ?? ''}|${user.updated_at ?? ''}`)
    .join('|');
}

/**
 * Load users into the table body.
 *
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<void>}
 */
export async function loadUsers(options = {}) {
  const container = document.getElementById('users-container');
  if (!container) {
    return;
  }

  try {
    const users = await getUsers();
    const signature = buildSignature(users);

    if (!options.force && signature === lastSignature) {
      return;
    }

    lastSignature = signature;
    container.innerHTML = renderUsers(users);
  } catch (error) {
    console.error('Failed to load users:', error);
    container.innerHTML = renderEmptyState('error', 'Failed to load staff', 'Please try again later.');
  }
}
