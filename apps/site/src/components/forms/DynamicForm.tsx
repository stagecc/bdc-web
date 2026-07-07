/**
 * DynamicForm
 *
 * A React island that renders a Freshdesk-backed form dynamically from
 * field configuration fetched at build time by the Astro page.
 *
 * Why a React island?
 *   Forms require client-side interactivity — validation state, submission
 *   handling, field error display, success/loading/error UI transitions.
 *   The field *config* is static (fetched at build time and passed as props),
 *   but the form *behavior* must run in the browser.
 *
 * Data flow:
 *   1. Astro page fetches field config from Freshdesk API at build time
 *   2. Filtered fields array is passed as props to this component
 *   3. renderField maps each field type to the appropriate USWDS component
 *   4. On submit, buildPayload transforms RHF values into a Freshdesk ticket shape
 *   5. Payload (including reCAPTCHA token) is POSTed to the Lambda proxy,
 *      which verifies reCAPTCHA and forwards the ticket to Freshdesk
 *
 * Dynamic sections:
 *   Dropdown fields with dynamic sections track their selected value in
 *   sectionSelections state. renderField uses this to show/hide section
 *   fields inline below the dropdown. Hidden section fields are unregistered
 *   from RHF so their values are excluded from the payload.
 *
 * Error fallback:
 *   If getFormFields throws at build time, the Astro page catches it and passes
 *   error={true}. This component renders a fallback message instead of the form.
 */

import { useCallback, useRef, useState } from 'react';
import type { FieldError } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { buildPayload } from '../../util/freshdesk/buildPayload';
import { getSectionFieldIds } from '../../util/freshdesk/getFormFields';
import type { FreshdeskField } from '../../util/freshdesk/types';
import { getRecaptchaToken } from '../../util/recaptcha';
import ConsentField, { CONSENT_FIELD_NAME } from './ConsentField';
import HoneypotField from './HoneypotField';
import { renderField } from './helpers/renderField';
import { fieldErrors, formErrors, formStatus } from './util/errorMessages';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

interface DynamicFormProps {
  // Filtered, enriched field config from getFormFields — only fields where
  // displayed_to_customers is true and archived is false. Dropdown fields
  // include choices and sections populated at build time.
  fields: FreshdeskField[];
  // The Freshdesk ticket type string for this form
  // (e.g. "Published Research Submission").
  // Used as both ticket `type` and ticket `subject` in buildPayload.
  formType: string;
  // The URL of the Lambda proxy endpoint.
  // Provided by the Astro page so it can vary per environment.
  // Set via FRESHDESK_PROXY_URL in apps/site/.env.
  submitUrl: string;
  // The reCAPTCHA v3 site key for the current environment.
  // Passed from the Astro page via import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY.
  // Used to obtain a token before submission — the Lambda verifies it.
  recaptchaSiteKey: string;
  // True if getFormFields threw at build time — renders fallback UI.
  error?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DynamicForm({
  fields,
  formType,
  submitUrl,
  recaptchaSiteKey,
  error = false,
}: DynamicFormProps) {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const confirmationRef = useRef<HTMLDivElement>(null);

  // Tracks the currently selected value for each dropdown that has sections.
  // Keyed by field name, value is the selected choice value string.
  // Updated by onSectionChange when the user selects a dropdown option.
  const [sectionSelections, setSectionSelections] = useState<
    Record<string, string>
  >({});

  const {
    register,
    control,
    handleSubmit,
    reset,
    unregister,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    mode: 'onSubmit', // Validate on submit, not while typing
    reValidateMode: 'onChange', // Clear errors in real time as user fixes them
  });

  // Called by SelectField (via renderField) when a section-controlling
  // dropdown changes. Updates sectionSelections which triggers a re-render,
  // showing or hiding the appropriate section fields.
  // useCallback prevents unnecessary re-renders of child components.
  const onSectionChange = useCallback((fieldName: string, value: string) => {
    setSectionSelections((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  // IDs of fields that belong to dynamic sections.
  // These are skipped during top-level rendering — they only appear
  // inline below their parent dropdown when their section is triggered.
  const sectionFieldIds = getSectionFieldIds(fields);

  // ---------------------------------------------------------------------------
  // Fallback — shown when getFormFields failed at build time
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <div className="usa-alert usa-alert--error custom-form">
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
            <p className="usa-alert__text">{formStatus.successText}</p>
          </div>
        </output>

        <div className="margin-top-3">
          {/* TODO: Per-form button labels and destinations — confirm with content team */}
          <button
            type="button"
            className="usa-button usa-button--outline margin-right-2"
            onClick={() => {
              reset();
              setSectionSelections({});
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
      // the ticket to Freshdesk. See services/freshdesk/handler.py.
      const recaptchaToken = await getRecaptchaToken(recaptchaSiteKey);

      const payload = {
        ...buildPayload(values, fields, formType),
        recaptcha_token: recaptchaToken,
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
            <h2 className="usa-alert__heading">{formErrors.summary.heading}</h2>
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

      {/* Dynamic fields — rendered from Freshdesk field config.
          Fields that belong to dynamic sections are skipped here —
          they are rendered inline below their parent dropdown by renderField. */}
      {fields
        .filter((field) => !sectionFieldIds.has(field.id))
        .map((field) =>
          renderField(
            field,
            register,
            control,
            errors,
            unregister,
            sectionSelections,
            onSectionChange,
          ),
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
  );
}
