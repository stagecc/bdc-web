/**
 * DynamicCustomObjectForm
 *
 * A React island that renders a Freshdesk custom object form dynamically
 * from field configuration fetched at build time by the Astro page.
 *
 * Parallel to DynamicForm.tsx but for custom object schemas rather than
 * ticket forms. Key differences:
 *
 *   - Accepts CustomObjectField[] instead of FreshdeskField[]
 *   - Uses renderCustomObjectField instead of renderField
 *   - Uses buildCustomObjectPayload instead of buildPayload
 *   - No formType — custom object records don't have a ticket type string
 *   - No dynamic sections — custom objects don't support them natively
 *   - schemaId identifies which custom object schema to post records to
 *   - idPrefix customizes the generated submission ID per form type
 *
 * FormProvider:
 *   This component uses FormProvider to expose the RHF form context to all
 *   child field components. Field components that need unregister (e.g. for
 *   "Other" free text fields) access it via useFormContext rather than having
 *   it passed as a prop.
 *
 * Data flow:
 *   1. Astro page fetches schema fields via getCustomObjectSchema at build time
 *   2. Astro page fetches reference data via getReferenceDataValues at build time
 *   3. Reference data options are merged into relevant field configs
 *   4. Enriched fields array is passed as props to this component
 *   5. renderCustomObjectField maps field types to USWDS components
 *   6. On submit, buildCustomObjectPayload builds the record payload
 *   7. Payload (including reCAPTCHA token) is POSTed to the Lambda proxy,
 *      which forwards to POST /api/v2/custom_objects/schemas/{id}/records/
 *
 * Error fallback:
 *   If getCustomObjectSchema throws at build time, the Astro page catches it
 *   and passes error={true}. This component renders a fallback message instead
 *   of the form.
 */

import { useRef, useState } from 'react';
import type { FieldError } from 'react-hook-form';
import { FormProvider, useForm } from 'react-hook-form';
import { buildCustomObjectPayload } from '../../util/freshdesk/buildCustomObjectPayload';
import type { CustomObjectField } from '../../util/freshdesk/typesCustomObjects';
import { getRecaptchaToken } from '../../util/recaptcha';
import ConsentField, { CONSENT_FIELD_NAME } from './ConsentField';
import HoneypotField from './HoneypotField';
import { renderCustomObjectField } from './helpers/renderCustomObjectField';
import { fieldErrors, formErrors, formStatus } from './util/errorMessages';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

