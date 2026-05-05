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
import { validateInventoryForm } from './validation.js';
import { toast } from '../utils/toast.js';
import { fetchJsonResponse, sanitizeFormData } from '../utils/fetch-utils.js';
import { loadProducts } from './get-products.js';

/**
 * Attach inventory submit handling.
 *
 * @code INV-initSubmission
 * @param {ReturnType<import('./context.js').createInventoryState>} state
 * @param {{ onSuccess?: () => void }} [options]
 */
export function initInventorySubmission(state, options = {}) {
  const { onSuccess } = options;

  ['product_id', 'name', 'category', 'base_uom', 'weight_per_unit', 'supplier_id', 'quantity_received', 'total_procurement_cost', 'low_stock_threshold'].forEach((fieldName) => {
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

    const { values } = validateBeforeSubmit(state);
    const result = validateInventoryForm(values);
    if (!result.success) {
      const errors = result.errors;
      Object.entries(errors).forEach(([fieldName, message]) => {
        setFieldError(state, fieldName, message);
      });
      const firstField = state.form.querySelector('[data-invalid] [data-field-input]');
      if (firstField instanceof HTMLElement) {
        firstField.focus();
      }
      if (errors.product_id) {
        state.trigger.focus();
      }
      return;
    }

    setSubmittingState(state, true);
    clearDialogError(state);
    clearFieldErrors(state);

    try {
      const { response, payload } = await fetchJsonResponse(state.submitUrl, {
        method: 'POST',
        body: sanitizeFormData(state.form),
        credentials: 'same-origin',
        headers: {
          'X-Requested-With': 'fetch',
        },
      });

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

      const productName = state.itemNameInput.value || 'the product';
      const quantity = values.quantity_received || '';
      const unit = values.base_uom || '';
      const cost = values.total_procurement_cost || '';
      const batchCode = payload?.data?.batch_code || '';

      toast.success(
        'Stock saved successfully',
        `Added ${quantity} ${unit} of ${productName}. Total cost: ₱${Number(cost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}. Batch: ${batchCode}.`
      );

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
