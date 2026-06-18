/**
 * getFormFields
 *
 * Fetches form field configuration from the Freshdesk ticket forms API
 * at build time (called from Astro page frontmatter, never client-side).
 *
 * Why build time?
 *   - Keeps the Freshdesk API key server-side only — never exposed to the browser
 *   - Bakes field config into the page as props — no client fetch, no loading flicker
 *   - Fails fast at build if the API is unreachable, rather than silently at runtime
 *
 * The caller (Astro frontmatter) is responsible for catching errors and passing
 * an error prop to DynamicForm so it can render the fallback UI instead of
 * a broken or empty form.
 */

import type { FreshdeskField, FreshdeskFormResponse } from './types'

// These are injected at build time via Astro/Vite's env system.
// In Astro, environment variables are accessed via import.meta.env,
// not process.env. Variables must be defined in .env at the repo root.
const FRESHDESK_DOMAIN = import.meta.env.FRESHDESK_DOMAIN
const FRESHDESK_API_KEY = import.meta.env.FRESHDESK_API_KEY

export async function getFormFields(formId: string): Promise<FreshdeskField[]> {
  // Freshdesk uses HTTP Basic auth where the API key is the username
  // and the password is literally the string "X" — this is their convention,
  // not a placeholder. See: https://developers.freshdesk.com/api/#authentication
  const credentials = btoa(`${FRESHDESK_API_KEY}:X`)

  const response = await fetch(
    `https://${FRESHDESK_DOMAIN}/api/v2/ticket-forms/${formId}`,
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(
      `Freshdesk API error fetching form ${formId}: ${response.status} ${response.statusText}`
    )
  }

  const form: FreshdeskFormResponse = await response.json()

  // Filter to only the fields a customer should see.
  // - displayed_to_customers: false — agent-only fields, never shown in the form
  // - archived: true — retired fields that may still exist in the API response
  //
  // Note: default_subject is displayed_to_customers: true in Freshdesk but is
  // handled as a hidden field in DynamicForm — it's set programmatically via
  // the formType prop and never rendered as a visible input.
  return form.fields.filter(
    (field) => field.displayed_to_customers && !field.archived
  )
}