import { createInventoryState } from './context.js';
import { initInventoryCombobox } from './combobox.js';
import { initInventoryModes } from './modes.js';
import { initInventorySubmission } from './submit.js';
import { resetForm } from './state.js';
import { loadProducts } from './get-products.js';

function initInventoryPage() {
  const dialog = document.querySelector('[data-inventory-dialog]');
  const state = createInventoryState(dialog);

  if (!state) {
    return;
  }

  initInventoryCombobox(state);
  initInventoryModes(state);
  initInventorySubmission(state, {
    onSuccess: () => loadProducts({ force: true }),
  });

  state.dialog.addEventListener('close', () => {
    resetForm(state);
  });

  loadProducts();
  resetForm(state);
}

initInventoryPage();
