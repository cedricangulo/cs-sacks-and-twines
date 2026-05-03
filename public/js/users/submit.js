import { fetchJson } from '../utils/fetch-utils.js';
import { validateUserCreateForm } from './validation.js';
import { toast } from '../utils/toast.js';

/**
 * Set field error message and state.
 *
 * @code USR-setFieldError
 * @param {HTMLFormElement} form
 * @param {string} fieldName
 * @param {string} message
 */
function setFieldError(form, fieldName, message) {
  const field = form.querySelector(`[data-field="${fieldName}"]`);
  const input = form.querySelector(`[data-field-input="${fieldName}"]`);
  const error = form.querySelector(`[data-field-error="${fieldName}"]`);

  if (!field || !input || !error) {
    return;
  }

  field.setAttribute('data-invalid', 'true');
  input.setAttribute('aria-invalid', 'true');
  error.textContent = message;
  error.classList.remove('hidden');
}

/**
 * Clear a field error message and state.
 *
 * @code USR-clearFieldError
 * @param {HTMLFormElement} form
 * @param {string} fieldName
 */
function clearFieldError(form, fieldName) {
  const field = form.querySelector(`[data-field="${fieldName}"]`);
  const input = form.querySelector(`[data-field-input="${fieldName}"]`);
  const error = form.querySelector(`[data-field-error="${fieldName}"]`);

  if (!field || !input || !error) {
    return;
  }

  field.removeAttribute('data-invalid');
  input.removeAttribute('aria-invalid');
  error.textContent = '';
  error.classList.add('hidden');
}

/**
 * Clear multiple field errors.
 *
 * @code USR-clearFieldErrors
 * @param {HTMLFormElement} form
 * @param {string[]} fieldNames
 */
function clearFieldErrors(form, fieldNames) {
  fieldNames.forEach((fieldName) => clearFieldError(form, fieldName));
}

/**
 * Show a form-level error message.
 *
 * @code USR-showError
 * @param {HTMLElement} box
 * @param {string} message
 */
function showError(box, message) {
  box.textContent = message;
  box.classList.remove('hidden');
}

/**
 * Hide a form-level error message.
 *
 * @code USR-hideError
 * @param {HTMLElement} box
 */
function hideError(box) {
  box.textContent = '';
  box.classList.add('hidden');
}

/**
 * Focus the first invalid field in the form.
 *
 * @code USR-focusFirstInvalid
 * @param {HTMLFormElement} form
 */
function focusFirstInvalid(form) {
  const firstField = form.querySelector('[data-invalid] [data-field-input]');
  if (firstField instanceof HTMLElement) {
    firstField.focus();
  }
}

/**
 * Initialize create user form submission.
 *
 * @param {{ onSuccess?: () => void }} [options]
 */
/**
 * Initialize create user form submission.
 *
 * @code USR-initCreateForm
 * @param {{ onSuccess?: () => void }} [options]
 */
export function initUserCreateForm(options = {}) {
  const dialog = document.querySelector('[data-user-dialog]');
  const form = document.querySelector('[data-users-form]');
  const errorBox = dialog?.querySelector('[data-form-error]') || null;
  const saveButton = dialog?.querySelector('[data-save-button]') || null;

  if (!dialog || !form || !errorBox || !saveButton) {
    return;
  }

  const fields = {
    name: form.querySelector('[data-field-input="name"]'),
    email: form.querySelector('[data-field-input="email"]'),
    password: form.querySelector('[data-field-input="password"]'),
  };

  if (!fields.name || !fields.email || !fields.password) {
    return;
  }

  const resetForm = () => {
    form.reset();
    hideError(errorBox);
    clearFieldErrors(form, ['name', 'email', 'password']);
  };

  const setSubmitting = (isSubmitting) => {
    saveButton.disabled = isSubmitting;
    saveButton.textContent = isSubmitting ? 'Saving...' : 'Save staff';
  };

  const getValues = () => ({
    name: fields.name.value,
    email: fields.email.value,
    password: fields.password.value,
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideError(errorBox);
    clearFieldErrors(form, ['name', 'email', 'password']);

    const result = validateUserCreateForm(getValues());
    if (!result.success) {
      Object.entries(result.errors).forEach(([fieldName, message]) => {
        setFieldError(form, fieldName, message);
      });
      focusFirstInvalid(form);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetchJson(form.action, {
        method: 'POST',
        body: new FormData(form),
        credentials: 'same-origin',
        headers: {
          'X-Requested-With': 'fetch',
        },
      });

      if (!response || response.success !== true) {
        if (response?.errors && typeof response.errors === 'object') {
          Object.entries(response.errors).forEach(([fieldName, message]) => {
            if (typeof message === 'string') {
              setFieldError(form, fieldName, message);
            }
          });
          focusFirstInvalid(form);
          return;
        }

        showError(errorBox, response?.message || 'Unable to save staff right now. Please try again.');
        return;
      }

      dialog.close();
      resetForm();

      const userName = fields.name.value;
      toast.success(
        'Staff added successfully',
        `${userName} has been added as staff. They can now sign in with their credentials.`
      );

      if (typeof options.onSuccess === 'function') {
        options.onSuccess();
      }
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : 'Unable to save staff right now. Please try again.';
      showError(errorBox, message);
    } finally {
      setSubmitting(false);
    }
  });

  ['name', 'email', 'password'].forEach((fieldName) => {
    const input = form.querySelector(`[data-field-input="${fieldName}"]`);
    if (!input) {
      return;
    }
    input.addEventListener('input', () => {
      clearFieldError(form, fieldName);
    });
  });

  dialog.addEventListener('close', resetForm);
}

/**
 * Deactivate a user via API.
 *
 * @code USR-deactivateUser
 * @param {string} userId
 * @returns {Promise<unknown>}
 */
export async function deactivateUser(userId) {
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
