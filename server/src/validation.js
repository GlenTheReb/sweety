import { parseDate } from './dates.js';

export const SLOTS = ['Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner'];

export function validateReading(body, today) {
  if (body.value === '' || body.value === null || body.value === undefined) {
    return 'Please enter a glucose value.';
  }
  const value = Number(body.value);
  if (!/^\d+$/.test(String(body.value)) || !Number.isInteger(value) || value < 40 || value > 600) {
    return 'Value must be a whole number between 40 and 600 mg/dL.';
  }
  if (!parseDate(body.date)) return 'Please choose a valid date.';
  if (body.date > today) return 'Date cannot be in the future.';
  if (!SLOTS.includes(body.slot)) return 'Please choose a valid time slot.';
  return null;
}
