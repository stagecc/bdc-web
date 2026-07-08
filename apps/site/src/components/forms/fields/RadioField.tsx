/**
 * RadioField
 *
 * Renders a USWDS radio button group for single-select fields backed by
 * reference data from a Freshdesk custom object schema.
 *
 * Used for fields where the user must pick exactly one option from a
 * predefined list — for example, Publication Status (Published, Preprint, Other).
 *
 * Options source:
 *   Options are fetched at build time via getReferenceDataValues() and passed
 *   as a string array prop. They are never fetched client-side.
 *
 * "Other" free text:
 *   If "Other" appears in the options array (case-insensitive), selecting it
 *   reveals a text input below the radio group. The text input is registered
 *   as `other_{fieldName}` and is required when "Other" is selected.
 *   Selecting any other option hides and clears the text input via
 *   useFormContext's unregister — so stale values are never included in
 *   the payload.
 *
 * Uses raw USWDS CSS classes, consistent with the project pattern of using
 * Trussworks only when a component requires complex JS behavior.
 */

import { useState } from 'react';
import type { FieldError, UseFormRegister } from 'react-hook-form';
import { useFormContext } from 'react-hook-form';
import { fieldErrors } from '../util/errorMessages';
import TextField from './TextField';

interface RadioFieldProps {
  // The field name — used as the HTML input name and RHF registration key.
  // Also used to generate unique input IDs for each option and the
  // "Other" free text field name: `other_{name}`.
  name: string;
  // The customer-facing label for the radio group.
  label: string;
  // Optional hint text shown below the label, above the radio options.
  hint?: string;
  // Whether at least one option must be selected before submitting.
  required?: boolean;
  // The available options for this radio group.
  // Fetched at build time via getReferenceDataValues() from a reference
  // data custom object schema (e.g. PublicationStatus).
  // Each string is both the display label and the submitted value.
  // If "Other" is present (case-insensitive), a free text input is shown
  // when it is selected.
  options: string[];
  // React Hook Form's register function, bound to this field by the parent.
  register: ReturnType<UseFormRegister<Record<string, unknown>>>;
  // The React Hook Form error for this field, if any.
  error?: FieldError;
}

export default function RadioField({
  name,
  label,
  hint,
  required = false,
  options,
  register,
  error,
}: RadioFieldProps) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  // Track whether "Other" is currently selected so we can show/hide
  // the free text input. Local state — doesn't need to live in RHF.
  const [otherSelected, setOtherSelected] = useState(false);

  // Access unregister from form context — available because DynamicForm
  // and DynamicCustomObjectForm wrap all fields in FormProvider.
  const {
    register: contextRegister,
    unregister,
    formState: { errors: contextErrors },
  } = useFormContext<Record<string, unknown>>();

  const otherFieldName = `other_${name}`;
  const otherError = contextErrors[otherFieldName] as FieldError | undefined;

  // Detect if "Other" is one of the options (case-insensitive).
  const hasOtherOption = options.some((o) => o.toLowerCase() === 'other');

  return (
    <div className={`usa-form-group${error ? ' usa-form-group--error' : ''}`}>
      <fieldset className="usa-fieldset" aria-describedby={describedBy}>
        <legend className="usa-legend">
          {label}
          {required && (
            <abbr title="required" className="usa-hint usa-hint--required">
              {' '}
              *
            </abbr>
          )}
        </legend>

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

        {options.map((option) => {
          const isOtherOption = option.toLowerCase() === 'other';
          const optionId = `${name}-${option.toLowerCase().replace(/\s+/g, '-')}`;

          return (
            <div key={option} className="usa-radio">
              <input
                id={optionId}
                className="usa-radio__input"
                type="radio"
                value={option}
                onChange={(e) => {
                  // For the "Other" option, track selected state so we can
                  // show/hide the free text input. When another option is
                  // selected, unregister the text field to clear its value.
                  if (isOtherOption) {
                    setOtherSelected(true);
                  } else {
                    if (otherSelected) {
                      setOtherSelected(false);
                      unregister(otherFieldName, { keepValue: false });
                    }
                  }
                  // Call the original register onChange to keep RHF in sync
                  register.onChange(e);
                }}
                onBlur={register.onBlur}
                ref={register.ref}
                name={register.name}
              />
              <label className="usa-radio__label" htmlFor={optionId}>
                {option}
              </label>
            </div>
          );
        })}
      </fieldset>

      {/* "Other" free text input — only rendered when "Other" is selected.
          Uses the dynamic-section-fields class for the fade-in animation.
          Registered as `other_{fieldName}` and required when visible. */}
      {hasOtherOption && otherSelected && (
        <div className="dynamic-section-fields">
          <TextField
            name={otherFieldName}
            label="Please describe"
            required
            register={contextRegister(otherFieldName, {
              required: fieldErrors.text.required('other'),
            })}
            error={otherError}
          />
        </div>
      )}
    </div>
  );
}
