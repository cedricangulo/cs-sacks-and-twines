import { fetchJson, fetchJsonResponse } from '../utils/fetch-utils.js';
import { toast } from '../utils/toast.js';

const hiddenClass = 'hidden';
let closeHandlerAttached = false;

/**
 * Get the edit inventory dialog.
 *
 * @code INV-getEditDialog
 * @returns {HTMLDialogElement | null}
 */
function getDialog() {
  return document.querySelector('[data-edit-inventory-dialog]');
}

/**
 * Get the edit inventory form.
 *
 * @code INV-getEditForm
 * @returns {HTMLFormElement | null}
 */
function getForm() {
  return document.querySelector('[data-edit-inventory-form]');
}

/**
 * Get an edit form field input.
 *
 * @code INV-getEditField
 * @param {string} name
 * @returns {HTMLElement | null}
 */
function getField(name) {
  return getForm()?.querySelector(`[data-field-input="${name}"]`);
}

/**
 * Get an edit form field error element.
 *
 * @code INV-getEditError
 * @param {string} name
 * @returns {HTMLElement | null}
 */
function getError(name) {
  return getForm()?.querySelector(`[data-field-error="${name}"]`);
}

/**
 * Set a field value in the edit form.
 *
 * @code INV-setEditFieldValue
 * @param {string} name
 * @param {string | null | undefined} value
 */
function setFieldValue(name, value) {
  const field = getField(name);
  if (!field) return;

  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
    field.value = value ?? '';
  }
}

/**
 * Enable or disable a field in the edit form.
 *
 * @code INV-setEditFieldDisabled
 * @param {string} name
 * @param {boolean} disabled
 */
function setFieldDisabled(name, disabled) {
  const field = getField(name);
  if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
    field.disabled = disabled;
  }
}

/**
 * Toggle lock state for quantity fields.
 *
 * @code INV-toggleEditQuantityLock
 * @param {boolean} isLocked
 */
function toggleQuantityLock(isLocked) {
  setFieldDisabled('quantity_received', isLocked);
  setFieldDisabled('total_procurement_cost', isLocked);

  const note = getForm()?.querySelector('[data-edit-quantity-lock-note]');
  if (note instanceof HTMLElement) {
    note.classList.toggle(hiddenClass, !isLocked);
  }
}

/**
 * Set the edit dialog image preview (no-op).
 *
 * @code INV-setEditImagePreview
 * @param {string} src
 * @param {string} alt
 */
function setImagePreview(src, alt) {
  // Image removed from simplified edit dialog - no-op for backwards compatibility
}

/**
 * Clear edit form errors.
 *
 * @code INV-clearEditErrors
 */
function clearErrors() {
  const form = getForm();
  const errorAlert = form?.querySelector('[data-edit-form-error]');
  if (errorAlert instanceof HTMLElement) {
    errorAlert.textContent = '';
    errorAlert.classList.add(hiddenClass);
  }

  form?.querySelectorAll('[data-field-error]').forEach((error) => {
    if (error instanceof HTMLElement) {
      error.textContent = '';
      error.classList.add(hiddenClass);
    }
  });

  form?.querySelectorAll('[data-invalid]').forEach((field) => {
    field.removeAttribute('data-invalid');
  });
}

/**
 * Show a form-level error in the edit dialog.
 *
 * @code INV-showEditError
 * @param {string} message
 */
function showError(message) {
  const form = getForm();
  const errorAlert = form?.querySelector('[data-edit-form-error]');
  if (errorAlert instanceof HTMLElement) {
    errorAlert.textContent = message;
    errorAlert.classList.remove(hiddenClass);
  }
}

/**
 * Set a field error in the edit form.
 *
 * @code INV-setEditFieldError
 * @param {string} name
 * @param {string} message
 */
function setFieldError(name, message) {
  const field = getForm()?.querySelector(`[data-field="${name}"]`);
  const input = getField(name);
  const error = getError(name);

  if (field instanceof HTMLElement) {
    field.setAttribute('data-invalid', 'true');
  }
  if (input instanceof HTMLElement) {
    input.setAttribute('aria-invalid', 'true');
  }
  if (error instanceof HTMLElement) {
    error.textContent = message;
    error.classList.remove(hiddenClass);
  }
}

/**
 * Clear a field error in the edit form.
 *
 * @code INV-clearEditFieldError
 * @param {string} name
 */
function clearFieldError(name) {
  const field = getForm()?.querySelector(`[data-field="${name}"]`);
  const input = getField(name);
  const error = getError(name);

  field?.removeAttribute('data-invalid');
  input?.removeAttribute('aria-invalid');
  if (error instanceof HTMLElement) {
    error.textContent = '';
    error.classList.add(hiddenClass);
  }
}

/**
 * Toggle submitting state in the edit form.
 *
 * @code INV-setEditSubmittingState
 * @param {boolean} isSubmitting
 */
function setSubmittingState(isSubmitting) {
  const saveButton = document.querySelector('[data-edit-save-button]');
  if (saveButton instanceof HTMLButtonElement) {
    saveButton.disabled = isSubmitting;
    saveButton.textContent = isSubmitting ? 'Saving...' : 'Save changes';
  }
}

