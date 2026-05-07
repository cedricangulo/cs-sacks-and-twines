import { fetchJson as sharedFetchJson } from '../utils/fetch-utils.js';

/**
 * Extracts the base URL from the current page path to handle subfolder installs.
 * @returns {string} Base URL path (e.g., '/cs-sacks-and-twines')
 */
function getBaseUrl() {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  const subfolder = segments.slice(0, -1).join('/');
  return subfolder ? '/' + subfolder : '';
}

/**
 * Fetches dashboard statistics including asset value, dispatch value, and BI data.
 * @returns {Promise<{success: boolean, data: object}>} Dashboard stats response
 */
export function getDashboardStats() {
  const baseUrl = getBaseUrl();
  return sharedFetchJson(`${baseUrl}/api/dashboard/stats`);
}

/**
 * Fetches stocks efficiency rate (dispatched vs received quantities).
 * @returns {Promise<{success: boolean, dispatched: number, received: number}>} Efficiency data
 */
export function getEfficiency() {
  const baseUrl = getBaseUrl();
  return sharedFetchJson(`${baseUrl}/api/dashboard/efficiency`);
}

/**
 * Fetches dispatch history aggregated by time range.
 * @param {string} [range='month'] - Time range: 'today', 'week', 'month', '3months', 'year'
 * @returns {Promise<{success: boolean, data: array}>} Array of {date, total_quantity}
 */
export function getDispatchHistory(range = 'month') {
  const baseUrl = getBaseUrl();
  const params = new URLSearchParams({ range });
  return sharedFetchJson(`${baseUrl}/api/dispatch-history?${params}`);
}