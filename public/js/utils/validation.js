/**
 * @module validation
 * Shared Zod validation schemas for supplier and inventory forms.
 */
import { z } from 'zod';

// ── Primitive helpers ────────────────────────────────────────────────────────

/**
 * Normalize a raw value by converting it to a trimmed single-space string.
 *
 * @param {unknown} value
 * @returns {string}
 */
const normalizeText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');

/**
 * Create a string schema that normalizes whitespace and enforces min/max length.
 *
 * @param {number} min - Minimum length (inclusive).
 * @param {number} max - Maximum length (inclusive).
 * @param {string} message - Error message when length bounds are violated.
 * @returns {z.ZodEffects<z.ZodString, string, unknown>}
 */
const normalizedString = (min, max, message) => z.preprocess(
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
 * @type {z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>}
 */
const contactNumberSchema = z.string()
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
 * @param {string} message - Error message for missing, invalid, or non-positive values.
 * @returns {z.ZodEffects<z.ZodNumber, number, unknown>}
 */
const positiveNumber = (message) => z.preprocess(
  coerceNumber,
  z.number({ required_error: message, invalid_type_error: message }).gt(0, message),
);

// ── Form schemas ─────────────────────────────────────────────────────────────

/**
 * Validates the supplier create/update form payload.
 */
const supplierSchema = z.object({
  company_name: normalizedString(2, 255, 'Enter a valid company name.'),
  contact_person: normalizedString(2, 255, 'Enter a valid contact person name.'),
  contact_number: contactNumberSchema,
  address: normalizedString(10, 500, 'Enter a valid address.'),
});

/**
 * Validates the user create form payload.
 */
const userCreateSchema = z.object({
  name: normalizedString(2, 255, 'Enter a valid name.'),
  email: z.preprocess(
    normalizeText,
    z.string().max(254, 'Enter a valid email address.').email('Enter a valid email address.')
  ),
  password: z.preprocess(
    normalizeText,
    z.string().min(8, 'Password must be at least 8 characters.')
  ),
});


/**
 * Validates the inventory form when adding stock to an existing item.
 */
const inventoryExistingSchema = z.object({
  mode: z.literal('existing'),
  product_id: normalizedString(1, 255, 'Please choose an existing item before saving stock.'),
  quantity_received: positiveNumber('Quantity must be greater than zero.'),
  total_procurement_cost: positiveNumber('Total procurement cost must be greater than zero.'),
});

/**
 * Validates the inventory form when creating a new item alongside its first stock entry.
 */
const inventoryNewSchema = z.object({
  mode: z.literal('new'),
  name: normalizedString(1, 255, 'Enter an item name for the new product.'),
  category: normalizedString(1, 255, 'Select a valid category for the new product.'),
  base_uom: normalizedString(1, 255, 'Select a valid unit of measurement for the new product.'),
  weight_per_unit: positiveNumber('Weight per unit must be greater than zero.'),
  supplier_id: normalizedString(1, 255, 'Select a supplier for the new item.'),
  quantity_received: positiveNumber('Quantity must be greater than zero.'),
  total_procurement_cost: positiveNumber('Total procurement cost must be greater than zero.'),
});

/**
 * Discriminated union that picks the correct inventory validation shape
 * based on the `mode` field (`'existing'` or `'new'`).
 */
const inventorySchema = z.discriminatedUnion('mode', [
  inventoryExistingSchema,
  inventoryNewSchema,
]);

// ── Error formatting helpers ─────────────────────────────────────────────────

/**
 * Flatten a Zod `ZodError` into a simple `{ [fieldName]: message }` object.
 * Only the first issue per field is kept.
 *
 * @param {z.ZodError} error
 * @returns {Record<string, string>}
 */
const formatZodErrors = (error) => {
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
 * @param {z.SafeParseReturnType<object, object>} result
 * @returns {ValidationResult}
 */
const formatResult = (result) => {
  if (result.success) {
    return { success: true, errors: {}, data: result.data };
  }

  return { success: false, errors: formatZodErrors(result.error) };
};

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Validate supplier form field values.
 *
 * @param {object} values
 * @param {string} values.company_name
 * @param {string} values.contact_person
 * @param {string} values.contact_number
 * @param {string} values.address
 * @returns {ValidationResult}
 */
export function validateSupplierForm(values) {
  return formatResult(supplierSchema.safeParse(values));
}

/**
 * Validate inventory form field values.
 *
 * @param {object} values
 * @param {string} values.mode - `'existing'` or `'new'`.
 * @param {string} [values.product_id]
 * @param {string} [values.name]
 * @param {string} [values.category]
 * @param {string} [values.base_uom]
 * @param {string} [values.weight_per_unit]
 * @param {string} [values.supplier_id]
 * @param {string} values.quantity_received
 * @param {string} values.total_procurement_cost
 * @returns {ValidationResult}
 */
export function validateInventoryForm(values) {
  return formatResult(inventorySchema.safeParse(values));
}

/**
 * Validate user create form field values.
 *
 * @param {object} values
 * @param {string} values.name
 * @param {string} values.email
 * @param {string} values.role
 * @param {string} values.password
 * @returns {ValidationResult}
 */
export function validateUserCreateForm(values) {
  return formatResult(userCreateSchema.safeParse(values));
}

/**
 * Validate user update form field values.
 *
 * @param {object} values
 * @param {string} values.user_id
 * @param {string} values.name
 * @param {string} values.email
 * @param {string} values.password
 * @returns {ValidationResult}
 */
