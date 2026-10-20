import type { FreshdeskField } from './types';
import type { CustomObjectField } from './typesCustomObjects';

type NormalizableField =
  | Pick<FreshdeskField, 'type'>
  | Pick<CustomObjectField, 'type'>;

function normalizeDateString(value: string): string {
  const trimmed = value.trim();

  if (trimmed === '' || /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!match) return trimmed;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));
  const isValidDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isValidDate) return trimmed;

  return `${year.toString().padStart(4, '0')}-${month
    .toString()
    .padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function normalizeIntegerString(value: string): number | string {
  const trimmed = value.trim();
  if (trimmed === '') return trimmed;

  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : trimmed;
}

function normalizeDecimalString(value: string): number | string {
  const trimmed = value.trim();
  if (trimmed === '') return trimmed;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : trimmed;
}

export function normalizeFreshdeskFieldValue(
  field: NormalizableField,
  value: unknown,
): unknown {
  if (typeof value !== 'string') return value;

  switch (field.type) {
    case 'custom_date':
    case 'DATE':
      return normalizeDateString(value);

    case 'custom_number':
    case 'NUMBER':
      return normalizeIntegerString(value);

    case 'custom_decimal':
    case 'DECIMAL':
      return normalizeDecimalString(value);

    default:
      return value;
  }
}
