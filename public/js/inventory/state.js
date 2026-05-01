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
    'weight_per_unit',
    'supplier_id',
    'quantity_received',
    'total_procurement_cost',
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
  setLockedState(state, 'weight_per_unit', true);
  setLockedState(state, 'supplier_id', true);
}

function unlockAllItemFields(state) {
  setLockedState(state, 'image', false);
  setLockedState(state, 'category', false);
  setLockedState(state, 'base_uom', false);
  setLockedState(state, 'weight_per_unit', false);
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
    const hasOptions = state.options.length > 0;
    emptyState.classList.toggle(state.hiddenClass, hasOptions && visibleCount > 0);
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
  showImageUpload(state);
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
  const weightPerUnit = option.dataset.weight || '';
  const imagePath = option.dataset.image || '';
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
  state.weightInput.value = weightPerUnit;
  state.supplierInput.value = supplierId;
  state.imageInput.value = '';

  if (imagePath) {
    showImagePreview(state, `/cs-sacks-and-twines/public/uploads/products/${imagePath}`);
  } else {
    showImageUpload(state);
  }

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

  const values = {
    mode: state.modeField.value,
    product_id: state.productIdField.value,
    name: state.itemNameInput.value,
    category: state.categoryInput.value,
    base_uom: state.unitInput.value,
    weight_per_unit: state.weightInput.value,
    supplier_id: state.supplierInput.value,
    quantity_received: state.quantityInput.value,
    total_procurement_cost: state.costInput.value,
  };

  return { values };
}

function showImagePreview(state, imageSrc) {
  state.imageUploadContainer.classList.add(state.hiddenClass);
  state.imagePreviewContainer.classList.remove(state.hiddenClass);
  state.imagePreviewImg.src = imageSrc;
}

function showImageUpload(state) {
  state.imageUploadContainer.classList.remove(state.hiddenClass);
  state.imagePreviewContainer.classList.add(state.hiddenClass);
  state.imagePreviewImg.src = '';
}

function clearImagePreview(state) {
  state.imageInput.value = '';
  showImageUpload(state);
}

function validateImageFile(file) {
  const maxSize = 5 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/png'];

  if (!allowedTypes.includes(file.type)) {
    return 'Please select a valid image file (JPG or PNG).';
  }

  if (file.size > maxSize) {
    return 'File size must be less than 5MB.';
  }

  return null;
}

function handleImageFileSelect(state, file) {
  clearFieldError(state, 'image');

  const error = validateImageFile(file);
  if (error) {
    setFieldError(state, 'image', error);
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    showImagePreview(state, e.target.result);
  };
  reader.readAsDataURL(file);
}

function initImageHandlers(state) {
  state.imageInput.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageFileSelect(state, file);
    }
  });

  state.removeImageBtn.addEventListener('click', () => {
    clearImagePreview(state);
    clearFieldError(state, 'image');
  });
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
  initImageHandlers,
  showImagePreview,
  showImageUpload,
  clearImagePreview,
}
