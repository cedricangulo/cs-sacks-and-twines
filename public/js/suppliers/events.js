import { createClientTable } from '../utils/data-table.js';
import { getSuppliers } from './get-suppliers.js';
import { renderSupplierRows } from './render.js';
import { initSuppliersForm } from './submit.js';
import { fetchJson } from '../utils/fetch-utils.js';
import { toast } from '../utils/toast.js';

let table;
let boundContainer = null;

/**
 * Initialize the suppliers table.
 *
 * @code SUP-initTable
 */
export function initSuppliersTable() {
  const container = document.getElementById('suppliers-container');
  if (!container) return;

  const editUrl = container.getAttribute('data-edit-url') || '';
  const deleteUrl = container.getAttribute('data-delete-url') || '';
  const urls = { edit: editUrl, delete: deleteUrl };

  table = createClientTable({
    container: '#suppliers-container',
    fetchFn: getSuppliers,
    renderFn: (data) => renderSupplierRows(data, urls),
    sortableColumns: [
      { key: 'company_name', column: 'company_name' },
      { key: 'contact_person', column: 'contact_person' },
      { key: 'contact_number', column: 'contact_number' },
      { key: 'address', column: 'address' },
      { key: 'created_at', column: 'created_at' },
    ],
    filterBar: {
      id: 'suppliers',
      searchPlaceholder: 'Search suppliers...',
    },
    afterRender: () => {
      initSupplierActions(container);
    },
    id: 'suppliers',
  });

  table.init();
}

/**
 * Initialize supplier action menus.
 *
 * @code SUP-initActions
 * @param {HTMLElement} container
 */
function initSupplierActions(container) {
  if (boundContainer === container) return;
  boundContainer = container;

  container.addEventListener('click', async (event) => {
    const toggleBtn = event.target.closest('[data-supplier-actions]');
    if (toggleBtn) {
      event.stopPropagation();
      const supplierId = toggleBtn.getAttribute('data-supplier-actions');
      const menu = container.querySelector(`[data-supplier-menu="${supplierId}"]`);
      if (!menu) return;

      const isOpen = !menu.classList.contains('hidden');
      closeSupplierMenus(container);

      if (!isOpen) {
        const rect = toggleBtn.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.left = `${rect.right - 144}px`;
        menu.classList.remove('hidden');
        toggleBtn.setAttribute('aria-expanded', 'true');
      }
      return;
    }

    const actionBtn = event.target.closest('[data-supplier-action]');
    if (actionBtn) {
      event.stopPropagation();
      const action = actionBtn.getAttribute('data-supplier-action');
      const supplierId = actionBtn.getAttribute('data-supplier-id');
      closeSupplierMenus(container);

      if (action === 'edit') {
        openEditSupplierDialog(supplierId);
      } else if (action === 'delete') {
        handleDeleteSupplier(supplierId);
      }
      return;
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-supplier-actions]') && !event.target.closest('[data-supplier-menu]')) {
      closeSupplierMenus(container);
    }
  });
}

/**
 * Close all supplier action menus.
 *
 * @code SUP-closeMenus
 * @param {HTMLElement} container
 */
