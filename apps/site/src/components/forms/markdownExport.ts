import { getSectionFieldIds } from '../../util/freshdesk/getFormFields';
import type { FreshdeskField } from '../../util/freshdesk/types';
import type { CustomObjectField } from '../../util/freshdesk/typesCustomObjects';

export interface MarkdownFormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  choices?: string[];
  sections?: { choices: string[]; fields: MarkdownFormField[] }[];
}

export function ticketFormFields(
  fields: FreshdeskField[],
): MarkdownFormField[] {
  const sectionIds = getSectionFieldIds(fields);
  return fields
    .filter(
      (field) =>
        !sectionIds.has(field.id) &&
        field.displayed_to_customers &&
        !field.archived &&
        field.type !== 'default_subject',
    )
    .map((field) => ({
      name: field.name,
      label: field.label_for_customers,
      type: field.type,
      required: field.required_for_customers,
      ...(field.choices?.length
        ? { choices: field.choices.map((choice) => choice.value) }
        : {}),
      ...(field.sections?.length
        ? {
            sections: field.sections.map((section) => ({
              choices: (field.choices ?? [])
                .filter((choice) => section.choice_ids.includes(choice.id))
                .map((choice) => choice.value),
              fields: ticketFormFields(section.fields),
            })),
          }
        : {}),
    }));
}

export function customObjectFormFields(
  fields: CustomObjectField[],
): MarkdownFormField[] {
  return fields
    .filter(
      (field) =>
        field.visible &&
        !field.deleted &&
        field.type !== 'PRIMARY' &&
        field.type !== 'RELATIONSHIP',
    )
    .map((field) => ({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      ...(['DROPDOWN', 'MULTI_SELECT'].includes(field.type)
        ? {
            choices:
              field.type === 'MULTI_SELECT'
                ? (field.options ?? field.choices.map((choice) => choice.value))
                : field.choices.map((choice) => choice.value),
          }
        : {}),
    }));
}

export const emailSignupFields: MarkdownFormField[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: false,
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
  },
];
