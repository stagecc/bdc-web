/**
 * renderField
 *
 * Maps a Freshdesk field config object to the appropriate USWDS form component.
 * Extracted from DynamicForm to keep the main component focused on form state,
 * submission logic, and layout.
 *
 * This is a pure mapping function — it has no dependency on component state,
 * with one exception: dropdown fields with dynamic sections receive an
 * onSectionChange callback and the current sectionSelections map so they
 * can render their conditional fields inline.
 *
 * Field type → component mapping:
 *   default_requester    → TextField (type="email")
 *   default_subject      → null (set programmatically via formType, never rendered)
 *   default_company      → TextField
 *   default_description  → TextareaField
 *   default_ticket_type  → SelectField (+ inline section fields if has_section)
 *   custom_text          → TextField
 *   custom_paragraph     → TextareaField
 *   custom_date          → DateField (Trussworks — see DateField.tsx for why)
 *   custom_dropdown      → SelectField (+ inline section fields if has_section)
 *   custom_checkbox      → CheckboxField
 *   custom_number        → TextField (type="number")
 *   custom_decimal       → TextField (type="decimal")
 *   custom_url           → TextField (type="url")
 *
 * Dynamic sections:
 *   When a dropdown field has sections, selecting a choice may reveal additional
 *   fields. These section fields are rendered inline immediately below the dropdown,
 *   wrapped in a div with a fade-in animation. When a section is hidden, its fields
 *   are unregistered from RHF via useFormContext so their values are excluded
 *   from the payload.
 *
 * Adding a new field type:
 *   1. Add the type to FreshdeskFieldType in types.ts
 *   2. Add a case to the switch below
 *   3. Create a new field component in fields/ if needed
 *   4. Update getFormFields if the type requires choices or section data
 */

import { useEffect } from 'react';
import type { FieldError } from 'react-hook-form';
import { type useForm, useFormContext } from 'react-hook-form';
import type {
  FreshdeskField,
  FreshdeskSection,
} from '../../../util/freshdesk/types';
import CheckboxField from '../fields/CheckboxField';
import DateField from '../fields/DateField';
import SelectField from '../fields/SelectField';
import TextareaField from '../fields/TextareaField';
import TextField from '../fields/TextField';
import { fieldErrors } from '../util/errorMessages';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// RHF types inferred from useForm to stay in sync with DynamicForm
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
// SectionFields component
// ---------------------------------------------------------------------------

/**
 * Renders the fields belonging to a single dynamic section.
 *
 * Extracted as a component (not just a function) so we can use useEffect
 * to unregister fields from RHF when the section becomes hidden. This ensures
 * hidden section fields are excluded from the payload on submission.
 *
 * unregister is accessed via useFormContext rather than passed as a prop —
 * DynamicForm wraps all fields in FormProvider, so the context is always
 * available here without needing it threaded through the call chain.
 *
 * Animation:
 *   A simple CSS fade-in with a slight upward translate gives the section
 *   a clean reveal without being distracting. The animation respects
 *   prefers-reduced-motion via a media query in global.scss.
 *   Class name: 'dynamic-section-fields' — add styles there.
 */
interface SectionFieldsProps {
  section: FreshdeskSection;
  isVisible: boolean;
  register: RHFRegister;
  control: RHFControl;
  errors: RHFErrors;
  sectionSelections: Record<string, string>;
  onSectionChange: (fieldName: string, value: string) => void;
}

