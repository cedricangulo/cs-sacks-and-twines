/**
 * Escape text for safe HTML rendering (display contexts only).
 * Use sanitizeForSubmit() for pre-submit payload filtering.
 *
 * @code UTIL-sanitizeInput
 * @param {unknown} value - The raw input value
 * @returns {string} Escaped string safe for HTML display
 */
export function sanitizeInput(value) {
  const text = String(value ?? '');
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (match) => map[match]);
}

/**
 * Filter text for database submission by stripping HTML tags and control characters.
 * Does NOT encode to HTML entities - preserves plain text in DB.
 *
 * @code UTIL-sanitizeForSubmit
 * @param {unknown} value - The raw input value
 * @returns {string} Filtered string safe for storage
 */
export function sanitizeForSubmit(value) {
  const text = String(value);
  let clean = text;
  // Strip complete tags <...> and incomplete tag openings like <iframe src="
  // Pattern 1: <...> (complete tags)
  // Pattern 2: <tagname attr= including opening quote (incomplete tags)
  clean = clean.replace(/<[^>]*>|<[^=]*(?:=["'])?/g, '');
  // Remove ASCII control characters (0-31) and delete character (127)
  clean = clean.replace(/[\x00-\x1F\x7F]/g, '');
  // Collapse multiple whitespace characters into a single space and trim
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean;
}

/**
 * Sanitize multiple fields for submission.
 *
 * @code UTIL-sanitizeFieldsForSubmit
 * @param {Record<string, unknown>} data - Key-value pairs to sanitize
 * @returns {Record<string, string>} Sanitized key-value pairs
 */
export function sanitizeFieldsForSubmit(data) {
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    sanitized[key] = sanitizeForSubmit(value);
  }
  return sanitized;
}