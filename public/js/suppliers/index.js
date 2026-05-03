import { initSuppliersTable, refreshSuppliers } from './get-suppliers.js';
import { initSuppliersForm } from './submit.js';

function initSuppliersPage() {
  const tableBody = document.getElementById('suppliers-container');
  if (!tableBody) {
    return;
  }

  initSuppliersTable();
  initSuppliersForm({
    onSuccess: () => refreshSuppliers(),
  });
}

initSuppliersPage();