/**
 * Populate the edit dialog with batch data.
 *
 * @code INV-populateEditDialog
 * @param {Record<string, unknown>} batch
 */
function populateDialog(batch) {
  const batchId = String(batch.batch_id ?? '');
  const productId = String(batch.product_id ?? '');
  const productName = String(batch.product_name ?? '');
  const supplierId = String(batch.supplier_id ?? '');
  const quantityReceived = String(batch.quantity_received ?? '');
  const totalCost = String(batch.total_procurement_cost ?? '');
  const canEditQuantities = Boolean(batch.can_edit_quantities ?? true);

  setFieldValue('supplier_id', supplierId);
  setFieldValue('quantity_received', quantityReceived);
  setFieldValue('total_procurement_cost', totalCost);
  toggleQuantityLock(!canEditQuantities);

  const batchIdField = getField('batch_id');
  const productIdField = getField('product_id');
  if (batchIdField instanceof HTMLInputElement) {
    batchIdField.value = batchId;
  }
  if (productIdField instanceof HTMLInputElement) {
    productIdField.value = productId;
  }

  const title = document.querySelector('#edit-inventory-dialog-title');
  const description = document.querySelector('#edit-inventory-dialog-description');
  if (title instanceof HTMLElement) {
    title.textContent = 'Edit Batch';
  }
  if (description instanceof HTMLElement) {
    description.textContent = productName ? `Product: ${productName}` : '';
  }
}

/**
 * Attach input clear handlers for edit form.
 *
 * @code INV-attachEditClearHandlers
 */
function attachClearHandlers() {
  const form = getForm();
  if (!form) return;

  ['supplier_id', 'quantity_received', 'total_procurement_cost'].forEach((name) => {
    const input = getField(name);
    input?.addEventListener('input', () => clearFieldError(name));
    input?.addEventListener('change', () => clearFieldError(name));
  });
}

/**
 * Load batch details for editing.
 *
 * @code INV-loadBatchDetail
 * @param {string} batchId
 * @returns {Promise<Record<string, unknown>>}
 */
async function loadBatch(batchId) {
  const container = document.getElementById('products-container');
  const apiUrl = container?.getAttribute('data-batch-detail-url') || '/api/inventory/batches/detail';
  const url = `${apiUrl}?batch_id=${encodeURIComponent(batchId)}`;

  const payload = await fetchJson(url);
  if (!payload || payload.success !== true || !payload.batch) {
    throw new Error('Failed to load batch details.');
  }

  return payload.batch;
}

/**
 * Open the edit batch dialog for a given batch.
 *
 * @code INV-openEditBatch
 * @param {string} batchId
 * @returns {Promise<void>}
 */
export async function openEditBatchDialog(batchId) {
  const dialog = getDialog();
  const form = getForm();
  if (!dialog || !form) {
    return;
  }

  clearErrors();
  setSubmittingState(false);

  try {
    const batch = await loadBatch(batchId);
    populateDialog(batch);
    dialog.showModal();
  } catch (error) {
    toast.error('Failed to open editor', error instanceof Error ? error.message : 'Unable to load batch details.');
  }
}

/**
 * Handle edit dialog close state reset.
 *
 * @code INV-handleEditClose
 */
function handleDialogClose() {
  clearErrors();
  const form = getForm();
  if (form) {
    form.reset();
  }
  toggleQuantityLock(false);
  const title = document.querySelector('#edit-inventory-dialog-title');
  if (title instanceof HTMLElement) {
    title.textContent = 'Edit Batch';
  }
  const description = document.querySelector('#edit-inventory-dialog-description');
  if (description instanceof HTMLElement) {
    description.textContent = '';
  }
}

/**
 * Initialize the edit dialog handlers.
 *
 * @code INV-initEditDialog
 */
function initEditDialog() {
  const dialog = getDialog();
  const form = getForm();
  if (!dialog || !form || closeHandlerAttached) {
    return;
  }

  closeHandlerAttached = true;
  attachClearHandlers();

  const closeButtons = [
    document.querySelector('[data-edit-cancel-button]'),
    document.querySelector('[data-edit-close-button]'),
  ].filter((button) => button instanceof HTMLElement);

  closeButtons.forEach((button) => {
    button.addEventListener('click', () => dialog.close());
  });

  dialog.addEventListener('close', handleDialogClose);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();
    setSubmittingState(true);

    try {
      const { response, payload } = await fetchJsonResponse(form.action, {
        method: 'POST',
        body: new FormData(form),
        credentials: 'same-origin',
        headers: {
          'X-Requested-With': 'fetch',
        },
      });

      if (!response.ok || !payload || payload.success !== true) {
        if (payload && typeof payload === 'object' && payload.errors && typeof payload.errors === 'object') {
          Object.entries(payload.errors).forEach(([fieldName, message]) => {
            if (typeof message === 'string') {
              setFieldError(fieldName, message);
            }
          });
        }

        showError(payload && typeof payload.message === 'string' ? payload.message : 'Unable to update batch right now.');
        return;
      }

      toast.success('Batch updated', payload?.message || 'Inventory batch updated successfully.');
      dialog.close();
      window.inventoryRefresh?.();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Unable to update batch right now.');
    } finally {
      setSubmittingState(false);
    }
  });
}

initEditDialog();
