import { useRef, useState } from 'react';
import type { FieldError } from 'react-hook-form';
import { FormProvider, useForm } from 'react-hook-form';
import { buildContactPayload } from '../../util/freshdesk/buildContactPayload';
import { getRecaptchaToken } from '../../util/recaptcha';
import HoneypotField from './HoneypotField';
import { formErrors, formStatus } from './util/errorMessages';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormStatus =
  | 'idle'
  | 'submitting'
  | 'success'
  | 'already_exists'
  | 'error';

interface FreshdeskContactFormProps {
  // The Join Lambda endpoint URL.
  // Set via FRESHDESK_JOIN_URL in apps/site/.env.
  submitUrl: string;
  // The reCAPTCHA v3 site key for the current environment.
  // Passed from the Astro page via import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY.
  recaptchaSiteKey: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FreshdeskContactForm({
  submitUrl,
  recaptchaSiteKey,
}: FreshdeskContactFormProps) {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const confirmationRef = useRef<HTMLDivElement>(null);

  const methods = useForm<Record<string, unknown>>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------

  const onSubmit = async (values: Record<string, unknown>) => {
    setStatus('submitting');
    setSubmitError(null);

    try {
      const recaptchaToken = await getRecaptchaToken(recaptchaSiteKey);

      const payload = {
        ...buildContactPayload(values),
        recaptcha_token: recaptchaToken,
      };

      const response = await fetch(submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // 409 means the email already exists as a Freshdesk contact.
      // Show a friendly message rather than treating it as an error.
      if (response.status === 409) {
        setStatus('already_exists');
        setTimeout(() => confirmationRef.current?.focus(), 0);
        return;
      }

      if (!response.ok) {
        throw new Error(`Submit failed: ${response.status}`);
      }

      setStatus('success');
      setTimeout(() => confirmationRef.current?.focus(), 0);
    } catch {
      setStatus('error');
      setSubmitError(formErrors.submission.general);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const isComplete = status === 'success' || status === 'already_exists';

  return (
    <FormProvider {...methods}>
      <div>
        {/* Success / already exists message — shown in the same location
            as the form so the page layout doesn't shift on submission. */}
        {isComplete && (
          <div ref={confirmationRef} tabIndex={-1}>
            <div className="usa-alert usa-alert--success">
              <div className="usa-alert__body">
                <p className="usa-alert__text">
                  {status === 'already_exists'
                    ? formStatus.alreadySubscribed
                    : "You're subscribed! Check your inbox for a confirmation."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form — hidden after successful submission */}
        {!isComplete && (
          <form
            className="usa-form maxw-full"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {/* Submission error banner */}
            {status === 'error' && submitError && (
              <div
                className="usa-alert usa-alert--error margin-bottom-2"
                role="alert"
              >
                <div className="usa-alert__body">
                  <p className="usa-alert__text">{submitError}</p>
                </div>
              </div>
            )}

            <div className="display-flex grid-row">
              {/* Name field — optional */}
              <div className="usa-form-group margin-0 grid-col">
                <label className="usa-label" htmlFor="signup-name">
                  Name
                </label>
                <input
                  id="signup-name"
                  className="usa-input"
                  type="text"
                  autoComplete="name"
                  {...register('name')}
                />
              </div>

              {/* Email field — required */}
              <div className="usa-form-group margin-0 grid-col margin-left-5">
                <label className="usa-label" htmlFor="signup-email">
                  Email
                  <abbr
                    title="required"
                    className="usa-hint usa-hint--required"
                  >
                    {' '}
                    *
                  </abbr>
                </label>
                {errors.email && (
                  <span className="usa-error-message" role="alert">
                    {(errors.email as FieldError).message}
                  </span>
                )}
                <input
                  id="signup-email"
                  className={`usa-input${errors.email ? ' usa-input--error' : ''}`}
                  type="email"
                  autoComplete="email"
                  aria-required
                  {...register('email', {
                    required:
                      'Please enter a valid email address (e.g. name@example.com).',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message:
                        'Please enter a valid email address (e.g. name@example.com).',
                    },
                  })}
                />
              </div>
            </div>

            <HoneypotField register={register('website')} />

            <button
              type="submit"
              className="usa-button margin-top-2"
              disabled={status === 'submitting'}
              aria-disabled={status === 'submitting'}
            >
              {status === 'submitting'
                ? 'Subscribing…'
                : 'Subscribe to Updates'}
            </button>
          </form>
        )}
      </div>
    </FormProvider>
  );
}
