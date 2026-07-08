/**
 * renderCustomObjectField
 *
 * Maps a Freshdesk custom object field config object to the appropriate
 * USWDS form component. Parallel to renderField.tsx but for custom object
 * schemas rather than ticket forms.
 *
 * Key differences from renderField:
 *   - Field types are uppercase (TEXT, PARAGRAPH, DATE, etc.) not custom_default
 *   - No default_subject equivalent — PRIMARY fields are excluded by getCustomObjectSchema
 *   - No dynamic sections — custom objects don't support them natively
 *   - MULTI_SELECT → MultiSelectCheckbox (checkbox group)
 *
 * Field type → component mapping:
 *   TEXT         → TextField
 *   PARAGRAPH    → TextareaField
 *   DATE         → DateField (Trussworks DatePicker)
 *   DROPDOWN     → SelectField
 *   CHECKBOX     → CheckboxField (single boolean)
 *   MULTI_SELECT → MultiSelectCheckbox
 *   NUMBER       → TextField (type="number")
 *   DECIMAL      → TextField (type="decimal")
 *   PRIMARY      → null (never rendered — set programmatically)
 *
 * Adding a new field type:
 *   1. Add the type to CustomObjectFieldType in typesCustomObjects.ts
 *   2. Add a case to the switch below
 *   3. Create a new field component in fields/ if needed
 */

import type { FieldError, useForm } from 'react-hook-form';
import type { CustomObjectField } from '../../../util/freshdesk/typesCustomObjects';
import CheckboxField from '../fields/CheckboxField';
import DateField from '../fields/DateField';
import MultiSelectCheckbox from '../fields/MultiSelectCheckbox';
import SelectField from '../fields/SelectField';
import TextareaField from '../fields/TextareaField';
import TextField from '../fields/TextField';
import { fieldErrors } from '../util/errorMessages';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RHFRegister = ReturnType<
  typeof useForm<Record<string, unknown>>
>['register'];
type RHFControl = ReturnType<
  typeof useForm<Record<string, unknown>>
>['control'];
type RHFErrors = ReturnType<
  typeof useForm<Record<string, unknown>>
>['formState']['errors'];

// ---------------------------------------------------------------------------
// renderCustomObjectField
// ---------------------------------------------------------------------------

export function renderCustomObjectField(
  field: CustomObjectField,
  register: RHFRegister,
  control: RHFControl,
  errors: RHFErrors,
) {
  // Props shared across all field components.
  // Custom objects use `hint` directly (not `hint_for_customers`)
  // and `label` as the customer-facing label (no separate label_for_customers).
  const commonProps = {
    name: field.name,
    label: field.label,
    hint: field.hint ?? undefined,
    required: field.required,
    error: errors[field.name] as FieldError | undefined,
  };

  switch (field.type) {
    case 'PRIMARY':
      // PRIMARY fields are always set programmatically by buildCustomObjectPayload.
      // They should never be rendered — getCustomObjectSchema filters them out,
      // but guard here just in case.
      return null;

    case 'TEXT':
      return (
        <TextField
          key={field.name}
          {...commonProps}
          register={register(field.name, {
            required: field.required
              ? fieldErrors.text.required(field.label)
              : false,
          })}
        />
      );

    case 'PARAGRAPH':
      return (
        <TextareaField
          key={field.name}
          {...commonProps}
          register={register(field.name, {
            required: field.required
              ? fieldErrors.textarea.required(field.label)
              : false,
          })}
        />
      );

    case 'DATE':
      return <DateField key={field.name} {...commonProps} control={control} />;

    case 'DROPDOWN':
      // For DROPDOWN fields, choices come from the schema response directly
      // (unlike ticket form dropdowns which require a separate per-field fetch).
      // Map choices to the shape SelectField expects.
      if (!field.choices?.length) {
        console.warn(
          `renderCustomObjectField: dropdown field "${field.name}" has no choices`,
        );
      }
      return (
        <SelectField
          key={field.name}
          {...commonProps}
          choices={field.choices?.map((c) => ({
            id: c.id,
            // Custom object choices use value for both display and submission
            // (no separate label field). Fall back to empty string if missing.
            label: c.value,
            value: c.value,
            position: c.position,
            parent_choice_id: 0,
            choices: [],
          }))}
          register={register(field.name, {
            required: field.required ? fieldErrors.select.required : false,
          })}
        />
      );

    case 'CHECKBOX':
      return (
        <CheckboxField
          key={field.name}
          {...commonProps}
          register={register(field.name, {
            required: field.required ? fieldErrors.checkbox.required : false,
          })}
        />
      );

    case 'MULTI_SELECT': {
      // Options come from field.options if populated by the Astro page,
      // or fall back to inline choices defined on the schema directly.
      const multiOptions =
        field.options ?? field.choices?.map((c) => c.value) ?? [];

      if (!multiOptions.length) {
        console.warn(
          `renderCustomObjectField: MULTI_SELECT field "${field.name}" has no options`,
        );
      }
      return (
        <MultiSelectCheckbox
          key={field.name}
          {...commonProps}
          options={multiOptions}
          register={register(field.name, {
            required: field.required ? fieldErrors.checkbox.required : false,
          })}
        />
      );
    }

    case 'NUMBER':
      return (
        <TextField
          key={field.name}
          {...commonProps}
          inputType="number"
          register={register(field.name, {
            required: field.required
              ? fieldErrors.number.required(field.label)
              : false,
            pattern: {
              value: /^-?\d+$/,
              message: fieldErrors.number.pattern,
            },
          })}
        />
      );

    case 'DECIMAL':
      return (
        <TextField
          key={field.name}
          {...commonProps}
          inputType="decimal"
          register={register(field.name, {
            required: field.required
              ? fieldErrors.decimal.required(field.label)
              : false,
            pattern: {
              value: /^-?\d*\.?\d+$/,
              message: fieldErrors.decimal.pattern,
            },
          })}
        />
      );

    default:
      console.warn(
        `renderCustomObjectField: unhandled field type "${(field as CustomObjectField).type}" ` +
          `for field "${field.name}"`,
      );
      return null;
  }
}
