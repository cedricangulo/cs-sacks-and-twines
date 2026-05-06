import { createInventoryState } from './context.js';
import { initInventoryCombobox } from './combobox.js';
import { initInventoryModes } from './modes.js';
import { initInventorySubmission } from './submit.js';
import { resetForm, initImageHandlers, fillExistingItem } from './state.js';
import { refreshComboboxOptions } from './render.js';
import { loadProducts } from './get-products.js';
import './edit-inventory.js';
import './void-batch.js';
import { initProductsTable } from './events.js';

let inventoryTable;

/**
 * Refresh inventory table after a save.
 *
 * @code INV-onSaveSuccess
 * @returns {Promise<void>}
 */
async function onInventorySaveSuccess() {
  if (inventoryTable) {
    inventoryTable.refresh();
  }
  const newOptions = await refreshComboboxOptions({
    fillExistingItem: (option) => fillExistingItem(window.inventoryState, option),
  });
  if (newOptions.length > 0) {
    window.inventoryState.options = newOptions;
  }
}

/**
 * Initialize the inventory page.
 *
 * @code INV-initPage
 */
function initInventoryPage() {
  const dialog = document.querySelector('[data-inventory-dialog]');
  const state = createInventoryState(dialog);

  if (!state) {
    return;
  }

  window.inventoryState = state;
  window.inventoryRefresh = () => inventoryTable?.refresh();

  initInventoryCombobox(state);
  initInventoryModes(state);
  initImageHandlers(state);
  initInventorySubmission(state, {
    onSuccess: onInventorySaveSuccess,
  });

  state.dialog.addEventListener('close', () => {
    resetForm(state);
  });

  inventoryTable = initProductsTable();
  resetForm(state);
}

initInventoryPage();
