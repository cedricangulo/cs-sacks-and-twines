/**
 * @module validation
 * Shared Zod validation primitives and helper functions.
 */
import { z } from 'zod';

/**
 * Normalize a raw value by converting it to a trimmed single-space string.
 *
 * @code VAL-normalizeText
 * @param {unknown} value
 * @returns {string}
 */
export const normalizeText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');

/**
 * Create a string schema that normalizes whitespace and enforces min/max length.
 *
 * @code VAL-normalizedString
 * @param {number} min - Minimum length (inclusive).
 * @param {number} max - Maximum length (inclusive).
 * @param {string} message - Error message when length bounds are violated.
 * @returns {z.ZodEffects<z.ZodString, string, unknown>}
 */
export const normalizedString = (min, max, message) => z.preprocess(
  normalizeText,
  z.string().min(min, message).max(max, message),
);

/**
 * PH-specific phone number schema. Accepts mobile and landline formats with
 * flexible formatting (spaces, dashes, parentheses, `+` are stripped).
 *
 * Valid patterns after stripping non-digits:
 * - Mobile: `09xxxxxxxxx` (11 digits) or `639xxxxxxxxx` (13 digits).
 * - Landline: `0[area]xxxxxxx` or `63[area]xxxxxxx`.
 *
 * @code VAL-contactNumberSchema
 * @type {z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>}
 */
export const contactNumberSchema = z.string()
  .transform((value) => String(value ?? '').replace(/\D/g, ''))
  .superRefine((value, ctx) => {
    const isMobile = /^(09|639)\d{9}$/.test(value);
    const isLandline = /^(0\d{1,2}|63\d{1,2})\d{7}$/.test(value);

    if (!isMobile && !isLandline) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a valid PH mobile (e.g., 0917...) or landline number.',
      });
    }
  });

/**
 * Convert a raw input value to a number safely.
 * Returns the original value when conversion fails so Zod can flag it.
 *
 * @code VAL-coerceNumber
 * @param {unknown} value
 * @returns {number | unknown}
 */
const coerceNumber = (value) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return NaN;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : value;
  }

  return value;
};

/**
 * Create a numeric schema that accepts values strictly greater than zero.
 * Works with both `number` inputs and string-formatted numbers (e.g., form data).
 *
 * @code VAL-positiveNumber
 * @param {string} message - Error message for missing, invalid, or non-positive values.
 * @returns {z.ZodEffects<z.ZodNumber, number, unknown>}
 */
export const positiveNumber = (message) => z.preprocess(
  coerceNumber,
  z.number({ required_error: message, invalid_type_error: message }).gt(0, message),
);

// ── Error formatting helpers ─────────────────────────────────────────────────

/**
 * Flatten a Zod `ZodError` into a simple `{ [fieldName]: message }` object.
 * Only the first issue per field is kept.
 *
 * @code VAL-formatZodErrors
 * @param {z.ZodError} error
 * @returns {Record<string, string>}
 */
export const formatZodErrors = (error) => {
  const errors = {};

  error.issues.forEach((issue) => {
    const key = issue.path[0];
    if (!key) {
      return;
    }

    const fieldName = String(key);
    if (!errors[fieldName]) {
      errors[fieldName] = issue.message;
    }
  });

  return errors;
};

/**
 * @typedef {object} ValidationResult
 * @property {boolean} success
 * @property {Record<string, string>} errors - Present when `success` is `false`.
 * @property {object} [data] - Parsed, validated payload when `success` is `true`.
 */

/**
 * Normalize a `safeParse` result into a uniform shape used by form handlers.
 *
 * @code VAL-formatResult
 * @param {z.SafeParseReturnType<object, object>} result
 * @returns {ValidationResult}
 */
export const formatResult = (result) => {
  if (result.success) {
    return { success: true, errors: {}, data: result.data };
  }

  return { success: false, errors: formatZodErrors(result.error) };
};
