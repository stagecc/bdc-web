/**
 * HoneypotField
 *
 * An invisible field included in every form as a bot trap.
 *
 * How it works:
 *   - Hidden from sighted users via CSS (not display:none or hidden attribute —
 *     those are detectable by bots and may cause them to skip the field)
 *   - Bots that auto-fill all form fields will fill this in
 *   - If the field has any value on submit, the Lambda proxy silently discards
 *     the submission and returns a fake success response
 *   - Real users never see it, never fill it, and never know it's there
 *
 * Implementation note:
 *   - aria-hidden removes it from the accessibility tree so screen readers skip it
 *   - tabIndex={-1} prevents keyboard users from accidentally landing on it
 *   - autocomplete="off" discourages browser autofill from populating it
 *   - The field name "website" is intentionally generic — a common honeypot convention
 *
 * Per the UX spec: "The bot sees a success message and doesn't know it was caught."
 * That behavior is handled in the Lambda proxy, not here.
 */

import type { UseFormRegister } from 'react-hook-form';

interface HoneypotFieldProps {
  register: ReturnType<UseFormRegister<Record<string, unknown>>>;
}

// Visually hidden but not display:none — keeps it in the DOM flow
// so it looks like a real field to bots scanning the page.
const hiddenStyle: React.CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
};

export default function HoneypotField({ register }: HoneypotFieldProps) {
  return (
    <div style={hiddenStyle} aria-hidden="true">
      <label htmlFor="website">Website</label>
      <input
        id="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        {...register}
      />
    </div>
  );
}
