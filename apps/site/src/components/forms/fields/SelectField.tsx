/**
 * SelectField
 *
 * Renders a USWDS single-select dropdown for Freshdesk field types:
 *   - custom_dropdown
 *   - default_ticket_type
 *
 * Choices are fetched at build time via the Freshdesk per-field endpoint
 * (GET /api/v2/ticket-forms/{id}/fields/{field_id}) and passed in via
 * the field config. They are never fetched client-side.
 *
 * Choice rendering:
 *   - Uses `value` as the option value submitted to Freshdesk
 *   - Uses `label` as display text, falling back to `value` if label is empty
 *     (Freshdesk test/draft forms sometimes return empty label strings)
 *   - A blank default option is always prepended so the field starts unselected,
 *     consistent with USWDS select behavior and required field validation
 *
 * Dynamic sections:
 *   When a dropdown field has sections (has_section: true), selecting an option
 *   may reveal additional fields. The optional onSectionChange callback is called
 *   whenever the selected value changes, allowing DynamicForm to track which
 *   sections should be visible. SelectField itself has no knowledge of sections —
 *   it just reports its value upward via the callback.
 *
 * Uses raw USWDS CSS classes, consistent with the project pattern of using
 * Trussworks only when a component requires complex JS behavior.
 */

import type { UseFormRegister, FieldError } from 'react-hook-form'
import type { FreshdeskChoice } from '../../../util/freshdesk/types'

interface SelectFieldProps {
  // The Freshdesk field name (e.g. "ticket_type", "cf_assistance_type").
  // Used as the HTML select name and React Hook Form registration key.
  name: string
  // The customer-facing label from label_for_customers.
  label: string
  // Optional hint text from hint_for_customers.
  // Rendered between the label and the select per USWDS and UX spec.
  hint?: string
  // Whether the field is required — derived from required_for_customers.
  required?: boolean
  // The available choices for this dropdown.
  // Fetched at build time via the per-field endpoint and merged into
  // the field config by getFormFields. Should never be undefined for
  // dropdown fields — renderField logs a warning if choices are missing.
  choices?: FreshdeskChoice[]
  // React Hook Form's register function, bound to this field by the parent.
  register: ReturnType<UseFormRegister<Record<string, unknown>>>
  // The React Hook Form error for this field, if any.
  error?: FieldError
  // Optional callback fired when the selected value changes.
  // Used by renderField to track section visibility when this dropdown
  // has dynamic sections attached. Not needed for dropdowns without sections.
  onSectionChange?: (value: string) => void
}

export default function SelectField({
  name,
  label,
  hint,
  required = false,
  choices = [],
  register,
  error,
  onSectionChange,
}: SelectFieldProps) {
  const hintId = hint ? `${name}-hint` : undefined
  const errorId = error ? `${name}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  // Destructure onChange from register so we can call both RHF's handler
  // and our section change callback without losing RHF's change tracking.
  // restRegister contains the remaining register properties (onBlur, ref, name)
  // which are spread onto the <select> element below unchanged.
  const { onChange, ...restRegister } = register

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

      <select
        id={name}
        className={`usa-select${error ? ' usa-input--error' : ''}`}
        aria-required={required}
        aria-describedby={describedBy}
        onChange={(e) => {
          // Call RHF's onChange first to keep form state in sync,
          // then notify the parent about the new value for section tracking.
          onChange(e)
          onSectionChange?.(e.target.value)
        }}
        {...restRegister}
      >
        {/* Blank default option — ensures the field starts unselected.
            Required fields will fail validation if this remains selected,
            since its value is an empty string. */}
        <option value="">- Select -</option>

        {choices.map((choice) => (
          <option key={choice.id} value={choice.value}>
            {/* Fall back to value if label is empty.
                Freshdesk test/draft forms sometimes return blank labels. */}
            {choice.label || choice.value}
          </option>
        ))}
      </select>
    </div>
  )
}