function closeSupplierMenus(container) {
  container.querySelectorAll('[data-supplier-menu]').forEach((menu) => {
    menu.classList.add('hidden');
  });
  container.querySelectorAll('[data-supplier-actions]').forEach((button) => {
    button.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Open edit supplier dialog.
 *
 * @code SUP-openEdit
 * @param {string} supplierId
 * @returns {Promise<void>}
 */
async function openEditSupplierDialog(supplierId) {
  const container = document.getElementById('suppliers-container');
  const editUrl = container?.getAttribute('data-edit-url') || '/api/suppliers/show?id=';

  try {
    const payload = await fetchJson(`${editUrl}${supplierId}`);

    if (!payload.success) {
      toast.error(payload.message || 'Failed to load supplier.');
      return;
    }

    const supplier = payload.data;
    const dialog = document.getElementById('add-supplier-dialog');
    if (!dialog) return;

    dialog.querySelector('h2').textContent = 'Edit Supplier';
    dialog.querySelector('p').textContent = 'Update the supplier details below.';

    const form = document.getElementById('suppliers-form');
    form?.reset();

    const idInput = document.getElementById('supplier-id');
    if (idInput) {
      idInput.value = supplier.supplier_id;
    }

    const companyNameInput = document.getElementById('company_name');
    if (companyNameInput) {
      companyNameInput.value = supplier.company_name;
    }

    const contactPersonInput = document.getElementById('contact_person');
    if (contactPersonInput) {
      contactPersonInput.value = supplier.contact_person;
    }

    const contactNumberInput = document.getElementById('contact_number');
    if (contactNumberInput) {
      contactNumberInput.value = supplier.contact_number;
    }

    const addressInput = document.getElementById('address');
    if (addressInput) {
      addressInput.value = supplier.address;
    }

    const saveBtn = document.querySelector('[data-save-button]');
    if (saveBtn) {
      saveBtn.textContent = 'Update supplier';
    }

    const input = form?.querySelector('[name="company_name"]');
    if (input) {
      input.setAttribute('data-original-value', supplier.company_name);
    }

    const deleteUrl = container?.getAttribute('data-delete-url') || '/api/suppliers/delete';
    form.action = deleteUrl.replace('delete', 'update');

    dialog.showModal();
  } catch (error) {
    console.error('Failed to load supplier:', error);
    toast.error('Unable to load supplier. Please try again.');
  }
}

/**
 * Handle delete supplier action.
 *
 * @code SUP-handleDelete
 * @param {string} supplierId
 * @returns {Promise<void>}
 */
async function handleDeleteSupplier(supplierId) {
  const container = document.getElementById('suppliers-container');
  const editUrl = container?.getAttribute('data-edit-url') || '/api/suppliers/show?id=';
  const deleteUrl = container?.getAttribute('data-delete-url') || '/api/suppliers/delete';

  try {
    const payload = await fetchJson(`${editUrl}${supplierId}`);
    if (!payload.success) {
      toast.error(payload.message || 'Failed to load supplier.');
      return;
    }

    const supplier = payload.data;
    const batchCount = payload.batch_count || 0;
    const relatedBatches = payload.related_batches || [];

    const dialog = document.getElementById('delete-supplier-dialog');
    if (!dialog) return;

    const nameElement = dialog.querySelector('[data-delete-supplier-name]');
    if (nameElement) {
      nameElement.textContent = supplier.company_name;
    }

    const errorElement = dialog.querySelector('[data-delete-supplier-error]');
    const confirmBtn = dialog.querySelector('[data-delete-supplier-confirm]');
    const cancelBtn = dialog.querySelector('[data-delete-supplier-cancel]');

    // Always reset error state first
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.add('hidden');
    }

    const contentElement = dialog.querySelector('[data-delete-supplier-content]');
    if (contentElement) {
      contentElement.classList.remove('hidden');
    }

    // Reset button states
    if (confirmBtn) {
      confirmBtn.disabled = false;
    }
    if (cancelBtn) {
      cancelBtn.disabled = false;
    }

    // Setup cleanup function
    const cleanup = () => {
      dialog.close();
      confirmBtn?.replaceWith(confirmBtn.cloneNode(true));
      cancelBtn?.replaceWith(cancelBtn.cloneNode(true));
    };

    // Show inline error if has batches (open dialog with error, disable delete button)
    if (batchCount > 0) {
      const message = `Cannot delete supplier. They still have ${batchCount} batch(es):\n\n` +
        relatedBatches.map((d) => `${d.batch} - ${d.product} (${d.qty} units)`).join('\n');
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
      }
      if (contentElement) {
        contentElement.classList.add('hidden');
      }
      if (confirmBtn) {
        confirmBtn.disabled = true;
      }
      dialog.showModal();
      return;
    }

    // No batches - continue with normal confirmation flow
    const handleConfirm = async () => {
      try {
        const formData = new FormData();
        formData.append('id', supplierId);

        const response = await fetch(deleteUrl, {
          method: 'POST',
          body: formData,
          credentials: 'same-origin',
        });

        const result = await response.json();

        if (!result.success) {
          if (result.details && result.details.length > 0) {
            let message = result.error || 'Cannot delete supplier.';
            message += '\n\n' + result.details.map((d) => `${d.batch} - ${d.product} (${d.qty} units)`).join('\n');
            if (errorElement) {
              errorElement.textContent = message;
              errorElement.classList.remove('hidden');
            }
            return;
          }

          if (errorElement) {
            errorElement.textContent = result.message || result.error || 'Cannot delete supplier.';
            errorElement.classList.remove('hidden');
          }
          return;
        }

        toast.success(result.message || 'Supplier deleted successfully.');
        cleanup();
        refreshSuppliers();
      } catch (err) {
        console.error('Failed to delete supplier:', err);
        toast.error('Unable to delete supplier. Please try again.');
      }
    };

    confirmBtn?.addEventListener('click', handleConfirm, { once: true });
    cancelBtn?.addEventListener('click', cleanup, { once: true });

    dialog.showModal();
  } catch (error) {
    console.error('Failed to load supplier:', error);
    toast.error('Unable to load supplier. Please try again.');
  }
}

/**
 * Refresh the suppliers table.
 *
 * @code SUP-refresh
 */
export function refreshSuppliers() {
  if (table) {
    table.load();
  }
}

/**
 * Initialize the suppliers page.
 *
 * @code SUP-initPage
 */
export function initSuppliersPage() {
  const tableBody = document.getElementById('suppliers-container');
  if (!tableBody) {
    return;
  }

  initSuppliersTable();
  initSuppliersForm({
    onSuccess: () => refreshSuppliers(),
  });
}