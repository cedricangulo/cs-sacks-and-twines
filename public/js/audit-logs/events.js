import { createServerTable } from '../utils/data-table.js';
import { fetchAuditLogs } from './get-logs.js';
import { renderLogsTable, renderPagination, renderLogDetailsRow } from './render.js';

/**
 * Toggle a log row's expanded details.
 *
 * @code AUD-toggleRow
 * @param {string} logId
 * @param {Array<Record<string, unknown>>} logs
 */
export function toggleLogRow(logId, logs) {
  const container = document.getElementById('audit-logs-container');
  const row = container.querySelector(`.log-row[data-log-id="${logId}"]`);
  if (!row) return;

  const isExpanded = row.getAttribute('data-expanded') === 'true';
  const detailsId = `log-details-${logId}`;
  const existingDetails = container.querySelector(`#${detailsId}`);

  if (isExpanded && existingDetails) {
    existingDetails.remove();
    row.setAttribute('data-expanded', 'false');
  } else if (!isExpanded) {
    const log = logs.find(l => String(l.log_id) === String(logId));
    if (log) {
      const detailsRow = document.createElement('tr');
      detailsRow.id = detailsId;
      detailsRow.innerHTML = renderLogDetailsRow(log);
      row.after(detailsRow);
      row.setAttribute('data-expanded', 'true');
    }
  }
}

/**
 * Bind click handlers to log rows.
 *
 * @code AUD-bindRowEvents
 * @param {Array<Record<string, unknown>>} logs
 */
export function bindLogRowEvents(logs) {
  const container = document.getElementById('audit-logs-container');
  if (!container) return;

  container.querySelectorAll('.log-row').forEach((row) => {
    row.addEventListener('click', (event) => {
      const toggleBtn = event.target.closest('.log-toggle-btn');
      if (toggleBtn) {
        event.stopPropagation();
        const logId = row.getAttribute('data-log-id');
        toggleLogRow(logId, logs);
        return;
      }

      const logId = row.getAttribute('data-log-id');
      toggleLogRow(logId, logs);
    });
  });
}

/**
 * Initialize the audit logs table.
 *
 * @code AUD-initTable
 */
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
    afterRender: (logs) => bindLogRowEvents(logs),
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

  const serverTable = createServerTable(config);
  serverTable.init();
}