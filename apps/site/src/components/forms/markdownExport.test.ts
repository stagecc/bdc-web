import { describe, expect, it } from 'vitest';
import type { FreshdeskField } from '../../util/freshdesk/types';
import type { CustomObjectField } from '../../util/freshdesk/typesCustomObjects';
import { customObjectFormFields, ticketFormFields } from './markdownExport';

const field = (overrides: Partial<FreshdeskField>): FreshdeskField => ({
  id: 1,
  name: 'email',
  label_for_customers: 'Email',
  type: 'default_requester',
  required_for_customers: true,
  displayed_to_customers: true,
  archived: false,
  ...overrides,
});

describe('form export metadata', () => {
  it('exports conditional fields once, with their triggering values', () => {
    const child = field({
      id: 2,
      name: 'description',
      type: 'default_description',
      label_for_customers: 'Description',
    });
    const parent = field({
      name: 'ticket_type',
      type: 'default_ticket_type',
      label_for_customers: 'Assistance',
      choices: [
        {
          id: 10,
          value: 'Other',
          label: 'Other assistance',
          position: 1,
          parent_choice_id: 0,
          choices: [],
        },
      ],
      sections: [
        {
          id: 20,
          label: '',
          parent_ticket_field_id: 1,
          choice_ids: [10],
          ticket_field_ids: [2],
          fields: [child],
        },
      ],
    });
    const result = ticketFormFields([
      parent,
      child,
      field({ id: 3, type: 'default_subject' }),
      field({ id: 4, archived: true }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].choices).toEqual(['Other']);
    expect(result[0].sections).toEqual([
      {
        choices: ['Other'],
        fields: [
          {
            name: 'description',
            label: 'Description',
            type: 'default_description',
            required: true,
          },
        ],
      },
    ]);
  });

  it('uses custom-object multi-select options and excludes generated identifiers', () => {
    const base: CustomObjectField = {
      id: '1',
      name: 'research_area',
      label: 'Research area',
      type: 'MULTI_SELECT',
      position: 1,
      required: false,
      visible: true,
      deleted: false,
      placeholder: null,
      field_options: {},
      choices: [],
      options: ['Heart', 'Lung'],
    };
    expect(
      customObjectFormFields([base, { ...base, type: 'PRIMARY' }]),
    ).toEqual([
      {
        name: 'research_area',
        label: 'Research area',
        type: 'MULTI_SELECT',
        required: false,
        choices: ['Heart', 'Lung'],
      },
    ]);
  });
});
