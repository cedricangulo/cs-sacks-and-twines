/**
 * @module suppliers/validation
 * Supplier form validation schemas.
 */
import { normalizedString, contactNumberSchema, formatZodErrors, formatResult } from '../utils/validation.js';
import { z } from 'zod';

const supplierSchema = z.object({
  company_name: normalizedString(2, 255, 'Enter a valid company name.'),
  contact_person: normalizedString(2, 255, 'Enter a valid contact person name.'),
  contact_number: contactNumberSchema,
  address: normalizedString(10, 500, 'Enter a valid address.'),
});

/**
 * Validate supplier form values.
 *
 * @code VAL-supplier
 * @param {Record<string, unknown>} values
 * @returns {ReturnType<typeof formatResult>}
 */
export function validateSupplierForm(values) {
  return formatResult(supplierSchema.safeParse(values));
}
