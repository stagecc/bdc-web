import { useState } from 'react';

type Props = {
  text: string;
  id: string;
};

export default function TooltipIcon({ text, id }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="bdc-tooltip">
      <button
        type="button"
        aria-describedby={id}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="bdc-tooltip__trigger"
        aria-label="More information"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="16"
          width="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-11h2V7h-2v2z" />
        </svg>
      </button>
      {visible && (
        <span id={id} role="tooltip" className="bdc-tooltip__bubble">
          {text}
        </span>
      )}
    </span>
  );
}
