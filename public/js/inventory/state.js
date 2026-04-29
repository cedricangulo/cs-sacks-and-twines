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

function setFieldError(state, fieldName, message) {
  const field = state.form.querySelector(`[data-field="${fieldName}"]`);
  const input = state.form.querySelector(`[data-field-input="${fieldName}"]`);
  const error = state.form.querySelector(`[data-field-error="${fieldName}"]`);

  if (!field || !input || !error) {
    return;
  }

  field.setAttribute('data-invalid', 'true');
  input.setAttribute('aria-invalid', 'true');
  error.textContent = message;
  error.classList.remove(state.hiddenClass);
}

function clearFieldError(state, fieldName) {
  const field = state.form.querySelector(`[data-field="${fieldName}"]`);
  const input = state.form.querySelector(`[data-field-input="${fieldName}"]`);
  const error = state.form.querySelector(`[data-field-error="${fieldName}"]`);

  if (!field || !input || !error) {
    return;
  }

  field.removeAttribute('data-invalid');
  input.removeAttribute('aria-invalid');
  error.textContent = '';
  error.classList.add(state.hiddenClass);
}

function clearFieldErrors(state) {
  [
    'product_id',
    'name',
    'category',
    'base_uom',
    'supplier_id',
    'quantity_received',
    'unit_cost',
  ].forEach((fieldName) => {
    clearFieldError(state, fieldName);
  });
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
  setLockedState(state, 'base_uom', true);
  setLockedState(state, 'supplier_id', true);
}

function unlockAllItemFields(state) {
  setLockedState(state, 'image', false);
  setLockedState(state, 'category', false);
  setLockedState(state, 'base_uom', false);
  setLockedState(state, 'supplier_id', false);
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
  clearFieldErrors(state);
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
  clearFieldError(state, 'product_id');
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
  clearFieldErrors(state);
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
  clearFieldErrors(state);

  const errors = {};

  if (state.modeField.value === 'existing' && state.productIdField.value.trim() === '') {
    errors.product_id = 'Please choose an existing item before saving stock.';
  }

  if (state.modeField.value === 'new' && state.itemNameInput.value.trim() === '') {
    errors.name = 'Enter an item name for the new product.';
  }

  if (!state.form.checkValidity()) {
    state.form.reportValidity();
    if (!state.quantityInput.checkValidity()) {
      errors.quantity_received = 'Quantity must be greater than zero.';
    }
    if (!state.costInput.checkValidity()) {
      errors.unit_cost = 'Total procurement cost must be greater than zero.';
    }
    if (state.modeField.value === 'new') {
      if (!state.categoryInput.value) {
        errors.category = 'Select a valid category for the new product.';
      }
      if (!state.unitInput.value) {
        errors.base_uom = 'Select a valid unit of measurement for the new product.';
      }
      if (!state.supplierInput.value) {
        errors.supplier_id = 'Select a supplier for the new item.';
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([fieldName, message]) => {
      setFieldError(state, fieldName, message);
    });
    const firstField = state.form.querySelector('[data-invalid] [data-field-input]');
    if (firstField instanceof HTMLElement) {
      firstField.focus();
    }
    if (errors.product_id) {
      openCombobox(state);
    }
    return false;
  }

  return true;
}

export {
  clearDialogError,
  setFieldError,
  clearFieldError,
  clearFieldErrors,
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
