import { createClientTable } from '../utils/data-table.js';
import { toast } from '../utils/toast.js';
import { getUsers } from './get-users.js';
import { renderUserRows } from './render.js';
import { deactivateUser } from './submit.js';

let table;

/**
 * Initialize the users table.
 *
 * @code USR-initTable
 */
export function initUsersTable() {
  table = createClientTable({
    container: '#users-container',
    fetchFn: getUsers,
    renderFn: renderUserRows,
    sortableColumns: [
      { key: 'name', column: 'name' },
      { key: 'email', column: 'email' },
      { key: 'created_at', column: 'created_at' },
    ],
    filterBar: {
      id: 'users',
      searchPlaceholder: 'Search staff...',
    },
    id: 'users',
  });

  table.init();
}

/**
 * Refresh the users table.
 *
 * @code USR-refresh
 */
export function refreshUsers() {
  if (table) {
    table.load();
  }
}

/**
 * Show the deactivate confirmation dialog.
 *
 * @code USR-showDeactivateDialog
 * @param {string} userId
 * @param {string} userName
 */
export function showDeactivateDialog(userId, userName) {
  const dialog = document.getElementById('confirm-deactivate-dialog');
  const nameElement = document.getElementById('deactivate-user-description');
  const confirmButton = dialog?.querySelector('[data-confirm-deactivate]');

  if (!dialog || !nameElement || !confirmButton) {
    return;
  }

  const handleConfirm = async () => {
    confirmButton.removeEventListener('click', handleConfirm);

    const userNameForToast = userName;
    try {
      await deactivateUser(userId);
      toast.success(
        'Staff deactivated successfully',
        `${userNameForToast || 'The staff member'} can no longer sign in.`
      );
      await refreshUsers();
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : 'Unable to deactivate staff right now. Please try again.';
      toast.error('Failed to deactivate', message);
    }

    dialog.close();
  };

  confirmButton.addEventListener('click', handleConfirm);
  nameElement.textContent = userName;
  dialog.showModal();
}

/**
 * Bind click handlers to user action buttons.
 *
 * @code USR-bindActions
 */
export function bindUserActions() {
  const container = document.getElementById('users-container');
  if (!container) {
    return;
  }

  container.addEventListener('click', async (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) {
      return;
    }

    const actionButton = target.closest('[data-action="deactivate"]');
    if (!actionButton) {
      return;
    }

    const userId = actionButton.getAttribute('data-user-id') || '';
    const userName = actionButton.getAttribute('data-user-name') || '';

    showDeactivateDialog(userId, userName || 'this staff member');
  });
}

/**
 * Initialize the users page.
 *
 * @code USR-initPage
 */
export function initUsersPage() {
  const tableBody = document.getElementById('users-container');
  if (!tableBody) {
    return;
  }

  initUsersTable();
  bindUserActions();
}