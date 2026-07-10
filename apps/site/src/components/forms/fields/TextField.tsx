/**
 * TextField
 *
 * Renders a USWDS single-line text input for Freshdesk field types:
 *   - custom_text      — plain text input
 *   - default_requester — email input (pass inputType="email")
 *   - default_company  — plain text input
 *   - custom_number    — integer input (pass inputType="number")
 *   - custom_decimal   — decimal input (pass inputType="decimal")
 *   - custom_url       — URL input (pass inputType="url")
 *
 * All numeric and URL variants reuse this component via the inputType prop
 * rather than having separate components — the HTML element and USWDS styling
 * are identical. The only differences are input type, step attribute (for
 * decimals), and validation rules, which are handled by DynamicForm's
 * renderField when registering with React Hook Form.
 *
 * Styling differences between variants (e.g. unit labels for numbers,
 * prefix icons for URLs) can be added later without changing this component's
 * core structure.
 *
 * Uses raw USWDS CSS classes rather than Trussworks, consistent with the
 * project pattern of using Trussworks only when a component requires
 * complex JS behavior (see DateField for the one exception).
 *
 * Registered directly with React Hook Form via the `register` prop,
 * so the parent DynamicForm controls all form state.
 */

import type { FieldError, UseFormRegister } from 'react-hook-form';

// The full set of input types this component supports.
// 'decimal' is a semantic alias for type="number" with step="any" —
// it's not a native HTML input type but used internally to distinguish
// custom_decimal from custom_number in the step attribute logic below.
type TextFieldInputType = 'text' | 'email' | 'number' | 'decimal' | 'url';

interface TextFieldProps {
  // The Freshdesk field name (e.g. "requester", "cf_journal_name").
  // Used as the HTML input name and React Hook Form registration key.
  name: string;
  // The customer-facing label from label_for_customers.
  label: string;
  // Optional hint text from hint_for_customers.
  // Rendered between the label and the input per USWDS and UX spec.
  hint?: string;
  // Whether the field is required — derived from required_for_customers.
  required?: boolean;
  // Input type — defaults to "text".
  // Pass "email" for default_requester, "number" for custom_number,
  // "decimal" for custom_decimal, "url" for custom_url.
  inputType?: TextFieldInputType;
  // React Hook Form's register function, bound to this field by the parent.
  register: ReturnType<UseFormRegister<Record<string, unknown>>>;
  // The React Hook Form error for this field, if any.
  error?: FieldError;
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
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  // aria-describedby wires the input to both hint and error text for screen readers.
  // Both may be present simultaneously — hint is always shown, error only on failure.
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  // 'decimal' is an internal alias — the HTML input type is always 'number'.
  // We use it to set step="any", which allows decimal values.
  // custom_number uses step="1" (integers only) by default.
  const htmlType = inputType === 'decimal' ? 'number' : inputType;
  const step =
    inputType === 'decimal' ? 'any' : inputType === 'number' ? '1' : undefined;

  return (
    <div className={`usa-form-group${error ? ' usa-form-group--error' : ''}`}>
      <label className="usa-label" htmlFor={name}>
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

      <input
        id={name}
        className={`usa-input${error ? ' usa-input--error' : ''}`}
        type={htmlType}
        step={step}
        aria-required={required}
        aria-describedby={describedBy}
        {...register}
      />
    </div>
  );
}
