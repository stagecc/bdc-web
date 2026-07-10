/**
 * TextareaField
 *
 * Renders a USWDS multi-line textarea for Freshdesk field types:
 *   - custom_paragraph
 *   - default_description
 *
 * Follows the same pattern as TextField — raw USWDS classes,
 * registered with React Hook Form via the parent's register function.
 *
 * The UX spec notes that long text fields may have a character limit
 * with a visible counter. The optional maxLength prop enables this —
 * when provided, USWDS's character count behavior is activated via
 * the data-character-count attribute pattern. This requires the USWDS
 * JS bundle to be loaded globally (already handled in apps/site layout).
 */

import type { FieldError, UseFormRegister } from 'react-hook-form';

interface TextareaFieldProps {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  // Optional character limit. When provided, renders a character count
  // indicator below the textarea using the USWDS character-count pattern.
  maxLength?: number;
  register: ReturnType<UseFormRegister<Record<string, unknown>>>;
  error?: FieldError;
}

export default function TextareaField({
  name,
  label,
  hint,
  required = false,
  maxLength,
  register,
  error,
}: TextareaFieldProps) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  // When maxLength is set, USWDS expects the textarea to be wrapped in a
  // div with data-character-count pointing to the input's id, and a
  // separate status element with id="${name}-info" for the counter.
  const textarea = (
    <textarea
      id={name}
      className={`usa-textarea${error ? ' usa-input--error' : ''}`}
      aria-required={required}
      aria-describedby={describedBy}
      maxLength={maxLength}
      {...register}
    />
  );

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

      {maxLength ? (
        // USWDS character count wrapper — activates the JS-powered counter.
        // The data-character-count attribute tells USWDS which input to watch,
        // and the span below renders the remaining character count.
        <div
          className="usa-character-count"
          data-character-count
          data-character-count-target={`#${name}`}
        >
          {textarea}
          <span
            id={`${name}-info`}
            className="usa-character-count__status usa-hint"
            aria-live="polite"
          >
            {maxLength} characters allowed
          </span>
        </div>
      ) : (
        textarea
      )}
    </div>
  );
}
