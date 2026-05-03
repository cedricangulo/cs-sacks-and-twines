import { formatDate } from '../utils/date-utils.js';
import { fetchJson } from '../utils/fetch-utils.js';
import { escapeHtml, renderEmptyState } from '../utils/dom-utils.js';
import { createClientTable, renderFilterBar } from '../utils/data-table.js';

async function getSuppliers() {
  const container = document.getElementById('suppliers-container');
  const apiUrl = container?.getAttribute('data-api-url') || '/api/suppliers';

  const payload = await fetchJson(apiUrl);

  if (!Array.isArray(payload)) {
    throw new Error('Suppliers API returned an unexpected response.');
  }

  return payload;
}

function renderSupplierRows(suppliers) {
  suppliers.length === 0 ? renderEmptyState({ type: 'suppliers' }) : null;

  return suppliers.map((supplier) => `
    <tr>
      <td class="font-medium">${escapeHtml(supplier.company_name ?? '')}</td>
      <td>${escapeHtml(supplier.contact_person ?? '')}</td>
      <td class="font-mono">${escapeHtml(supplier.contact_number ?? '')}</td>
      <td>${escapeHtml(supplier.address ?? '')}</td>
      <td>${escapeHtml(formatDate(supplier.created_at ?? ''))}</td>
    </tr>
  `).join('');
}

let table;

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

export function refreshSuppliers() {
  if (table) {
    table.load();
  }
}
