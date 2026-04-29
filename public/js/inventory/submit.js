import {
  clearDialogError,
  clearFieldError,
  clearFieldErrors,
  resetForm,
  setSubmittingState,
  setFieldError,
  showDialogError,
  validateBeforeSubmit,
} from './state.js';

/**
 * Attach inventory submit handling.
 *
 * @param {ReturnType<import('./context.js').createInventoryState>} state
 * @param {{ onSuccess?: () => void }} [options]
 */
export function initInventorySubmission(state, options = {}) {
  const { onSuccess } = options;

  ['product_id', 'name', 'category', 'base_uom', 'supplier_id', 'quantity_received', 'unit_cost'].forEach((fieldName) => {
    const input = state.form.querySelector(`[data-field-input="${fieldName}"]`);
    if (!input) {
      return;
    }
    input.addEventListener('input', () => {
      clearFieldError(state, fieldName);
    });
  });

  state.trigger.addEventListener('click', () => {
    clearFieldError(state, 'product_id');
  });

  state.form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validateBeforeSubmit(state)) {
      return;
    }

    setSubmittingState(state, true);
    clearDialogError(state);
    clearFieldErrors(state);

    try {
      const response = await fetch(state.submitUrl, {
        method: 'POST',
        body: new FormData(state.form),
        credentials: 'same-origin',
        headers: {
          'X-Requested-With': 'fetch',
        },
      });

      const payload = await response.json().catch(() => null);
      const message = payload && typeof payload.message === 'string'
        ? payload.message
        : 'Unable to save inventory right now. Please try again.';

      if (!response.ok || !payload || payload.success !== true) {
        if (payload?.errors && typeof payload.errors === 'object') {
          Object.entries(payload.errors).forEach(([fieldName, messageValue]) => {
            if (typeof messageValue === 'string') {
              setFieldError(state, fieldName, messageValue);
            }
          });
          const firstField = state.form.querySelector('[data-invalid] [data-field-input]');
          if (firstField instanceof HTMLElement) {
            firstField.focus();
          }
          return;
        }

        showDialogError(state, message);
        return;
      }

      state.dialog.close();
      resetForm(state);

      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch {
      showDialogError(state, 'Unable to save inventory right now. Please try again.');
    } finally {
      setSubmittingState(state, false);
    }
  });
}
