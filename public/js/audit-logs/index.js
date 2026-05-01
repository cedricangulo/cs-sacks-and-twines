import { getAuditLogs, getPersonalAuditLogs, buildSignature } from './get-logs.js';
import { renderLogsTable, renderPagination } from './render.js';

let lastSignature = '';

async function loadLogs(page = 1) {
  const container = document.getElementById('audit-logs-container');
  const paginationContainer = document.getElementById('pagination-container');

  if (!container) {
    console.error('Audit logs container not found');
    return;
  }

  const isPersonal = container.getAttribute('data-api-url')?.includes('personal');
  const fetchFn = isPersonal ? getPersonalAuditLogs : getAuditLogs;

  try {
    const payload = await fetchFn(page);

    if (!payload?.success) {
      throw new Error('Failed to fetch audit logs');
    }

    const signature = buildSignature(payload.logs, payload.pagination);
    if (!lastSignature || signature !== lastSignature) {
      lastSignature = signature;
      container.innerHTML = renderLogsTable(payload.logs, !isPersonal);

      if (paginationContainer) {
        paginationContainer.innerHTML = renderPagination(payload.pagination, 'pagination-container');
        initPaginationHandlers(paginationContainer);
      }
    }
  } catch (error) {
    console.error('Failed to load audit logs:', error);
    const colSpan = isPersonal ? 3 : 4;
    container.innerHTML = `
      <tr>
        <td colspan="${colSpan}" class="py-8 text-center text-destructive">
          Failed to load audit logs. Please try again later.
        </td>
      </tr>
    `;
  }
}

function initPaginationHandlers(container) {
  container.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-page]');
    if (!button || button.hasAttribute('disabled')) return;

    const page = parseInt(button.getAttribute('data-page'), 10);
    if (page > 0) {
      await loadLogs(page);
    }
  });
}

loadLogs();