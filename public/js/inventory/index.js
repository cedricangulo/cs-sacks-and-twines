import { createInventoryState } from './context.js';
import { initInventoryCombobox } from './combobox.js';
import { initInventoryModes } from './modes.js';
import { initInventorySubmission } from './submit.js';
import { resetForm, initImageHandlers, fillExistingItem } from './state.js';
import { loadProducts, refreshComboboxOptions } from './get-products.js';

async function onInventorySaveSuccess() {
  await loadProducts({ force: true });
  const newOptions = await refreshComboboxOptions({
    fillExistingItem: (option) => fillExistingItem(window.inventoryState, option),
  });
  if (newOptions.length > 0) {
    window.inventoryState.options = newOptions;
  }
}

function initInventoryPage() {
  const dialog = document.querySelector('[data-inventory-dialog]');
  const state = createInventoryState(dialog);

  if (!state) {
    return;
  }

  window.inventoryState = state;

  initInventoryCombobox(state);
  initInventoryModes(state);
  initImageHandlers(state);
  initInventorySubmission(state, {
    onSuccess: onInventorySaveSuccess,
  });

  state.dialog.addEventListener('close', () => {
    resetForm(state);
  });

  loadProducts();
  resetForm(state);
}

initInventoryPage();
