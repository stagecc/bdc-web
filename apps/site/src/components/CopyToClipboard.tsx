import IconButton from '@bdc/ui-react/button/IconButton';
import Card from '@bdc/ui-react/card/Card';
import { useState } from 'react';

type CopyStatus = 'idle' | 'copied' | 'error';

type Props = {
  eyebrow: string;
  title: string;
  copyLabel: string;
  copyText: string;
};

export default function CopyToClipboard({
  eyebrow,
  title,
  copyLabel,
  copyText,
}: Props) {
  const [status, setStatus] = useState<CopyStatus>('idle');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setStatus('copied');
    } catch {
      setStatus('error');
    }

    window.setTimeout(() => setStatus('idle'), 2000);
  };

  return (
    <Card
      as="section"
      variant="overview"
      className="height-full display-flex flex-column"
    >
      <div className="display-flex flex-justify flex-align-start">
        <div>
          <p className="text-uppercase text-bold text-ls-2 font-sans-2xs margin-top-0 margin-bottom-1 text-primary-darker">
            {eyebrow}
          </p>
          <div className="margin-0 font-heading-sm text-bold text-primary-dark">
            {title}
          </div>
        </div>

        <div className="display-flex flex-align-center">
          <span
            className={[
              'font-sans-2xs text-bold margin-right-2',
              status === 'error' ? 'text-secondary-dark' : 'text-green',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {status === 'copied'
              ? 'Copied'
              : status === 'error'
                ? 'Copy failed'
                : ''}
          </span>
          <IconButton
            icon="ContentCopy"
            label={copyLabel}
            tone="primary"
            onClick={handleCopy}
            small
          />
        </div>
      </div>

      <div className="bg-base-lightest radius-lg padding-x-2 margin-top-1 height-full">
        <p className="font-sans-sm">{copyText}</p>
      </div>
    </Card>
  );
}
