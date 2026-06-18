/**
 * ConsentField
 *
 * A hardcoded consent checkbox rendered at the bottom of every form,
 * above the submit button. Not derived from Freshdesk field config —
 * this is a site-level requirement added by DynamicForm regardless
 * of what fields Freshdesk returns.
 *
 * Why hardcoded?
 *   Consent language is a legal/policy concern, not a support ticket
 *   field. It doesn't belong in Freshdesk's field config and shouldn't
 *   be editable there. It lives here so content changes go through
 *   the normal code review and approval process.
 *
 * Behavior:
 *   - Required — the form cannot be submitted without checking this box
 *   - Checked state is registered with React Hook Form like any other field
 *   - The consent value is NOT included in the Freshdesk ticket payload —
 *     it's filtered out in buildPayload since it has no cf_ prefix and
 *     no matching default field type
 *
 * Copy note:
 *   The label text below is a placeholder. Final consent language should
 *   be confirmed with the content lead and legal/policy reviewer before launch.
 */

import type { UseFormRegister, FieldError } from 'react-hook-form'

// The field name used to register this input with React Hook Form.
// Must be consistent with any filtering logic in buildPayload.
export const CONSENT_FIELD_NAME = 'consent'

interface ConsentFieldProps {
  register: ReturnType<UseFormRegister<Record<string, unknown>>>
  error?: FieldError
}

export default function ConsentField({ register, error }: ConsentFieldProps) {
  return (
    <div className={`usa-form-group${error ? ' usa-form-group--error' : ''}`}>
      {error && (
        <span id="consent-error" className="usa-error-message" role="alert">
          {error.message}
        </span>
      )}

      <div className="usa-checkbox">
        <input
          id={CONSENT_FIELD_NAME}
          className="usa-checkbox__input"
          type="checkbox"
          aria-describedby={error ? 'consent-error' : undefined}
          {...register}
        />
        <label className="usa-checkbox__label" htmlFor={CONSENT_FIELD_NAME}>
          {/* TODO: Replace with final consent language approved by content lead */}
          I understand that submitting this form does not guarantee a particular
          outcome, and I consent to this information being used to process my
          request.
        </label>
      </div>
    </div>
  )
}