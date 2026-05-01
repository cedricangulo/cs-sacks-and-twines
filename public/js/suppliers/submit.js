import { fetchJson } from '../utils/fetch-utils.js';
import { validateSupplierForm } from './validation.js';
import { toast } from '../utils/toast.js';

/**
 * Initialize supplier form submission and validation.
 *
 * @param {{ onSuccess?: () => void }} [options]
 */
export function initSuppliersForm(options = {}) {
  const dialog = document.querySelector('[data-supplier-dialog]');
  const form = document.querySelector('[data-suppliers-form]');
  const errorBox = document.querySelector('[data-form-error]');
  const saveButton = document.querySelector('[data-save-button]');

  if (!dialog || !form || !errorBox || !saveButton) {
    return;
  }

  const fields = {
    companyName: form.querySelector('[data-field-input="company_name"]'),
    contactPerson: form.querySelector('[data-field-input="contact_person"]'),
    contactNumber: form.querySelector('[data-field-input="contact_number"]'),
    address: form.querySelector('[data-field-input="address"]'),
  };

  if (!fields.companyName || !fields.contactPerson || !fields.contactNumber || !fields.address) {
    return;
  }

  const resetForm = () => {
    form.reset();
    errorBox.textContent = '';
    errorBox.classList.add('hidden');
    clearFieldErrors();
  };

  const setSubmitting = (isSubmitting) => {
    saveButton.disabled = isSubmitting;
    saveButton.textContent = isSubmitting ? 'Saving...' : 'Save supplier';
  };

  const showError = (message) => {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
  };

  const setFieldError = (fieldName, message) => {
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
  };

  const clearFieldError = (fieldName) => {
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
  };

  const clearFieldErrors = () => {
    ['company_name', 'contact_person', 'contact_number', 'address'].forEach((fieldName) => {
      clearFieldError(fieldName);
    });
  };

  const getValues = () => ({
    company_name: fields.companyName.value,
    contact_person: fields.contactPerson.value,
    contact_number: fields.contactNumber.value,
    address: fields.address.value,
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.textContent = '';
    errorBox.classList.add('hidden');
    clearFieldErrors();

    const result = validateSupplierForm(getValues());
    if (!result.success) {
      const errors = result.errors;
      Object.entries(errors).forEach(([fieldName, message]) => {
        setFieldError(fieldName, message);
      });
      const firstField = form.querySelector('[data-invalid] [data-field-input]');
      if (firstField instanceof HTMLElement) {
        firstField.focus();
      }
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
              setFieldError(fieldName, message);
            }
          });
          const firstField = form.querySelector('[data-invalid] [data-field-input]');
          if (firstField instanceof HTMLElement) {
            firstField.focus();
          }
          return;
        }

        showError(response?.message || 'Unable to save supplier right now. Please try again.');
        return;
      }

      dialog.close();
      resetForm();

      const companyName = fields.companyName.value;
      toast.success(
        'Supplier added successfully',
        `${companyName} has been added to your suppliers. You can now create stock intake from this supplier.`
      );

      if (typeof options.onSuccess === 'function') {
        options.onSuccess();
      }
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : 'Unable to save supplier right now. Please try again.';
      showError(message);
    } finally {
      setSubmitting(false);
    }
  });

  ['company_name', 'contact_person', 'contact_number', 'address'].forEach((fieldName) => {
    const input = form.querySelector(`[data-field-input="${fieldName}"]`);
    if (!input) {
      return;
    }
    input.addEventListener('input', () => {
      clearFieldError(fieldName);
    });
  });

  dialog.addEventListener('close', resetForm);
}
