import { fetchJson } from '../utils/fetch-utils.js';

/**
 * Fetch users from the API.
 *
 * @code USR-getUsers
 * @returns {Promise<unknown[]>}
 */
export async function getUsers() {
  const container = document.getElementById('users-container');
  const apiUrl = container?.getAttribute('data-api-url') || '/api/users';

  const payload = await fetchJson(apiUrl);

  if (!Array.isArray(payload)) {
    throw new Error('Users API returned an unexpected response.');
  }

  return payload;
}