function SectionFields({
  section,
  isVisible,
  register,
  control,
  errors,
  sectionSelections,
  onSectionChange,
}: SectionFieldsProps) {
  // Access unregister from form context — available because DynamicForm
  // wraps everything in FormProvider. No need to pass it as a prop.
  const { unregister } = useFormContext<Record<string, unknown>>();

  // When this section becomes hidden, unregister its fields from RHF.
  // keepValue: false clears the values so stale data isn't submitted
  // if the user switches choices and then reselects this section later.
  useEffect(() => {
    if (!isVisible) {
      const fieldNames = section.fields.map((f) => f.name) as [
        string,
        ...string[],
      ];
      if (fieldNames.length > 0) {
        unregister(fieldNames, { keepValue: false });
      }
    }
  }, [isVisible, section.fields, unregister]);

  if (!isVisible) return null;

  return (
    // The 'dynamic-section-fields' class is the animation hook.
    // Add the keyframe and prefers-reduced-motion styles in global.scss:
    //
    //   @keyframes section-reveal {
    //     from { opacity: 0; transform: translateY(-4px); }
    //     to   { opacity: 1; transform: translateY(0); }
    //   }
    //   .dynamic-section-fields {
    //     animation: section-reveal 150ms ease-out;
    //   }
    //   @media (prefers-reduced-motion: reduce) {
    //     .dynamic-section-fields { animation: none; }
    //   }
    <div className="dynamic-section-fields">
      {section.fields.map((sectionField) =>
        // Recursively call renderField for each section field.
        // Section fields can themselves be dropdowns with sections,
        // though deeply nested sections are rare in practice.
        renderField(
          sectionField,
          register,
          control,
          errors,
          sectionSelections,
          onSectionChange,
        ),
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// renderField
// ---------------------------------------------------------------------------

export function renderField(
  field: FreshdeskField,
  register: RHFRegister,
  control: RHFControl,
  errors: RHFErrors,
  // Tracks the currently selected value for each dropdown that has sections.
  // Keyed by field name. Used to determine which sections are visible.
  sectionSelections: Record<string, string>,
  // Callback fired when a section-controlling dropdown changes value.
  // DynamicForm updates sectionSelections in response, triggering a re-render
  // that shows/hides the appropriate section fields.
  onSectionChange: (fieldName: string, value: string) => void,
) {
  // Props shared across all field components.
  // label_for_customers is always used over label — it's the customer-facing
  // version and may differ significantly from the agent-facing label.
  const commonProps = {
    name: field.name,
    label: field.label_for_customers,
    hint: field.hint_for_customers,
    required: field.required_for_customers,
    // Cast needed because RHF's errors[key] returns a wider Merge<> type
    // that includes nested object fields — our flat fields always produce
    // plain FieldError objects, so the cast is safe here.
    error: errors[field.name] as FieldError | undefined,
  };

  switch (field.type) {
    case 'default_requester':
      return (
        <TextField
          key={field.name}
          {...commonProps}
          inputType="email"
          register={register(field.name, {
            required: field.required_for_customers
              ? fieldErrors.email.required
              : false,
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: fieldErrors.email.pattern,
            },
          })}
        />
      );

    case 'default_subject':
      // Subject is always set programmatically via formType in buildPayload.
      // It should never be rendered as a visible field, even if
      // displayed_to_customers is true in Freshdesk.
      return null;

    case 'custom_text':
    case 'default_company':
      return (
        <TextField
          key={field.name}
          {...commonProps}
          register={register(field.name, {
            required: field.required_for_customers
              ? fieldErrors.text.required(field.label_for_customers)
              : false,
          })}
        />
      );

    case 'custom_paragraph':
    case 'default_description':
      return (
        <TextareaField
          key={field.name}
          {...commonProps}
          register={register(field.name, {
            required: field.required_for_customers
              ? fieldErrors.textarea.required(field.label_for_customers)
              : false,
          })}
        />
      );

    case 'custom_dropdown':
    case 'default_ticket_type': {
      // Choices are fetched at build time by getFormFields via the per-field
      // endpoint. If choices are missing here, getFormFields didn't enrich
      // this field correctly — log a warning so it's visible in dev.
      if (!field.choices?.length) {
        console.warn(
          `renderField: dropdown field "${field.name}" has no choices — ` +
            `was getFormFields enriched correctly?`,
        );
      }

      // The currently selected value for this dropdown.
      // Used to determine which sections (if any) should be visible.
      const selectedValue = sectionSelections[field.name] ?? '';

      return (
        <div key={field.name}>
          <SelectField
            {...commonProps}
            choices={field.choices}
            register={register(field.name, {
              required: field.required_for_customers
                ? fieldErrors.select.required
                : false,
            })}
            // Only pass onSectionChange if this dropdown actually has sections.
            // Avoids unnecessary state updates for plain dropdowns.
            onSectionChange={
              field.sections?.length
                ? (value) => onSectionChange(field.name, value)
                : undefined
            }
          />

          {/* Render dynamic sections inline below the dropdown.
              Each section is only visible when the selected choice ID
              matches one of the section's choice_ids.

              Note: We match on choice ID, but the dropdown value is a string.
              We find the matching choice object to get its ID for comparison. */}
          {field.sections?.map((section) => {
            // Find the choice object whose value matches the current selection
            const matchingChoice = field.choices?.find(
              (c) => c.value === selectedValue,
            );
            const isVisible = matchingChoice
              ? section.choice_ids.includes(matchingChoice.id)
              : false;

            return (
              <SectionFields
                key={section.id}
                section={section}
                isVisible={isVisible}
                register={register}
                control={control}
                errors={errors}
                sectionSelections={sectionSelections}
                onSectionChange={onSectionChange}
              />
            );
          })}
        </div>
      );
    }

    case 'custom_checkbox':
      return (
        <CheckboxField
          key={field.name}
          {...commonProps}
          register={register(field.name, {
            required: field.required_for_customers
              ? fieldErrors.checkbox.required
              : false,
          })}
        />
      );

    case 'custom_number':
      return (
        <TextField
          key={field.name}
          {...commonProps}
          inputType="number"
          register={register(field.name, {
            required: field.required_for_customers
              ? fieldErrors.number.required(field.label_for_customers)
              : false,
            pattern: {
              value: /^-?\d+$/,
              message: fieldErrors.number.pattern,
            },
          })}
        />
      );

    case 'custom_decimal':
      return (
        <TextField
          key={field.name}
          {...commonProps}
          inputType="decimal"
          register={register(field.name, {
            required: field.required_for_customers
              ? fieldErrors.decimal.required(field.label_for_customers)
              : false,
            pattern: {
              value: /^-?\d*\.?\d+$/,
              message: fieldErrors.decimal.pattern,
            },
          })}
        />
      );

    case 'custom_url':
      return (
        <TextField
          key={field.name}
          {...commonProps}
          inputType="url"
          register={register(field.name, {
            required: field.required_for_customers
              ? fieldErrors.url.required(field.label_for_customers)
              : false,
            pattern: {
              value: /^https?:\/\/.+/,
              message: fieldErrors.url.pattern,
            },
          })}
        />
      );

    case 'custom_date':
      return <DateField key={field.name} {...commonProps} control={control} />;

    default:
      // Log unhandled field types in development so they're immediately visible
      // rather than silently dropping fields from the rendered form.
      // If you see this warning, add the type to FreshdeskFieldType in types.ts
      // and add a case above.
      console.warn(
        `renderField: unhandled field type "${(field as FreshdeskField).type}" ` +
          `for field "${field.name}"`,
      );
      return null;
  }
}
