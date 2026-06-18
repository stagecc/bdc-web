/**
 * Types for the Freshdesk ticket forms API response.
 *
 * These mirror the shape returned by GET /api/v2/ticket-forms/{id}.
 * Only the fields we actually use are typed — the full API response
 * includes additional agent-facing properties we don't need.
 *
 * Freshdesk field types fall into two categories:
 *   - default_* — system fields that map to top-level ticket properties
 *     (email, subject, description, company)
 *   - custom_* — custom fields that map to the custom_fields object
 *     in the ticket payload, prefixed with cf_ in the field name
 */

export type FreshdeskFieldType =
  | 'default_requester'  // Email address — maps to top-level `email`
  | 'default_subject'    // Ticket subject — set programmatically, hidden from users
  | 'default_description'// Ticket body — maps to top-level `description`
  | 'default_company'    // Organization — maps to top-level `company`
  | 'custom_text'        // Single-line text input → <input className="usa-input">
  | 'custom_paragraph'   // Multi-line text → <textarea className="usa-textarea">
  | 'custom_date'        // Date picker → Trussworks DatePicker (USWDS JS limitation)

export interface FreshdeskField {
  id: number
  // The field's internal name. custom_* fields are prefixed with cf_
  // (e.g. cf_published_research_journal_name). This prefix is used at
  // submit time to determine whether the value goes into custom_fields
  // or as a top-level ticket property.
  name: string
  // The customer-facing label. Always use this over `label`, which is
  // the agent-facing version and may differ significantly.
  label_for_customers: string
  type: FreshdeskFieldType
  // Drives required field validation in React Hook Form.
  required_for_customers: boolean
  // Fields where this is false are excluded entirely from the rendered form.
  displayed_to_customers: boolean
  // Archived fields are excluded even if displayed_to_customers is true.
  archived: boolean
  // Optional helper text shown below the label, above the input.
  // Maps to the USWDS hint/help text pattern.
  hint_for_customers?: string
}

export interface FreshdeskFormResponse {
  id: number
  name: string
  title: string
  fields: FreshdeskField[]
}