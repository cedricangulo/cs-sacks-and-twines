import { fetchJson } from '../utils/fetch-utils.js';
import { renderLogsTable, renderPagination } from './render.js';
import { createServerTable } from '../utils/data-table.js';

async function fetchAuditLogs(params) {
  const container = document.getElementById('audit-logs-container');
  const apiUrl = container?.getAttribute('data-api-url') || '/api/audit-logs';

  const url = new URL(apiUrl, window.location.origin);
  if (params.search) url.searchParams.set('search', params.search);
  if (params.sort) url.searchParams.set('sort', params.sort);
  if (params.dir) url.searchParams.set('dir', params.dir);
  if (params.page) url.searchParams.set('page', params.page);
  if (params.action) url.searchParams.set('action', params.action);
  if (params.user_id) url.searchParams.set('user_id', params.user_id);
  if (params.date_from) url.searchParams.set('date_from', params.date_from);
  if (params.date_to) url.searchParams.set('date_to', params.date_to);

  return await fetchJson(url.toString());
}

let serverTable;

export function initAuditLogsTable() {
  const container = document.getElementById('audit-logs-container');
  const apiUrl = container?.getAttribute('data-api-url') || '';
  const isPersonal = apiUrl.includes('personal');

  const config = {
    container: '#audit-logs-container',
    fetchFn: fetchAuditLogs,
    renderFn: (logs) => renderLogsTable(logs, !isPersonal),
    renderPagination: renderPagination,
    id: isPersonal ? 'personal-audit-logs' : 'audit-logs',
  };

  if (!isPersonal) {
    config.filterBar = {
      id: 'audit-logs',
      searchPlaceholder: 'Search logs...',
      selects: [
        { key: 'action', label: 'All actions', options: [] },
        { key: 'user_id', label: 'All users', options: [] },
      ],
      inputs: [
        { key: 'date_from', label: 'From date', type: 'date' },
        { key: 'date_to', label: 'To date', type: 'date' },
      ],
    };
  }

  serverTable = createServerTable(config);
  serverTable.init();
}
