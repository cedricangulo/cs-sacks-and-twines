import {
  closeCombobox,
  fillExistingItem,
  findFirstVisibleOption,
  filterOptions,
  openCombobox,
} from './state.js';

/**
 * Initialize the inventory combobox event handlers.
 *
 * @code INV-initCombobox
 * @param {ReturnType<import('./context.js').createInventoryState>} state
 */
export function initInventoryCombobox(state) {
  const ownerDocument = state.dialog.ownerDocument || document;

  state.trigger.addEventListener('click', () => openCombobox(state));
  state.trigger.addEventListener('focus', () => openCombobox(state));

  state.search.addEventListener('input', () => {
    filterOptions(state, state.search.value);
  });

  state.search.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const visibleOption = findFirstVisibleOption(state);

      if (visibleOption) {
        fillExistingItem(state, visibleOption);
      }
    }

    if (event.key === 'Escape') {
      closeCombobox(state);
    }
  });

  state.options.forEach((option) => {
    option.addEventListener('click', () => fillExistingItem(state, option));
    option.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        fillExistingItem(state, option);
      }
    });
  });

  ownerDocument.addEventListener('click', (event) => {
    if (!state.dialog.open) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    if (!state.combobox.contains(target)) {
      closeCombobox(state);
    }
  });
}
