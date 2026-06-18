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
 *   3. This component maps field types to USWDS components and renders the form
 *   4. On submit, buildPayload transforms RHF values into a Freshdesk ticket shape
 *   5. Payload is POSTed to the Lambda proxy, which forwards to Freshdesk tickets API
 *
 * Error fallback:
 *   If getFormFields throws at build time, the Astro page catches it and passes
 *   error={true}. This component renders a fallback message instead of the form.
 */


import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { FieldError } from 'react-hook-form'
import type { FreshdeskField } from '../../util/freshdesk/types'
import { buildPayload } from '../../util/freshdesk/buildPayload'
import TextField from './fields/TextField.tsx'
import TextareaField from './fields/TextareaField.tsx'
import DateField from './fields/DateField.tsx'
import HoneypotField from './HoneypotField.tsx'
import ConsentField, { CONSENT_FIELD_NAME } from './ConsentField.tsx'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

interface DynamicFormProps {
  // Filtered field config from getFormFields — only fields where
  // displayed_to_customers is true and archived is false.
  fields: FreshdeskField[]
  // The Freshdesk ticket type string for this form
  // (e.g. "Published Research Submission").
  // Used as both ticket `type` and ticket `subject`.
  formType: string
  // The URL of the Lambda proxy endpoint.
  // Provided by the Astro page so it can vary per environment.
  submitUrl: string
  // The reCAPTCHA site key for the current environment, passed from the Astro page.
  recaptchaSiteKey: string
  // True if getFormFields threw at build time — renders fallback UI.
  error?: boolean
}

// ---------------------------------------------------------------------------
// Field type → component mapping
// ---------------------------------------------------------------------------

/**
 * Renders the appropriate USWDS component for a given Freshdesk field type.
 *
 * Most fields use raw USWDS CSS classes on plain HTML elements.
 * DateField is the one exception — it uses Trussworks DatePicker because
 * the USWDS date picker requires JS initialization that conflicts with
 * React's DOM control in a client island. See DateField.tsx for details.
 */
function renderField(
  field: FreshdeskField,
  register: ReturnType<typeof useForm<Record<string, unknown>>>['register'],
  control: ReturnType<typeof useForm<Record<string, unknown>>>['control'],
  errors: ReturnType<typeof useForm<Record<string, unknown>>>['formState']['errors']
) {
const commonProps = {
  name: field.name,
  label: field.label_for_customers,
  hint: field.hint_for_customers,
  required: field.required_for_customers,
  error: errors[field.name] as FieldError | undefined,
}

  switch (field.type) {
    case 'default_requester':
      return (
        <TextField
          key={field.name}
          {...commonProps}
          inputType="email"
          register={register(field.name, {
            required: field.required_for_customers
              ? 'Please enter a valid email address (e.g. name@example.com).'
              : false,
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Please enter a valid email address (e.g. name@example.com).',
            },
          })}
        />
      )

    case 'default_subject':
      // Subject is always set programmatically via formType in buildPayload.
      // It should never be rendered as a visible field, even if
      // displayed_to_customers is true in Freshdesk.
      return null

    case 'custom_text':
    case 'default_company':
      return (
        <TextField
          key={field.name}
          {...commonProps}
          register={register(field.name, {
            required: field.required_for_customers
              ? `Please enter your ${field.label_for_customers.toLowerCase()}.`
              : false,
          })}
        />
      )

    case 'custom_paragraph':
    case 'default_description':
      return (
        <TextareaField
          key={field.name}
          {...commonProps}
          register={register(field.name, {
            required: field.required_for_customers
              ? `Please enter your ${field.label_for_customers.toLowerCase()}.`
              : false,
          })}
        />
      )

    case 'custom_date':
      return (
        <DateField
          key={field.name}
          {...commonProps}
          control={control}
        />
      )

    default:
      // Log unknown field types during development so they're visible
      // in the console without silently dropping fields from the form.
      console.warn(`DynamicForm: unhandled field type "${(field as FreshdeskField).type}" for field "${field.name}"`)
      return null
  }
}

// ---------------------------------------------------------------------------
// reCAPTCHA integration
// ---------------------------------------------------------------------------

/**
 * reCAPTCHA v3 is loaded via a script tag in Base.astro when enableRecaptcha
 * is true. It attaches to window.grecaptcha — we declare it here so TypeScript
 * knows it exists at runtime without needing a full type package.
*/

