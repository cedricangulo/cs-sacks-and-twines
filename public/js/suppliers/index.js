import { loadSuppliers } from './get-suppliers.js';
import { initSuppliersForm } from './submit.js';

function initSuppliersPage() {
  const tableBody = document.getElementById('suppliers-container');
  if (!tableBody) {
    return;
  }

  loadSuppliers();
  initSuppliersForm({
    onSuccess: () => loadSuppliers({ force: true }),
  });
}

initSuppliersPage();
