import { Tooltip as TrussTooltip } from '@trussworks/react-uswds';
import type { ReactNode } from 'react';

type Props = {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
};

export default function Tooltip({
  text,
  position = 'top',
  className,
  ariaLabel,
  children,
}: Props) {
  return (
    <TrussTooltip
      label={text}
      position={position}
      className={className}
      aria-label={ariaLabel ?? text}
    >
      {children}
    </TrussTooltip>
  );
}
