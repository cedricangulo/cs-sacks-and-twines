/**
 * Fetch JSON and return the parsed payload.
 *
 * @code UTIL-fetchJson
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

/**
 * Fetch JSON but return both response and parsed payload without throwing.
 * Useful for callers that need to inspect `payload.errors` when the response is not OK.
 *
 * @code UTIL-fetchJsonResponse
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<{ response: Response, payload: unknown }>}
 */
export async function fetchJsonResponse(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch (e) {
    payload = null;
  }

  return { response, payload };
}