interface DynamicCustomObjectFormProps {
  // Filtered, enriched field config from getCustomObjectSchema.
  // PRIMARY and hidden fields are excluded. Reference data fields
  // have options populated from getReferenceDataValues.
  fields: CustomObjectField[];
  // The numeric ID of the custom object schema.
  // Passed to the Lambda proxy so it can construct the correct endpoint:
  // POST /api/v2/custom_objects/schemas/{schemaId}/records/
  schemaId: number;
  // Prefix for the generated submission ID (e.g. 'PUB', 'CC', 'JOIN').
  // Defaults to 'SUB' if not provided.
  idPrefix?: string;
  // The URL of the Lambda proxy endpoint.
  // Set via FRESHDESK_PROXY_URL in apps/site/.env.
  submitUrl: string;
  // The reCAPTCHA v3 site key for the current environment.
  // Passed from the Astro page via import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY.
  recaptchaSiteKey: string;
  // True if getCustomObjectSchema threw at build time — renders fallback UI.
  error?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DynamicCustomObjectForm({
  fields,
  schemaId,
  idPrefix = 'SUB',
  submitUrl,
  recaptchaSiteKey,
  error = false,
}: DynamicCustomObjectFormProps) {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const confirmationRef = useRef<HTMLDivElement>(null);

  // methods is the full RHF form instance. Spread into FormProvider so all
  // child field components can access register, unregister, control, etc.
  // via useFormContext without needing them passed as props.
  const methods = useForm<Record<string, unknown>>({
    mode: 'onSubmit', // Validate on submit, not while typing
    reValidateMode: 'onChange', // Clear errors in real time as user fixes them
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  // ---------------------------------------------------------------------------
  // Fallback — shown when getCustomObjectSchema failed at build time
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <div className="usa-alert usa-alert--error" role="alert">
        <div className="usa-alert__body">
          <h3 className="usa-alert__heading">
            {formStatus.unavailableHeading}
          </h3>
          <p className="usa-alert__text">{formStatus.unavailable}</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Success state — replaces the form after a successful submission
  // ---------------------------------------------------------------------------

  if (status === 'success') {
    return (
      // tabIndex={-1} allows focus to be programmatically moved here
      // after submission, per the UX spec accessibility requirement.
      <div ref={confirmationRef} tabIndex={-1}>
        <output className="usa-alert usa-alert--success">
          <div className="usa-alert__body">
            <h2 className="usa-alert__heading">{formStatus.successHeading}</h2>
            <p className="usa-alert__text">
              {/* TODO: Per-form follow-up copy — confirm with content team */}
              Check your inbox for a confirmation email with a copy of your
              submission.
            </p>
          </div>
        </output>

        <div className="margin-top-3">
          {/* TODO: Per-form button labels and destinations — confirm with content team */}
          <button
            type="button"
            className="usa-button usa-button--outline margin-right-2"
            onClick={() => {
              reset();
              setStatus('idle');
            }}
          >
            Submit another
          </button>
          <a className="usa-button" href="/">
            Return to home
          </a>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------

  const onSubmit = async (values: Record<string, unknown>) => {
    setStatus('submitting');
    setSubmitError(null);

    try {
      // Get reCAPTCHA token before building payload.
      // The Lambda proxy verifies this token with Google before forwarding
      // the record to Freshdesk. See services/freshdesk/handler.py.
      const recaptchaToken = await getRecaptchaToken(recaptchaSiteKey);

      const payload = {
        ...buildCustomObjectPayload(values, fields, 'name', idPrefix),
        recaptcha_token: recaptchaToken,
        // Pass schemaId so the Lambda knows which endpoint to hit.
        // The Lambda constructs: POST /api/v2/custom_objects/schemas/{schemaId}/records/
        schema_id: schemaId,
      };

      const response = await fetch(submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Submit failed: ${response.status}`);
      }

      setStatus('success');

      // Move focus to confirmation message per UX spec accessibility requirement.
      // setTimeout defers until after React re-renders the success state.
      setTimeout(() => confirmationRef.current?.focus(), 0);
    } catch {
      setStatus('error');
      setSubmitError(formErrors.submission.general);
    }
  };

  const onError = () => {
    // Validation failed — move focus to error summary per UX spec.
    setTimeout(() => errorSummaryRef.current?.focus(), 0);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const errorFields = Object.keys(errors);

  return (
    <FormProvider {...methods}>
      <form
        className="usa-form usa-form--large"
        onSubmit={handleSubmit(onSubmit, onError)}
        noValidate // Disable native browser validation — RHF handles it
      >
        {/* Submission error banner — shown when the Lambda POST fails */}
        {status === 'error' && submitError && (
          <div
            className="usa-alert usa-alert--error margin-bottom-3"
            role="alert"
          >
            <div className="usa-alert__body">
              <p className="usa-alert__text">{submitError}</p>
            </div>
          </div>
        )}

        {/* Validation error summary — shown after a failed submit attempt.
            Focus moves here programmatically via onError so screen reader
            users hear the summary immediately. */}
        {errorFields.length > 0 && (
          <div
            ref={errorSummaryRef}
            className="usa-alert usa-alert--error margin-bottom-3"
            role="alert"
            tabIndex={-1}
          >
            <div className="usa-alert__body">
              <h2 className="usa-alert__heading">
                {formErrors.summary.heading}
              </h2>
              <ul className="usa-list">
                {errorFields.map((fieldName) => (
                  <li key={fieldName}>
                    <a href={`#${fieldName}`}>
                      {errors[fieldName]?.message as string}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Required fields note — per UX spec, appears at top of every form */}
        <p className="usa-hint margin-bottom-2">
          Required fields are marked with an asterisk (*).
        </p>

        {/* Form intro text */}
        <p className="margin-bottom-3">
          Enter the required information below to complete your submission.
        </p>

        {/* Dynamic fields — rendered from custom object schema field config */}
        {fields.map((field) =>
          renderCustomObjectField(field, register, control, errors),
        )}

        {/* Hardcoded fields — not derived from Freshdesk config */}
        <ConsentField
          register={register(CONSENT_FIELD_NAME, {
            required: fieldErrors.consent.required,
          })}
          error={errors[CONSENT_FIELD_NAME] as FieldError | undefined}
        />

        <HoneypotField register={register('website')} />

        {/* Submit button — disabled while submitting to prevent double submission.
            Label changes to "Submitting…" so users know something is happening. */}
        <button
          type="submit"
          className="usa-button margin-top-3"
          disabled={status === 'submitting'}
          aria-disabled={status === 'submitting'}
        >
          {status === 'submitting' ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </FormProvider>
  );
}
