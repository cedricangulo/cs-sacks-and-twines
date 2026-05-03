import { fetchJson, fetchJsonResponse } from '../utils/fetch-utils.js';
import { toast } from '../utils/toast.js';

const hiddenClass = 'hidden';
let closeHandlerAttached = false;

/**
 * Get the void batch dialog.
 *
 * @code INV-getVoidDialog
 * @returns {HTMLDialogElement | null}
 */
function getDialog() {
  return document.querySelector('[data-void-batch-dialog]');
}

/**
 * Get the void batch form.
 *
 * @code INV-getVoidForm
 * @returns {HTMLFormElement | null}
 */
function getForm() {
  return document.querySelector('[data-void-batch-form]');
}

/**
 * Toggle submitting state for void batch.
 *
 * @code INV-setVoidSubmitting
 * @param {boolean} isSubmitting
 */
function setSubmittingState(isSubmitting) {
  const button = document.querySelector('[data-void-confirm-button]');
  if (button instanceof HTMLButtonElement) {
    button.disabled = isSubmitting;
    button.textContent = isSubmitting ? 'Voiding...' : 'Void batch';
  }
}

/**
 * Clear void batch form error.
 *
 * @code INV-clearVoidError
 */
function clearError() {
  const form = getForm();
  const error = form?.querySelector('[data-void-form-error]');
  if (error instanceof HTMLElement) {
    error.textContent = '';
    error.classList.add(hiddenClass);
  }
}

/**
 * Show void batch form error.
 *
 * @code INV-showVoidError
 * @param {string} message
 */
function showError(message) {
  const error = getForm()?.querySelector('[data-void-form-error]');
  if (error instanceof HTMLElement) {
    error.textContent = message;
    error.classList.remove(hiddenClass);
  }
}

/**
 * Populate void batch dialog with batch data.
 *
 * @code INV-populateVoidDialog
 * @param {Record<string, unknown>} batch
 */
function populateDialog(batch) {
  const batchId = String(batch.batch_id ?? '');
  const batchCode = String(batch.batch_code ?? '');
  const productName = String(batch.product_name ?? '');
  const quantityRemaining = Number(batch.quantity_remaining ?? 0);
  const totalCost = Number(batch.total_procurement_cost ?? 0);

  const batchIdField = getForm()?.querySelector('[data-void-batch-id]');
  if (batchIdField instanceof HTMLInputElement) {
    batchIdField.value = batchId;
  }

  const batchName = document.querySelector('[data-void-batch-name]');
  const batchMeta = document.querySelector('[data-void-batch-meta]');
  const batchCodeLabel = document.querySelector('[data-void-batch-code]');
  const productNameLabel = document.querySelector('[data-void-product-name]');
  const qtyLabel = document.querySelector('[data-void-quantity-remaining]');
  const costLabel = document.querySelector('[data-void-procurement-cost]');
  const deltaLabel = document.querySelector('[data-void-product-delta]');
  const assetLabel = document.querySelector('[data-void-asset-delta]');

  if (batchName instanceof HTMLElement) {
    batchName.textContent = `${productName || 'Batch'} — ${batchCode || batchId}`;
  }
  if (batchMeta instanceof HTMLElement) {
    batchMeta.textContent = 'Voiding will preserve the row, mark it as voided, and reverse its financial impact.';
  }
  if (batchCodeLabel instanceof HTMLElement) {
    batchCodeLabel.textContent = batchCode || batchId;
  }
  if (productNameLabel instanceof HTMLElement) {
    productNameLabel.textContent = productName || '-';
  }
  if (qtyLabel instanceof HTMLElement) {
    qtyLabel.textContent = quantityRemaining.toFixed(2);
  }
  if (costLabel instanceof HTMLElement) {
    costLabel.textContent = `₱${totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  }
  if (deltaLabel instanceof HTMLElement) {
    deltaLabel.textContent = `-${quantityRemaining.toFixed(2)}`;
  }
  if (assetLabel instanceof HTMLElement) {
    assetLabel.textContent = `-₱${totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  }
}

/**
 * Load batch details for void dialog.
 *
 * @code INV-loadVoidBatch
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
 * Open the void batch dialog for a given batch.
 *
 * @code INV-openVoidBatch
 * @param {string} batchId
 * @returns {Promise<void>}
 */
export async function openVoidBatchDialog(batchId) {
  const dialog = getDialog();
  const form = getForm();
  if (!dialog || !form) {
    return;
  }

  clearError();
  setSubmittingState(false);

  try {
    const batch = await loadBatch(batchId);
    populateDialog(batch);
    dialog.showModal();
  } catch (error) {
    toast.error('Failed to open void dialog', error instanceof Error ? error.message : 'Unable to load batch details.');
  }
}

/**
 * Handle void dialog close reset.
 *
 * @code INV-handleVoidClose
 */
function handleDialogClose() {
  clearError();
  const form = getForm();
  if (form) {
    form.reset();
  }

  const batchName = document.querySelector('[data-void-batch-name]');
  const batchMeta = document.querySelector('[data-void-batch-meta]');
  const batchCode = document.querySelector('[data-void-batch-code]');
  const productName = document.querySelector('[data-void-product-name]');
  const qty = document.querySelector('[data-void-quantity-remaining]');
  const cost = document.querySelector('[data-void-procurement-cost]');
  const delta = document.querySelector('[data-void-product-delta]');
  const asset = document.querySelector('[data-void-asset-delta]');

  if (batchName instanceof HTMLElement) batchName.textContent = 'Batch details';
  if (batchMeta instanceof HTMLElement) batchMeta.textContent = 'Selected batch will be voided.';
  if (batchCode instanceof HTMLElement) batchCode.textContent = '-';
  if (productName instanceof HTMLElement) productName.textContent = '-';
  if (qty instanceof HTMLElement) qty.textContent = '-';
  if (cost instanceof HTMLElement) cost.textContent = '-';
  if (delta instanceof HTMLElement) delta.textContent = '0';
  if (asset instanceof HTMLElement) asset.textContent = '0.00';
}

/**
 * Initialize void dialog handlers.
 *
 * @code INV-initVoidDialog
 */
function initVoidDialog() {
  const dialog = getDialog();
  const form = getForm();
  if (!dialog || !form || closeHandlerAttached) {
    return;
  }

  closeHandlerAttached = true;

  const closeButtons = [
    document.querySelector('[data-void-cancel-button]'),
    document.querySelector('[data-void-close-button]'),
  ].filter((button) => button instanceof HTMLElement);

  closeButtons.forEach((button) => {
    button.addEventListener('click', () => dialog.close());
  });

  dialog.addEventListener('close', handleDialogClose);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError();
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
        if (payload && typeof payload.message === 'string') {
          showError(payload.message);
        } else {
          showError('Unable to void batch right now.');
        }
        return;
      }

      toast.success('Batch voided', payload?.message || 'The batch was voided successfully.');
      dialog.close();
      window.inventoryRefresh?.();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Unable to void batch right now.');
    } finally {
      setSubmittingState(false);
    }
  });
}

initVoidDialog();
