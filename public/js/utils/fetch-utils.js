/**
 * Fetch JSON and return the parsed payload.
 *
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<unknown>}
 */
export async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!response.ok) {
    let message = text || 'Network response was not ok';

    if (contentType.includes('application/json')) {
      try {
        const payload = JSON.parse(text);
        if (payload && typeof payload.message === 'string') {
          message = payload.message;
        }
      } catch (error) {
        // Ignore JSON parse errors and fall back to plain text.
      }
    }

    throw new Error(message);
  }

  if (!contentType.includes('application/json')) {
    throw new Error('Expected a JSON response from the API.');
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error('API returned invalid JSON.');
  }
}
