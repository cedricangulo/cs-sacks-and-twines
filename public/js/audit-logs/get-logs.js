import { fetchJson } from '../utils/fetch-utils.js';

/**
 * Fetch audit logs from the API with filters.
 *
 * @code AUD-fetchLogs
 * @param {Record<string, string>} params
 * @returns {Promise<unknown>}
 */
export async function fetchAuditLogs(params) {
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
