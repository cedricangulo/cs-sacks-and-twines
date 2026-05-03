import { fetchJson } from '../utils/fetch-utils.js';

/**
 * Fetch dispatches from API.
 *
 * @code DSP-fetchDispatches
 * @returns {Promise<unknown[]>}
 */
export async function fetchDispatches() {
  const container = document.getElementById('dispatches-container');
  const dispatchesUrl = container?.getAttribute('data-dispatches-url');

  if (!dispatchesUrl) {
    throw new Error('Missing dispatches URL');
  }

  const payload = await fetchJson(dispatchesUrl);

  if (!payload.success) {
    throw new Error(payload.message ?? 'Failed to load dispatches');
  }

  return payload.dispatches ?? [];
}