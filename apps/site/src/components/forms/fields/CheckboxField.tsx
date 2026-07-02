/**
 * CheckboxField
 *
 * Renders a USWDS single boolean checkbox for Freshdesk field type:
 *   - custom_checkbox
 *
 * Freshdesk's custom_checkbox is a single boolean field — checked submits
 * true, unchecked submits false. There is no multiselect checkbox type in
 * Freshdesk ticket forms. If multiple options are needed, the Freshdesk
 * workaround is multiple separate checkbox fields or a dropdown.
 *
 * This component is distinct from ConsentField, which is a hardcoded
 * site-level checkbox not derived from Freshdesk field config. This component
 * is for Freshdesk-configured boolean fields rendered dynamically by DynamicForm.
 *
 * Payload behavior:
 *   The value submitted to Freshdesk is a boolean (true/false), not a string.
 *   React Hook Form registers checkboxes as booleans by default, which is
 *   correct for Freshdesk's custom_checkbox type.
 *
 * Uses raw USWDS CSS classes, consistent with the project pattern of using
 * Trussworks only when a component requires complex JS behavior.
 */

import type { UseFormRegister, FieldError } from 'react-hook-form'

interface CheckboxFieldProps {
  // The Freshdesk field name (e.g. "cf_agree_to_terms").
  // Used as the HTML input name and React Hook Form registration key.
  name: string
  // The customer-facing label from label_for_customers.
  // Rendered as the checkbox label, not as a separate field label above it —
  // USWDS checkbox pattern places the label inline with the input.
  label: string
  // Optional hint text from hint_for_customers.
  // Rendered above the checkbox group wrapper per USWDS checkbox pattern.
  hint?: string
  // Whether the field is required — derived from required_for_customers.
  // A required checkbox means the user must check it to submit.
  required?: boolean
  // React Hook Form's register function, bound to this field by the parent.
  register: ReturnType<UseFormRegister<Record<string, unknown>>>
  // The React Hook Form error for this field, if any.
  error?: FieldError
}

export default function CheckboxField({
  name,
  label,
  hint,
  required = false,
  register,
  error,
}: CheckboxFieldProps) {
  const hintId = hint ? `${name}-hint` : undefined
  const errorId = error ? `${name}-error` : undefined

  return (
    <div className={`usa-form-group${error ? ' usa-form-group--error' : ''}`}>
      {/* USWDS checkbox pattern: hint and error appear above the checkbox
          wrapper, not between a label and input as with text fields. */}
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

      <div className="usa-checkbox">
        <input
          id={name}
          className="usa-checkbox__input"
          type="checkbox"
          aria-required={required}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          {...register}
        />
        <label className="usa-checkbox__label" htmlFor={name}>
          {label}
          {required && (
            <abbr title="required" className="usa-hint usa-hint--required">
              {' '}*
            </abbr>
          )}
        </label>
      </div>
    </div>
  )
}