/**
 * errorMessages
 *
 * Single source of truth for all user-facing error and status strings
 * across all forms on the site. Centralizing these here ensures:
 *
 *   - Consistent wording across all field types and forms
 *   - Easy content review and updates without hunting through component files
 *   - A clear handoff point for the content team to review copy
 *
 * Usage:
 *   import { fieldErrors, formErrors, formMessages } from '../copy/errorMessages'
 *
 *   Static message:
 *   required: fieldErrors.email.required
 *
 *   Dynamic message (takes a label):
 *   required: fieldErrors.text.required(field.label_for_customers)
 *
 * Tone guidelines (per UX spec):
 *   - Say what to do, not just what went wrong
 *   - "Please" is fine in moderation
 *   - Skip filler words: "Oops", "Uh oh", "Something doesn't look right"
 *   - Keep it short — a phrase, not a sentence, where possible
 *
 * Open questions:
 *   - Per-form button labels are still defined in the form components
 */

const SUPPORT_EMAIL = 'biodatacatalyst@nhlbi.nih.gov';

export interface FormMessages {
  unavailableHeading: string;
  unavailableText: string;
  successHeading: string;
  successText: string;
  submitError: string;
  alreadyExistsError?: string;
}

const genericUnavailableText = `Try again later or email ${SUPPORT_EMAIL} if you need help right away.`;

const genericUnavailableHeading = "This form isn't available right now.";

// ---------------------------------------------------------------------------
// Field-level validation errors
// Appear directly below a field when validation fails,
// and in the error summary at the top of the form.
// ---------------------------------------------------------------------------

export const fieldErrors = {
  // Email — default_requester
  email: {
    required: 'Please enter a valid email address (e.g. name@example.com).',
    pattern: 'Please enter a valid email address (e.g. name@example.com).',
  },

  // Single-line text — custom_text, default_company
  // Takes the customer-facing field label for context.
  text: {
    required: (label: string) => `Please enter your ${label.toLowerCase()}.`,
  },

  // Multi-line text — custom_paragraph, default_description
  // Takes the customer-facing field label for context.
  textarea: {
    required: (label: string) => `Please enter your ${label.toLowerCase()}.`,
    tooLong: (max: number) =>
      `Your response is too long — please shorten it to ${max} characters or fewer.`,
    tooShort: (min: number) =>
      `Your response needs to be at least ${min} characters.`,
  },

  // Dropdown — custom_dropdown, default_ticket_type
  select: {
    required: 'Please make a selection.',
  },

  // Single boolean checkbox — custom_checkbox
  checkbox: {
    required: 'Please make a selection.',
  },

  // Date picker — custom_date
  date: {
    required: 'Please enter a date.',
    invalid: 'Please enter a valid date.',
  },

  // Numeric input — custom_number
  number: {
    required: (label: string) =>
      `Please enter a number for ${label.toLowerCase()}.`,
    pattern: 'Please enter a whole number.',
  },

  // Decimal input — custom_decimal
  decimal: {
    required: (label: string) =>
      `Please enter a number for ${label.toLowerCase()}.`,
    pattern: 'Please enter a valid number.',
  },

  // URL input — custom_url
  url: {
    required: (label: string) =>
      `Please enter a URL for ${label.toLowerCase()}.`,
    pattern: 'Please enter a valid URL starting with http:// or https://',
  },

  // Consent checkbox — hardcoded in ConsentField, not from Freshdesk config
  consent: {
    required: 'You must agree before submitting.',
  },
};

// ---------------------------------------------------------------------------
// Form-level errors
// Appear as banners or summaries at the top of the form.
// ---------------------------------------------------------------------------

export const formErrors = {
  // Validation error summary — shown when submit is attempted with invalid fields.
  // Focus moves here programmatically so screen reader users hear it immediately.
  summary: {
    heading: "There's a problem with your submission.",
  },

  // Submission errors — shown when the Lambda POST fails.
  // The form stays as-is and the user's answers are preserved.
  submission: {
    // General connection or server error
    general:
      "Your submission didn't go through. Check your connection and try again. " +
      `If the problem continues, contact us at ${SUPPORT_EMAIL}.`,
    // Request timed out
    timeout:
      'This is taking longer than expected. Check your connection and try again.',
    // reCAPTCHA verification failed
    recaptchaFailed:
      "We weren't able to verify your submission. " +
      `If you are having trouble, contact us at ${SUPPORT_EMAIL}.`,
    // reCAPTCHA script failed to load
    recaptchaUnavailable:
      "A required security check couldn't load. " +
      `Refresh the page and try again. If the problem continues, contact us at ${SUPPORT_EMAIL}.`,
  },
};

export const formMessages = {
  getHelp: {
    unavailableHeading: genericUnavailableHeading,
    unavailableText: genericUnavailableText,
    successHeading: 'Request received',
    successText:
      'Thank you for contacting BDC support. Your request has been submitted.',
    submitError: `Your support request didn't go through, so please try again or email ${SUPPORT_EMAIL}.`,
  },
  cloudCredits: {
    unavailableHeading: genericUnavailableHeading,
    unavailableText: genericUnavailableText,
    successHeading: 'Request received',
    successText:
      'Thank you for contacting BDC about usage costs and cloud credits. Your cloud credits request has been submitted.',
    submitError: `Your cloud credits request didn't go through, so please try again or email ${SUPPORT_EMAIL}.`,
  },
  publishedResearch: {
    unavailableHeading: genericUnavailableHeading,
    unavailableText: genericUnavailableText,
    successHeading: 'Submission received',
    successText:
      'Thank you for submitting your publication to BDC. We will review it and follow up if needed.',
    submitError: `Your publication submission didn't go through, so please try again or email ${SUPPORT_EMAIL}.`,
  },
  contactBdc: {
    unavailableHeading: genericUnavailableHeading,
    unavailableText: genericUnavailableText,
    successHeading: 'Message received',
    successText:
      'Thank you for contacting BDC. We will review your message and follow up if needed.',
    submitError: `Your message didn't go through, so please try again or email ${SUPPORT_EMAIL}.`,
  },
  emailSignup: {
    unavailableHeading: genericUnavailableHeading,
    unavailableText: genericUnavailableText,
    successHeading: 'Subscription received',
    successText:
      'Thanks for subscribing! You’ll receive monthly BDC newsletters and other announcements.',
    submitError: 'Signup is temporarily unavailable. Please try again later.',
    alreadyExistsError: `An account may already exist for that email address. Email ${SUPPORT_EMAIL} to have an activation email resent.`,
  },
} satisfies Record<string, FormMessages>;
