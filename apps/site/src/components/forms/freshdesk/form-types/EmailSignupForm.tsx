import Button from '@bdc/ui-react/button/Button';
import { useId, useRef, useState } from 'react';
import type { FieldError } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { getRecaptchaToken } from '../../../../util/recaptcha/getRecaptchaToken';
import TextField from '../../fields/TextField';
import { fieldErrors, formErrors, formStatus } from '../../util/errorMessages';

interface Props {
  submitUrl: string;
  recaptchaSiteKey: string;
  successHeading?: string;
  successText?: string;
  errorMessage?: string;
  alreadyExistsMessage?: string;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'warning' | 'error';

export default function EmailSignupForm({
  submitUrl,
  recaptchaSiteKey,
  successHeading = formStatus.emailSignupSuccessHeading,
  successText = formStatus.emailSignupSuccessText,
  errorMessage,
  alreadyExistsMessage,
}: Props) {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const confirmationRef = useRef<HTMLOutputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const nameId = useId();
  const emailId = useId();
  const defaultErrorMessage = formErrors.submission.emailSignup;
  const defaultAlreadyExistsMessage =
    formErrors.submission.emailSignupAlreadyExists;
  const resolvedErrorMessage = errorMessage ?? defaultErrorMessage;
  const resolvedAlreadyExistsMessage =
    alreadyExistsMessage ?? defaultAlreadyExistsMessage;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Record<string, string>>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const getDisplayErrorMessage = (message?: unknown) => {
    if (errorMessage) {
      return errorMessage;
    }

    return typeof message === 'string' && message !== ''
      ? message
      : defaultErrorMessage;
  };

  const onSubmit = async (values: Record<string, string>) => {
    if (!submitUrl || !recaptchaSiteKey) {
      setStatus('error');
      setSubmitError(resolvedErrorMessage);
      setTimeout(() => errorRef.current?.focus(), 0);
      return;
    }

    setStatus('submitting');
    setSubmitError(null);

    const name = String(values.name ?? '').trim();
    const email = String(values.email ?? '').trim();

    try {
      const recaptchaToken = await getRecaptchaToken(
        recaptchaSiteKey,
        'join_submit',
      );

      const payload: Record<string, string> = {
        email,
        recaptcha_token: recaptchaToken,
      };

      if (name !== '') {
        payload.name = name;
      }

      const response = await fetch(submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let responseBody: Record<string, unknown> | null = null;
      try {
        responseBody = (await response.json()) as Record<string, unknown>;
      } catch {
        responseBody = null;
      }

      if (response.status === 409) {
        setStatus('warning');
        setSubmitError(resolvedAlreadyExistsMessage);
        setTimeout(() => errorRef.current?.focus(), 0);
        return;
      }

      if (!response.ok) {
        throw new Error(getDisplayErrorMessage(responseBody?.error));
      }

      setStatus('success');
      reset();
      setTimeout(() => confirmationRef.current?.focus(), 0);
    } catch (error) {
      setStatus('error');
      setSubmitError(
        error instanceof Error
          ? getDisplayErrorMessage(error.message)
          : resolvedErrorMessage,
      );
      setTimeout(() => errorRef.current?.focus(), 0);
    }
  };

  if (status === 'success') {
    return (
      <>
        <output
          ref={confirmationRef}
          className="usa-alert usa-alert--success display-block"
          tabIndex={-1}
        >
          <div className="usa-alert__body">
            <h3 className="usa-alert__heading">{successHeading}</h3>
            <p className="usa-alert__text">{successText}</p>
          </div>
        </output>

        <div className="margin-top-2">
          <Button
            type="button"
            outline
            onClick={() => {
              setStatus('idle');
              setSubmitError(null);
            }}
          >
            Use a different email
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="font-sans-sm margin-bottom-2">
        Subscribe to receive monthly BDC newsletters and other announcements.
      </p>

      {(status === 'error' || status === 'warning') && submitError && (
        <div
          ref={errorRef}
          className={`usa-alert ${status === 'warning' ? 'usa-alert--warning' : 'usa-alert--error'} margin-bottom-2`}
          role="alert"
          tabIndex={-1}
        >
          <div className="usa-alert__body">
            <p className="usa-alert__text">{submitError}</p>
          </div>
        </div>
      )}

      <form className="usa-form maxw-full" onSubmit={handleSubmit(onSubmit)}>
        <div className="display-flex grid-row">
          <div className="margin-0 grid-col">
            <TextField
              id={nameId}
              name="name"
              label="Name"
              register={register('name')}
              error={errors.name as FieldError | undefined}
              autoComplete="name"
              disabled={status === 'submitting'}
            />
          </div>

          <div className="margin-left-5 grid-col">
            <TextField
              id={emailId}
              name="email"
              label="Email"
              required
              inputType="email"
              register={register('email', {
                required: fieldErrors.email.required,
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: fieldErrors.email.pattern,
                },
              })}
              error={errors.email as FieldError | undefined}
              autoComplete="email"
              disabled={status === 'submitting'}
            />
          </div>
        </div>

        <Button type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Subscribing...' : 'Subscribe to Updates'}
        </Button>
      </form>
    </>
  );
}
