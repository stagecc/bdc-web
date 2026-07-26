import type { ReactNode } from 'react';

type Tone = 'secondary' | 'warm' | 'cool' | 'neutral';

type Props = {
  label: ReactNode;
  tone?: Tone;
  className?: string;
};

const toneClasses: Record<Tone, string> = {
  secondary: 'bg-secondary-lighter text-secondary-dark',
  warm: 'bg-accent-warm-lighter text-accent-warm-darker',
  cool: 'bg-accent-cool-lighter text-accent-cool-darker',
  neutral: 'bg-base-lightest text-base-dark',
};

export default function TagPill({
  label,
  tone = 'secondary',
  className,
}: Props) {
  return (
    <span
      className={[
        'usa-tag text-no-uppercase padding-y-05 padding-x-1',
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </span>
  );
}
