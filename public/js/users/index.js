import { initUsersPage, refreshUsers } from './events.js';
import { initUserCreateForm } from './submit.js';

/**
 * Initialize the users page with form.
 */
function initUsersPageWithForm() {
  initUsersPage();
  initUserCreateForm({
    onSuccess: () => refreshUsers(),
  });
}

initUsersPageWithForm();