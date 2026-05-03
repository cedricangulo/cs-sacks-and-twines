/**
 * @module users/validation
 * User form validation schemas.
 */
import { normalizedString, formatZodErrors, formatResult } from '../utils/validation.js';
import { z } from 'zod';

const normalizeText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');

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

const userUpdateSchema = z.object({
  user_id: normalizedString(1, 255, 'Invalid user.'),
  name: normalizedString(2, 255, 'Enter a valid name.'),
  email: z.preprocess(
    normalizeText,
    z.string().max(254, 'Enter a valid email address.').email('Enter a valid email address.')
  ),
  password: z.preprocess(
    normalizeText,
    z.string().min(8, 'Password must be at least 8 characters.')
  ).optional().or(z.literal('')),
});

/**
 * Validate the create user form payload.
 *
 * @code VAL-userCreate
 * @param {Record<string, unknown>} values
 * @returns {ReturnType<typeof formatResult>}
 */
export function validateUserCreateForm(values) {
  return formatResult(userCreateSchema.safeParse(values));
}

/**
 * Validate the update user form payload.
 *
 * @code VAL-userUpdate
 * @param {Record<string, unknown>} values
 * @returns {ReturnType<typeof formatResult>}
 */
export function validateUserUpdateForm(values) {
  return formatResult(userUpdateSchema.safeParse(values));
}
