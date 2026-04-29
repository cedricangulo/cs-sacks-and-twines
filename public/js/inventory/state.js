function generateDraftCode(prefix) {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const randomPart = String(Math.floor(Math.random() * 9000) + 1000);

  return `${prefix}-${datePart}-${randomPart}`;
}

function populateDraftCodes(state) {
  state.skuInput.value = generateDraftCode('SKU');
  state.batchInput.value = generateDraftCode('BAT');
}

function clearDialogError(state) {
  state.formError.textContent = '';
  state.formError.classList.add(state.hiddenClass);
}

function showDialogError(state, message) {
  state.formError.textContent = message;
  state.formError.classList.remove(state.hiddenClass);
}

function updatePreviewMessage(state, message) {
  state.imagePreviewMessage.textContent = message;
}

function setSubmittingState(state, isSubmitting) {
  state.saveButton.disabled = isSubmitting;
  state.saveButton.textContent = isSubmitting ? 'Saving...' : state.saveButtonLabel;
  state.addNewButton.disabled = isSubmitting;
  state.cancelNewButton.disabled = isSubmitting;
}

function setLockedState(state, name, locked) {
  const input = state.fieldInputs[name];
  const group = state.fieldGroups[name];
  const editButton = state.dialog.querySelector(`[data-edit-field="${name}"]`);

  if (!input || !group || !editButton) {
    return;
  }

  input.disabled = locked;
  editButton.classList.toggle(state.hiddenClass, !locked);
  group.dataset.locked = locked ? 'true' : 'false';
}

function lockExistingItemFields(state) {
  setLockedState(state, 'image', true);
  setLockedState(state, 'category', true);
  setLockedState(state, 'unit', true);
  setLockedState(state, 'supplier', true);
}

function unlockAllItemFields(state) {
  setLockedState(state, 'image', false);
  setLockedState(state, 'category', false);
  setLockedState(state, 'unit', false);
  setLockedState(state, 'supplier', false);
}

function showExistingMode(state) {
  state.modeField.value = 'existing';
  state.existingPanel.hidden = false;
  state.newItemPanel.hidden = true;
  state.itemNameInput.disabled = true;
  state.itemNameInput.required = false;
}

function showNewMode(state) {
  state.modeField.value = 'new';
  state.existingPanel.hidden = true;
  state.newItemPanel.hidden = false;
  state.itemNameInput.disabled = false;
  state.itemNameInput.required = true;
}

function closeCombobox(state) {
  state.popover.classList.add(state.hiddenClass);
  state.trigger.setAttribute('aria-expanded', 'false');
  state.search.value = '';
  filterOptions(state, '');
}

function openCombobox(state) {
  if (state.existingPanel.hidden) {
    return;
  }

  state.popover.classList.remove(state.hiddenClass);
  state.trigger.setAttribute('aria-expanded', 'true');
  window.requestAnimationFrame(() => {
    state.search.focus();
    state.search.select();
  });
}

function filterOptions(state, query) {
  const normalized = query.trim().toLowerCase();
  let visibleCount = 0;

  state.options.forEach((option) => {
    const filterText = (option.dataset.filter || option.textContent || '').toLowerCase();
    const isVisible = normalized === '' || filterText.includes(normalized);
    option.classList.toggle(state.hiddenClass, !isVisible);

    if (isVisible) {
      visibleCount += 1;
    }
  });

  const emptyState = state.dialog.querySelector('[data-combobox-empty]');
  if (emptyState instanceof HTMLElement) {
    emptyState.classList.toggle(state.hiddenClass, visibleCount !== 0);
  }
}

function resetForm(state) {
  state.form.reset();
  clearDialogError(state);
  state.productIdField.value = '';
  state.triggerLabel.textContent = 'Select an item or add a new one';
  state.newItemAlert.classList.add(state.hiddenClass);
  state.cancelNewButton.classList.add(state.hiddenClass);
  showExistingMode(state);
  lockExistingItemFields(state);
  populateDraftCodes(state);
  state.imagePreview.textContent = 'Preview';
  updatePreviewMessage(state, 'Locked until you choose or create an item.');
  state.itemNameInput.value = '';
  state.itemNameInput.disabled = true;
  state.itemNameInput.required = false;
  setSubmittingState(state, false);
  closeCombobox(state);
}

function fillExistingItem(state, option) {
  const label = option.dataset.label || option.textContent?.trim() || '';
  const productId = option.dataset.value || '';
  const sku = option.dataset.sku || generateDraftCode('SKU');
  const category = option.dataset.category || '';
  const unit = option.dataset.unit || '';
  const supplierId = option.dataset.supplierId || '';

  clearDialogError(state);
  state.productIdField.value = productId;
  state.triggerLabel.textContent = label;
  state.itemNameInput.value = label;
  showExistingMode(state);
  state.skuInput.value = sku;
  state.batchInput.value = generateDraftCode('BAT');
  state.categoryInput.value = category;
  state.unitInput.value = unit;
  state.supplierInput.value = supplierId;
  state.imagePreview.textContent = label.slice(0, 2).toUpperCase();
  updatePreviewMessage(state, 'Existing item selected. Locked fields can be edited one at a time.');
  lockExistingItemFields(state);
  state.newItemAlert.classList.add(state.hiddenClass);
  state.cancelNewButton.classList.add(state.hiddenClass);
  closeCombobox(state);
  state.quantityInput.focus();
}

function switchToNewItem(state) {
  clearDialogError(state);
  state.productIdField.value = '';
  showNewMode(state);
  state.triggerLabel.textContent = 'New item';
  state.newItemAlert.classList.remove(state.hiddenClass);
  state.cancelNewButton.classList.remove(state.hiddenClass);
  unlockAllItemFields(state);
  populateDraftCodes(state);
  state.categoryInput.value = '';
  state.unitInput.value = '';
  state.supplierInput.value = '';
  state.imageInput.value = '';
  state.imagePreview.textContent = 'Preview';
  updatePreviewMessage(state, 'New item mode enabled. Enter the item name and details below.');
  state.itemNameInput.value = '';
  closeCombobox(state);
  state.itemNameInput.focus();
}

function findFirstVisibleOption(state) {
  return state.options.find((option) => !option.classList.contains(state.hiddenClass));
}

function validateBeforeSubmit(state) {
  clearDialogError(state);

  if (state.modeField.value === 'existing' && state.productIdField.value.trim() === '') {
    showDialogError(state, 'Please choose an existing item before saving stock.');
    openCombobox(state);
    state.trigger.focus();
    return false;
  }

  if (state.modeField.value === 'new' && state.itemNameInput.value.trim() === '') {
    state.itemNameInput.reportValidity();
    return false;
  }

  if (!state.form.checkValidity()) {
    state.form.reportValidity();
    return false;
  }

  return true;
}

export {
  clearDialogError,
  showDialogError,
  updatePreviewMessage,
  setSubmittingState,
  setLockedState,
  lockExistingItemFields,
  unlockAllItemFields,
  showExistingMode,
  showNewMode,
  openCombobox,
  closeCombobox,
  filterOptions,
  resetForm,
  fillExistingItem,
  switchToNewItem,
  findFirstVisibleOption,
  validateBeforeSubmit,
}