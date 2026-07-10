/**
 * getCustomObjectRecords
 *
 * Fetches all records from a Freshdesk custom object schema at build time.
 * Used for two distinct purposes:
 *
 * 1. Reference data — fetching options for form fields (e.g. ResearchCommunities,
 *    ResearchAreas, OrgContributions, PublicationStatus). These records provide
 *    the choices rendered in radio groups, checkbox groups, and dropdowns.
 *
 * 2. Display data — fetching PublicationSubmission records to render the
 *    publications list page. Records are filtered, sorted, and passed as
 *    props to the display component at build time.
 *
 * Why build time?
 *   Same reasoning as getFormFields and getCustomObjectSchema — API key stays
 *   server-side, data is baked into the page, fails fast at build rather than
 *   silently at runtime.
 *
 *   For the publications list specifically: build-time fetch means the list
 *   is static HTML until the next build. This is acceptable for a publications
 *   list that changes infrequently. If real-time updates are ever needed,
 *   this utility would need a client-side fetch variant.
 *
 * Pagination:
 *   The Freshdesk custom objects API returns records in sets of 100.
 *   When more records exist, the response includes a `links.next` token.
 *   This utility paginates automatically until all records are fetched.
 *   For large datasets (1000+ records), consider filtering server-side
 *   using the filter endpoint instead of fetching all records.
 *
 * Filtering:
 *   By default, all non-deleted records are returned. Pass a `filter`
 *   function to exclude records that shouldn't appear in the UI — for
 *   example, filtering out inactive reference data records or records
 *   missing the fields needed by the caller.
 */

import type {
  CustomObjectRecord,
  CustomObjectRecordsResponse,
} from './typesCustomObjects';

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const FRESHDESK_DOMAIN = import.meta.env.FRESHDESK_DOMAIN;
const FRESHDESK_API_KEY = import.meta.env.FRESHDESK_API_KEY;

function getAuthHeader(): string {
  // Freshdesk Basic Auth: API key as username, literal "X" as password.
  // See: https://developers.freshdesk.com/api/#authentication
  return `Basic ${btoa(`${FRESHDESK_API_KEY}:X`)}`;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

interface GetCustomObjectRecordsOptions {
  // Optional filter function applied to each record before returning.
  // Use to exclude inactive reference data or records missing required fields.
  // Example: (record) => record.data.active !== false
  filter?: (record: CustomObjectRecord) => boolean;
  // Maximum number of records to fetch. Defaults to all records.
  // Useful for display components that only need the most recent N records.
  limit?: number;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Fetches all records from a custom object schema, handling pagination
 * automatically.
 *
 * @param schemaId - The numeric ID of the custom object schema.
 *   Stored in .env as FRESHDESK_CUSTOM_OBJECT_{NAME}_SCHEMA_ID.
 * @param options - Optional filter and limit configuration.
 * @returns Array of CustomObjectRecord objects. Records include a `display_id`
 *   and a `data` object keyed by field name.
 * @throws If any page fetch fails with a non-ok response.
 */
export async function getCustomObjectRecords(
  schemaId: string | number,
  options: GetCustomObjectRecordsOptions = {},
): Promise<CustomObjectRecord[]> {
  const { filter, limit } = options;
  const allRecords: CustomObjectRecord[] = [];
  let nextMarker: string | undefined;

  // Paginate through all records using the marker-based pagination.
  // The API returns records in sets of 100. When more records exist,
  // the response includes a links.next token to fetch the next page.
  do {
    const url = new URL(
      `https://${FRESHDESK_DOMAIN}/api/v2/custom_objects/schemas/${schemaId}/records`,
    );
    if (nextMarker) {
      url.searchParams.set('marker', nextMarker);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Freshdesk API error fetching records for schema ${schemaId}: ` +
          `${response.status} ${response.statusText}`,
      );
    }

    const data: CustomObjectRecordsResponse = await response.json();

    // Apply optional filter before accumulating records
    const pageRecords = filter ? data.records.filter(filter) : data.records;

    allRecords.push(...pageRecords);

    // Check if we've hit the limit — stop paginating if so
    if (limit && allRecords.length >= limit) {
      return allRecords.slice(0, limit);
    }

    // Extract the marker for the next page from the links.next URL.
    // The API returns a full URL; we only need the marker query param.
    if (data.links?.next) {
      const nextUrl = new URL(data.links.next);
      nextMarker = nextUrl.searchParams.get('marker') ?? undefined;
    } else {
      nextMarker = undefined;
    }
  } while (nextMarker);

  return allRecords;
}
