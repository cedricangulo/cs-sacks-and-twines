import { createClientTable } from '../utils/data-table.js';
import { getSuppliers } from './get-suppliers.js';
import { renderSupplierRows } from './render.js';
import { initSuppliersForm } from './submit.js';

let table;

/**
 * Initialize the suppliers table.
 *
 * @code SUP-initTable
 */
export function initSuppliersTable() {
  table = createClientTable({
    container: '#suppliers-container',
    fetchFn: getSuppliers,
    renderFn: renderSupplierRows,
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
    id: 'suppliers',
  });

  table.init();
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