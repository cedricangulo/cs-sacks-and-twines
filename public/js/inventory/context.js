export function createInventoryState(dialog) {
  if (!(dialog instanceof HTMLDialogElement)) {
    return null;
  }

  const form = dialog.querySelector('[data-inventory-form]');
  const existingPanel = dialog.querySelector('[data-existing-item-panel]');
  const newItemPanel = dialog.querySelector('[data-new-item-panel]');
  const combobox = dialog.querySelector('[data-combobox]');
  const trigger = dialog.querySelector('[data-combobox-trigger]');
  const triggerLabel = dialog.querySelector('[data-combobox-trigger-label]');
  const popover = dialog.querySelector('[data-combobox-popover]');
  const search = dialog.querySelector('[data-combobox-search]');
  const listbox = dialog.querySelector('[data-combobox-listbox]');
  const options = Array.from(dialog.querySelectorAll('[data-combobox-option]'));
  const addNewButton = dialog.querySelector('[data-add-new-item]');
  const cancelNewButton = dialog.querySelector('[data-cancel-new-item]');
  const newItemAlert = dialog.querySelector('[data-new-item-alert]');
  const formError = dialog.querySelector('[data-form-error]');
  const modeField = dialog.querySelector('[data-inventory-mode]');
  const productIdField = dialog.querySelector('[data-product-id]');
  const itemNameInput = dialog.querySelector('[data-field-input="name"]');
  const saveButton = dialog.querySelector('[data-save-button]');
  const imageInput = dialog.querySelector('[data-field-input="image"]');
  const imageUploadContainer = dialog.querySelector('#image-upload-container');
  const imagePreviewContainer = dialog.querySelector('#image-preview-container');
  const imagePreviewImg = dialog.querySelector('#image-preview-img');
  const removeImageBtn = dialog.querySelector('#remove-image-btn');
  const imagePreviewMessage = dialog.querySelector('[data-image-preview-message]');
  const categoryInput = dialog.querySelector('[data-field-input="category"]');
  const unitInput = dialog.querySelector('[data-field-input="base_uom"]');
  const supplierInput = dialog.querySelector('[data-field-input="supplier_id"]');
  const quantityInput = dialog.querySelector('[data-field-input="quantity_received"]');
  const costInput = dialog.querySelector('[data-field-input="total_procurement_cost"]');
  const lowStockInput = dialog.querySelector('[data-field-input="low_stock_threshold"]');
  const weightInput = dialog.querySelector('[data-field-input="weight_per_unit"]');
  const skuInput = dialog.querySelector('[data-field-input="sku"]');
  const batchInput = dialog.querySelector('[data-field-input="batch"]');
  const editButtons = Array.from(dialog.querySelectorAll('[data-edit-field]'));

  if (
    !form ||
    !existingPanel ||
    !newItemPanel ||
    !combobox ||
    !trigger ||
    !triggerLabel ||
    !popover ||
    !search ||
    !listbox ||
    !addNewButton ||
    !cancelNewButton ||
    !newItemAlert ||
    !formError ||
    !modeField ||
    !productIdField ||
    !itemNameInput ||
    !saveButton ||
    !imageInput ||
    !imageUploadContainer ||
    !imagePreviewContainer ||
    !imagePreviewImg ||
    !removeImageBtn ||
    !imagePreviewMessage ||
    !categoryInput ||
    !unitInput ||
    !supplierInput ||
    !quantityInput ||
    !costInput ||
    !lowStockInput ||
    !skuInput ||
    !batchInput
  ) {
    return null;
  }

  return {
    dialog,
    form,
    existingPanel,
    newItemPanel,
    combobox,
    trigger,
    triggerLabel,
    popover,
    search,
    listbox,
    options,
    addNewButton,
    cancelNewButton,
    newItemAlert,
    formError,
    modeField,
    productIdField,
    itemNameInput,
    saveButton,
    imageInput,
    imageUploadContainer,
    imagePreviewContainer,
    imagePreviewImg,
    removeImageBtn,
    imagePreviewMessage,
    categoryInput,
    unitInput,
    supplierInput,
    quantityInput,
    costInput,
    lowStockInput,
    weightInput,
    skuInput,
    batchInput,
    editButtons,
    fieldInputs: {
      image: imageInput,
      category: categoryInput,
      base_uom: unitInput,
      weight_per_unit: weightInput,
      supplier_id: supplierInput,
      low_stock_threshold: lowStockInput,
    },
    fieldGroups: {
      image: dialog.querySelector('[data-field-group="image"]'),
      category: dialog.querySelector('[data-field-group="category"]'),
      base_uom: dialog.querySelector('[data-field-group="base_uom"]'),
      weight_per_unit: dialog.querySelector('[data-field-group="weight_per_unit"]'),
      supplier_id: dialog.querySelector('[data-field-group="supplier_id"]'),
      low_stock_threshold: dialog.querySelector('[data-field-group="low_stock_threshold"]'),
    },
    hiddenClass: 'hidden',
    saveButtonLabel: saveButton.textContent || 'Save stock',
    submitUrl: form.action,
  };
}
