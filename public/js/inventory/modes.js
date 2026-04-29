import {
  lockExistingItemFields,
  resetForm,
  switchToNewItem,
} from './state.js';

export function initInventoryModes(state) {
  state.addNewButton.addEventListener('click', () => switchToNewItem(state));
  state.cancelNewButton.addEventListener('click', () => resetForm(state));

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