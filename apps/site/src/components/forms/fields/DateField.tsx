/**
 * DateField
 *
 * Renders a date input for Freshdesk field type: custom_date
 *
 * Why Trussworks here instead of raw USWDS classes?
 * The USWDS date picker is a JS-enhanced component that initializes by
 * scanning the DOM for [data-module="usa-date-picker"]. In a React island,
 * React controls the DOM and renders client-side — the USWDS JS bundle
 * may run before React has mounted, missing the element entirely.
 *
 * Trussworks DatePicker handles its own initialization as a proper React
 * component, making it safe to use inside DynamicForm without needing to
 * manually call datePicker.init() in a useEffect or depend on load order.
 *
 * All other field types use raw USWDS classes — this is the one exception.
 *
 * React Hook Form integration note:
 * Trussworks DatePicker doesn't accept a ref directly (it wraps a USWDS
 * component internally), so we use useController from React Hook Form instead
 * of register. The parent DynamicForm passes control rather than register
 * for this field type.
 */

import { DatePicker } from '@trussworks/react-uswds';
import { useState } from 'react';
import type { Control, FieldError } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { normalizeFreshdeskFieldValue } from '../../../util/freshdesk/normalizeFreshdeskFieldValue';
import { fieldErrors } from '../util/errorMessages';

interface DateFieldProps {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  // DateField uses useController because Trussworks DatePicker
  // doesn't expose a ref for React Hook Form to attach to directly.
  control: Control<Record<string, unknown>>;
  error?: FieldError;
}

export default function DateField({
  name,
  label,
  hint,
  required = false,
  control,
  error,
}: DateFieldProps) {
  const { field } = useController({
    name,
    control,
    rules: { required: required ? fieldErrors.date.required : false },
  });
  const value = typeof field.value === 'string' ? field.value : '';
  const [picker, setPicker] = useState({ value, revision: 0 });
  // DatePicker only reads defaultValue on mount. Remount for external changes
  // (prefill/reset), but preserve its focus and calendar during user edits.
  if (picker.value !== value) {
    setPicker({ value, revision: picker.revision + 1 });
  }

  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <div className={`usa-form-group${error ? ' usa-form-group--error' : ''}`}>
      <label className="usa-label maxw-none" htmlFor={name}>
        {label}
        {required && (
          <abbr title="required" className="usa-hint usa-hint--required">
            {' '}
            *
          </abbr>
        )}
      </label>

      {hint && (
        <span id={hintId} className="usa-hint">
          {hint}
        </span>
      )}

      {error && (
        <span id={errorId} className="usa-error-message" role="alert">
          {error.message}
        </span>
      )}

      <DatePicker
        key={picker.revision}
        id={name}
        name={name}
        defaultValue={
          normalizeFreshdeskFieldValue({ type: 'custom_date' }, value) as string
        }
        onChange={(val) => {
          const nextValue = val ?? '';
          setPicker((current) => ({ ...current, value: nextValue }));
          field.onChange(nextValue);
        }}
        onBlur={field.onBlur}
        aria-describedby={
          [hintId, errorId].filter(Boolean).join(' ') || undefined
        }
      />
    </div>
  );
}
