import { fetchJson } from '../utils/fetch-utils.js';
import { validateUserCreateForm } from '../utils/validation.js';
import { toast } from '../utils/toast.js';

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

function clearFieldErrors(form, fieldNames) {
  fieldNames.forEach((fieldName) => clearFieldError(form, fieldName));
}

function showError(box, message) {
  box.textContent = message;
  box.classList.remove('hidden');
}

function hideError(box) {
  box.textContent = '';
  box.classList.add('hidden');
}

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
