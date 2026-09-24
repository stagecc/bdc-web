import IconButton from '@bdc/ui-react/button/IconButton';
import { useEffect, useRef, useState } from 'react';

type CopyStatus = 'idle' | 'copied' | 'error';

type Props = {
  copyLabel: string;
  copyText: string;
  className?: string;
  analyticsSection?: string;
};

export default function CopyToClipboard({
  copyLabel,
  copyText,
  className,
  analyticsSection,
}: Props) {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const resetStatusTimeoutRef = useRef<ReturnType<
    typeof window.setTimeout
  > | null>(null);

  useEffect(() => {
    return () => {
      if (resetStatusTimeoutRef.current !== null) {
        window.clearTimeout(resetStatusTimeoutRef.current);
      }
    };
  }, []);

  const scheduleStatusReset = () => {
    if (resetStatusTimeoutRef.current !== null) {
      window.clearTimeout(resetStatusTimeoutRef.current);
    }

    resetStatusTimeoutRef.current = window.setTimeout(() => {
      setStatus('idle');
      resetStatusTimeoutRef.current = null;
    }, 2000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setStatus('copied');
    } catch {
      setStatus('error');
    }

    scheduleStatusReset();
  };

  const statusText =
    status === 'copied' ? 'Copied' : status === 'error' ? 'Copy failed' : '';

  return (
    <div
      className={[
        'bg-base-lightest radius-lg padding-x-2 padding-y-2 display-flex flex-column',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="display-flex flex-justify-end flex-align-center">
        <output
          aria-live="polite"
          aria-atomic="true"
          className={[
            'font-sans-2xs text-bold',
            statusText && 'margin-right-2',
            status === 'copied' && 'text-green',
            status === 'error' && 'text-secondary-dark',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {statusText}
        </output>
        <IconButton
          icon="ContentCopy"
          label={copyLabel}
          tone="primary"
          onClick={handleCopy}
          data-analytics-custom-event="copy_to_clipboard_click"
          data-analytics-section={analyticsSection}
          small
        />
      </div>

      <div className="height-full">
        <p className="font-sans-sm margin-y-0">{copyText}</p>
      </div>
    </div>
  );
}
