import { fetchJsonResponse, sanitizeFormData } from '../utils/fetch-utils.js';
import { sanitizeFieldsForSubmit } from '../utils/sanitize.js';
import { validateSupplierForm } from './validation.js';
import { toast } from '../utils/toast.js';

/**
   * Initialize supplier form submission and validation.
   *
   * @code SUP-initForm
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

    const idInput = form.querySelector('#supplier-id');

    const fields = {
      companyName: form.querySelector('[data-field-input="company_name"]'),
      contactPerson: form.querySelector('[data-field-input="contact_person"]'),
      contactNumber: form.querySelector('[data-field-input="contact_number"]'),
      address: form.querySelector('[data-field-input="address"]'),
    };

    if (!fields.companyName || !fields.contactPerson || !fields.contactNumber || !fields.address) {
      return;
    }

    /**
     * Check if in edit mode.
     *
     * @code SUP-isEditMode
     * @returns {boolean}
     */
    const isEditMode = () => idInput && idInput.value !== '';

    /**
     * Reset the supplier form.
     *
     * @code SUP-resetForm
     */
    const resetForm = () => {
      form.reset();
      if (idInput) {
        idInput.value = '';
      }
      errorBox.textContent = '';
      errorBox.classList.add('hidden');
      clearFieldErrors();

      const title = dialog.querySelector('h2');
      const description = dialog.querySelector('p');
      if (title) title.textContent = 'Add Supplier';
      if (description) description.textContent = 'Fill in the details for the new supplier.';
      if (saveButton) saveButton.textContent = 'Save supplier';

      form.action = form.action.replace('/update', '/save');
    };

    /**
     * Toggle submitting UI state.
     *
     * @code SUP-setSubmitting
     * @param {boolean} isSubmitting
     */
    const setSubmitting = (isSubmitting) => {
      saveButton.disabled = isSubmitting;
      saveButton.textContent = isSubmitting
        ? 'Saving...'
        : (isEditMode() ? 'Update supplier' : 'Save supplier');
    };

    /**
     * Show a form-level error message.
     *
     * @code SUP-showError
     * @param {string} message
     */
    const showError = (message) => {
      errorBox.textContent = message;
      errorBox.classList.remove('hidden');
    };

  /**
   * Set field error message and state.
   *
   * @code SUP-setFieldError
   * @param {string} fieldName
   * @param {string} message
   */
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

  /**
   * Clear a field error message and state.
   *
   * @code SUP-clearFieldError
   * @param {string} fieldName
   */
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

  /**
   * Clear all supplier field errors.
   *
   * @code SUP-clearFieldErrors
   */
  const clearFieldErrors = () => {
    ['company_name', 'contact_person', 'contact_number', 'address'].forEach((fieldName) => {
      clearFieldError(fieldName);
    });
  };

  /**
   * Gather supplier form values.
   *
   * @code SUP-getValues
   * @returns {Record<string, string>}
   */
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

    const rawValues = getValues();
    const sanitizedValues = sanitizeFieldsForSubmit(rawValues);
    const result = validateSupplierForm(sanitizedValues);
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
      const { response, payload } = await fetchJsonResponse(form.action, {
        method: 'POST',
        body: sanitizeFormData(form),
        credentials: 'same-origin',
        headers: {
          'X-Requested-With': 'fetch',
        },
      });

      const message = payload && typeof payload.message === 'string'
        ? payload.message
        : 'Unable to save supplier right now. Please try again.';

      if (!response.ok || !payload || payload.success !== true) {
        if (payload?.errors && typeof payload.errors === 'object') {
          Object.entries(payload.errors).forEach(([fieldName, messageValue]) => {
            if (typeof messageValue === 'string') {
              setFieldError(fieldName, messageValue);
            }
          });
          const firstField = form.querySelector('[data-invalid] [data-field-input]');
          if (firstField instanceof HTMLElement) {
            firstField.focus();
          }
          return;
        }

        showError(message);
        return;
      }

      dialog.close();
      resetForm();

      const companyName = fields.companyName.value;
      const action = isEditMode() ? 'updated' : 'added';
      toast.success(
        `Supplier ${action === 'updated' ? 'updated' : 'added'} successfully`,
        `${companyName} has been ${action} to your suppliers.${action === 'added' ? ' You can now create stock intake from this supplier.' : ''}`
      );

      if (typeof options.onSuccess === 'function') {
        options.onSuccess();
      }
    } catch {
      showError('Unable to save supplier right now. Please try again.');
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
