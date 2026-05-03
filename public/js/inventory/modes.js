import {
  lockExistingItemFields,
  resetForm,
  switchToNewItem,
  syncCategoryDefaults,
  setLockedState,
} from './state.js';

/**
 * Initialize inventory mode switching and edit field handlers.
 *
 * @code INV-initModes
 * @param {ReturnType<import('./context.js').createInventoryState>} state
 */
export function initInventoryModes(state) {
  state.addNewButton.addEventListener('click', () => switchToNewItem(state));
  state.cancelNewButton.addEventListener('click', () => resetForm(state));

  state.categoryInput.addEventListener('change', () => {
    syncCategoryDefaults(state);
    setLockedState(state, 'weight_per_unit', true);
  });

  state.editButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const fieldName = button.dataset.editField;

      if (!fieldName || !(fieldName in state.fieldInputs)) {
        return;
      }

      const input = state.fieldInputs[fieldName];

      if (input) {
        input.disabled = false;
        input.focus();
      }

      button.classList.add(state.hiddenClass);
      state.fieldGroups[fieldName]?.setAttribute('data-locked', 'false');
    });
  });

  lockExistingItemFields(state);
}
