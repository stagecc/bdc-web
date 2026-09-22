import type { FreshdeskField } from './types';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDescriptionValue(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;

    return escapeHtml(trimmed).replaceAll(/\r?\n/g, '<br />');
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => formatDescriptionValue(item))
      .filter((item): item is string => item !== null);
    return items.length > 0 ? items.join(', ') : null;
  }

  return null;
}

export function buildFreshdeskDescription(
  values: Record<string, unknown>,
  fields: FreshdeskField[],
): string {
  const lines = fields
    .filter(
      (field) =>
        field.type !== 'default_subject' &&
        field.type !== 'default_description' &&
        field.type !== 'default_company',
    )
    .map((field) => {
      const formattedValue = formatDescriptionValue(values[field.name]);
      if (!formattedValue) return null;
      return `${escapeHtml(field.label_for_customers)}: ${formattedValue} <br />`;
    })
    .filter((line): line is string => line !== null);

  return lines.length > 0 ? lines.join('') : 'Submitted from website form.';
}
