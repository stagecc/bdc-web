/**
 * Tooltip.tsx
 *
 * Inline tooltip component wrapping Trussworks' Tooltip with a clean
 * info icon trigger. Works in both React (.tsx) and MDX contexts.
 *
 * In MDX, use client:visible to enable hover behavior:
 *   cloud credits <Tooltip text="Cloud computing resources..." client:visible />
 *
 * In React:
 *   <Tooltip text="This work was not part of a Research Community." />
 *
 * Uses Trussworks Tooltip for positioning and viewport clipping behavior.
 * Trigger styles are reset via org-tooltip__trigger to remove usa-button defaults.
 *
 * Props:
 *   text     — Tooltip content shown on hover/focus.
 *   position — Tooltip position relative to trigger. Defaults to 'top'.
 */

import Icon from '@components/Icon';
import { Tooltip as TrussTooltip } from '@trussworks/react-uswds';

interface Props {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ text, position = 'top' }: Props) {
  return (
    <TrussTooltip
      label={text}
      position={position}
      className="bdc-tooltip__trigger"
      aria-label={text}
    >
      <Icon name="info_outline" size={3} />
    </TrussTooltip>
  );
}
