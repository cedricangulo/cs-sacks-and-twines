/**
 * @module inventory/validation
 * Inventory form validation schemas.
 */
import { normalizedString, positiveNumber, formatZodErrors, formatResult } from '../utils/validation.js';
import { z } from 'zod';

/**
 * Create an optional positive number schema.
 *
 * @code VAL-optionalPositiveNumber
 * @param {string} message
 * @returns {z.ZodEffects<z.ZodNumber, number | undefined, unknown>}
 */
const optionalPositiveNumber = (message) => z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : value;
  },
  z.number().gt(0, message).optional(),
);

/**
 * Create an optional non-negative number schema.
 *
 * @code VAL-optionalNonNegativeNumber
 * @param {string} message
 * @returns {z.ZodEffects<z.ZodNumber, number | undefined, unknown>}
 */
const optionalNonNegativeNumber = (message) => z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : value;
  },
  z.number().min(0, message).optional(),
);

const inventoryExistingSchema = z.object({
  mode: z.literal('existing'),
  product_id: normalizedString(1, 255, 'Please choose an existing item before saving stock.'),
  quantity_received: positiveNumber('Quantity must be greater than zero.'),
  total_procurement_cost: positiveNumber('Total procurement cost must be greater than zero.'),
});

const inventoryNewSchema = z.object({
  mode: z.literal('new'),
  name: normalizedString(1, 255, 'Enter an item name for the new product.'),
  category: normalizedString(1, 255, 'Select a valid category for the new product.'),
  base_uom: normalizedString(1, 255, 'Select a valid unit of measurement for the new product.'),
  weight_per_unit: optionalNonNegativeNumber('Weight per unit must be zero or greater.'),
  supplier_id: normalizedString(1, 255, 'Select a supplier for the new item.'),
  quantity_received: positiveNumber('Quantity must be greater than zero.'),
  total_procurement_cost: positiveNumber('Total procurement cost must be greater than zero.'),
  low_stock_threshold: optionalNonNegativeNumber('Low stock threshold must be zero or greater.'),
});

const inventorySchema = z.discriminatedUnion('mode', [
  inventoryExistingSchema,
  inventoryNewSchema,
]);

/**
 * Validate the inventory form payload.
 *
 * @code VAL-inventory
 * @param {Record<string, unknown>} values
 * @returns {ReturnType<typeof formatResult>}
 */
export function validateInventoryForm(values) {
  return formatResult(inventorySchema.safeParse(values));
}