declare global {
  interface Window {
    grecaptcha: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>
      ready: (callback: () => void) => void
    }
  }
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
  const [status, setStatus] = useState<FormStatus>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const confirmationRef = useRef<HTMLDivElement>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    mode: 'onSubmit',    // Validate on submit, not while typing
    reValidateMode: 'onChange', // Clear errors in real time as user fixes them
  })

  // ---------------------------------------------------------------------------
  // Fallback — shown when getFormFields failed at build time
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <div className="usa-alert usa-alert--error" role="alert">
        <div className="usa-alert__body">
          <h3 className="usa-alert__heading">This form isn't available right now.</h3>
          <p className="usa-alert__text">
            Try again later, or contact us by email if you need help right away.
          </p>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Success state — replaces the form after a successful submission
  // ---------------------------------------------------------------------------

  if (status === 'success') {
    return (
      // tabIndex={-1} allows focus to be programmatically moved here
      // after submission, per the UX spec accessibility requirement.
      <div ref={confirmationRef} tabIndex={-1}>
        <div className="usa-alert usa-alert--success" role="status">
          <div className="usa-alert__body">
            <h2 className="usa-alert__heading">Your submission was received.</h2>
            <p className="usa-alert__text">
              {/* TODO: Per-form follow-up copy — confirm with content team */}
              Check your inbox for a confirmation email with a copy of your submission.
            </p>
          </div>
        </div>

        <div className="margin-top-3">
          {/* TODO: Per-form button labels and destinations — confirm with content team */}
          <button
            type="button"
            className="usa-button usa-button--outline margin-right-2"
            onClick={() => {
              reset()
              setStatus('idle')
            }}
          >
            Submit another
          </button>
          <a className="usa-button" href="/">
            Return to home
          </a>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------

  const onSubmit = async (values: Record<string, unknown>) => {
    setStatus('submitting')
    setSubmitError(null)

    try {
      // Get reCAPTCHA token before building payload.
      // grecaptcha.ready ensures the script has fully loaded before executing.
      const recaptchaToken = await new Promise<string>((resolve, reject) => {
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(recaptchaSiteKey, {
              action: 'submit',
            })
            resolve(token)
          } catch (err) {
            reject(err)
          }
        })
      })

      const payload = {
        ...buildPayload(values, fields, formType),
        recaptcha_token: recaptchaToken,
      }

      const response = await fetch(submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Submit failed: ${response.status}`)
      }

      setStatus('success')

      // Move focus to confirmation message per UX spec accessibility requirement.
      // setTimeout defers until after React re-renders the success state.
      setTimeout(() => confirmationRef.current?.focus(), 0)
    } catch {
      setStatus('error')
      setSubmitError(
        "Your submission didn't go through. Check your connection and try again."
      )
    }
  }

  const onError = () => {
    // Validation failed — move focus to error summary per UX spec.
    setTimeout(() => errorSummaryRef.current?.focus(), 0)
  }

  // ---------------------------------------------------------------------------
  // Required field names for error summary jump links
  // ---------------------------------------------------------------------------

  const errorFields = Object.keys(errors)

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form
      className="usa-form usa-form--large"
      onSubmit={handleSubmit(onSubmit, onError)}
      noValidate // Disable native browser validation — RHF handles it
    >
      {/* Submission error banner — shown when the Lambda POST fails */}
      {status === 'error' && submitError && (
        <div className="usa-alert usa-alert--error margin-bottom-3" role="alert">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{submitError}</p>
          </div>
        </div>
      )}

      {/* Validation error summary — shown after a failed submit attempt */}
      {errorFields.length > 0 && (
        <div
          ref={errorSummaryRef}
          className="usa-alert usa-alert--error margin-bottom-3"
          role="alert"
          tabIndex={-1}
        >
          <div className="usa-alert__body">
            <h2 className="usa-alert__heading">There's a problem with your submission.</h2>
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

      {/* Dynamic fields — rendered from Freshdesk field config */}
      {fields.map((field) =>
        renderField(field, register, control, errors)
      )}

      {/* Hardcoded fields — not from Freshdesk config */}
      <ConsentField
        register={register(CONSENT_FIELD_NAME, {
          required: 'You must agree before submitting.',
        })}
        error={errors[CONSENT_FIELD_NAME] as FieldError | undefined}
      />

      <HoneypotField register={register('website')} />

      {/* Submit button */}
      <button
        type="submit"
        className="usa-button margin-top-3"
        disabled={status === 'submitting'}
        aria-disabled={status === 'submitting'}
      >
        {status === 'submitting' ? 'Submitting…' : 'Submit'}
      </button>
    </form>
  )
}