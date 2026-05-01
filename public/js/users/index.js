import { fetchJson } from '../utils/fetch-utils.js';
import { loadUsers } from './get-users.js';
import { initUserCreateForm } from './submit.js';
import { toast } from '../utils/toast.js';

let pendingDeactivateId = null;
let pendingUserName = null;

async function deactivateUser(userId) {
  const container = document.getElementById('users-container');
  const apiUrl = container?.getAttribute('data-deactivate-url') || '/api/users/deactivate';

  const formData = new FormData();
  formData.append('user_id', userId);

  return await fetchJson(apiUrl, {
    method: 'POST',
    body: formData,
    credentials: 'same-origin',
    headers: {
      'X-Requested-With': 'fetch',
    },
  });
}

function showDeactivateDialog(userId, userName) {
  const dialog = document.getElementById('confirm-deactivate-dialog');
  const nameElement = document.getElementById('deactivate-staff-name');
  const confirmButton = dialog?.querySelector('[data-confirm-deactivate]');

  if (!dialog || !nameElement || !confirmButton) {
    return;
  }

  pendingDeactivateId = userId;
  pendingUserName = userName;
  nameElement.textContent = userName;

  const handleConfirm = async () => {
    confirmButton.removeEventListener('click', handleConfirm);

    const userNameForToast = pendingUserName;
    try {
      await deactivateUser(pendingDeactivateId);
      toast.success(
        'Staff deactivated successfully',
        `${userNameForToast || 'The staff member'} can no longer sign in.`
      );
      await loadUsers({ force: true });
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : 'Unable to deactivate staff right now. Please try again.';
      toast.error('Failed to deactivate', message);
    }

    pendingDeactivateId = null;
    pendingUserName = null;
    dialog.close();
  };

  confirmButton.addEventListener('click', handleConfirm);
  dialog.showModal();
}

function bindUserActions() {
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

function initUsersPage() {
  const tableBody = document.getElementById('users-container');
  if (!tableBody) {
    return;
  }

  loadUsers();
  bindUserActions();
  initUserCreateForm({
    onSuccess: () => loadUsers({ force: true }),
  });
}

initUsersPage();
