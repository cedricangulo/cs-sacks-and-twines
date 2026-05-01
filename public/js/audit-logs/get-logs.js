import { fetchJson } from '../utils/fetch-utils.js';

let lastSignature = '';

export async function getAuditLogs(page = 1) {
  const container = document.getElementById('audit-logs-container');
  const apiUrl = container?.getAttribute('data-api-url') || '/api/audit-logs';
  const url = `${apiUrl}?page=${page}`;

  return await fetchJson(url);
}

export async function getPersonalAuditLogs(page = 1) {
  const container = document.getElementById('audit-logs-container');
  const apiUrl = container?.getAttribute('data-api-url') || '/api/audit-logs/personal';
  const url = `${apiUrl}?page=${page}`;

  return await fetchJson(url);
}

export function buildSignature(logs, pagination) {
  return `${logs.length}|${pagination.page}|${pagination.total}`;
}