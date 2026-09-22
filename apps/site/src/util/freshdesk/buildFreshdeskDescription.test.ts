import { describe, expect, it } from 'vitest';
import { buildFreshdeskDescription } from './buildFreshdeskDescription';
import type { FreshdeskField } from './types';

const makeField = (overrides: Partial<FreshdeskField>): FreshdeskField => ({
  id: 1,
  name: 'cf_test_field',
  label_for_customers: 'Test Field',
  type: 'custom_text',
  required_for_customers: false,
  displayed_to_customers: true,
  archived: false,
  ...overrides,
});

describe('buildFreshdeskDescription', () => {
  it('formats submitted values as html line-separated label and value pairs', () => {
    const fields = [
      makeField({
        name: 'requester',
        label_for_customers: 'Email Address',
        type: 'default_requester',
      }),
      makeField({
        name: 'ticket_type',
        label_for_customers: 'Type of Assistance Needed',
        type: 'default_ticket_type',
      }),
      makeField({
        name: 'cf_platforms',
        label_for_customers: 'Platforms affected',
        type: 'custom_dropdown',
      }),
    ];

    const description = buildFreshdeskDescription(
      {
        requester: 'user@example.com',
        ticket_type: 'Website Issue',
        cf_platforms: ['Terra', 'Seven Bridges'],
      },
      fields,
    );

    expect(description).toBe(
      'Email Address: user@example.com <br />' +
        'Type of Assistance Needed: Website Issue <br />' +
        'Platforms affected: Terra, Seven Bridges <br />',
    );
  });

  it('escapes html and preserves textarea line breaks', () => {
    const description = buildFreshdeskDescription(
      {
        cf_details: 'Line 1\nLine <2> & "quoted"',
      },
      [
        makeField({
          name: 'cf_details',
          label_for_customers: 'Details <script>',
          type: 'custom_paragraph',
        }),
      ],
    );

    expect(description).toBe(
      'Details &lt;script&gt;: Line 1<br />Line &lt;2&gt; &amp; &quot;quoted&quot; <br />',
    );
  });
});
