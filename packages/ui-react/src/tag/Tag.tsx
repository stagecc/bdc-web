import type { ReactNode } from 'react';

type Tone = 'secondary' | 'warm' | 'cool' | 'neutral';

type Props = {
  label: ReactNode;
  tone?: Tone;
  className?: string;
};

const toneClasses: Record<Tone, string> = {
  secondary: 'bg-secondary-lighter text-secondary-darker',
  warm: 'bg-accent-warm-lighter text-accent-warm-darker',
  cool: 'bg-accent-cool-lighter text-base-darkest',
  neutral: 'bg-base-lightest text-base-dark',
};

export default function Tag({ label, tone = 'secondary', className }: Props) {
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
