/**
 * TextField
 *
 * Renders a USWDS single-line text input for Freshdesk field types:
 *   - custom_text
 *   - default_requester (email — pass type="email" via inputType prop)
 *   - default_company
 *
 * Uses raw USWDS CSS classes rather than Trussworks, consistent with the
 * project pattern of using Trussworks only when a component requires
 * complex JS behavior (see DateField for the one exception).
 *
 * Registered directly with React Hook Form via the `register` prop,
 * so the parent DynamicForm controls all form state.
 */

import type { UseFormRegister, FieldError } from 'react-hook-form'

interface TextFieldProps {
  // The Freshdesk field name (e.g. "requester", "cf_journal_name").
  // Used as the HTML input name and React Hook Form registration key.
  name: string
  // The customer-facing label from label_for_customers.
  label: string
  // Optional hint text from hint_for_customers.
  // Rendered between the label and the input per USWDS and UX spec.
  hint?: string
  // Whether the field is required — derived from required_for_customers.
  required?: boolean
  // Input type — defaults to "text". Pass "email" for default_requester fields.
  inputType?: 'text' | 'email'
  // React Hook Form's register function, bound to this field by the parent.
  register: ReturnType<UseFormRegister<Record<string, unknown>>>
  // The React Hook Form error for this field, if any.
  error?: FieldError
}

export default function TextField({
  name,
  label,
  hint,
  required = false,
  inputType = 'text',
  register,
  error,
}: TextFieldProps) {
  const hintId = hint ? `${name}-hint` : undefined
  const errorId = error ? `${name}-error` : undefined

  // aria-describedby wires the input to both hint and error text for screen readers.
  // Both may be present simultaneously — hint is always shown, error only on failure.
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`usa-form-group${error ? ' usa-form-group--error' : ''}`}>
      <label className="usa-label" htmlFor={name}>
        {label}
        {required && (
          <abbr title="required" className="usa-hint usa-hint--required">
            {' '}*
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

      <input
        id={name}
        className={`usa-input${error ? ' usa-input--error' : ''}`}
        type={inputType}
        aria-required={required}
        aria-describedby={describedBy}
        {...register}
      />
    </div>
  )
}