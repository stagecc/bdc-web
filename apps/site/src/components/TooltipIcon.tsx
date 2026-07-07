import { useState } from 'react';

type Props = {
  text: string;
  id: string;
};

export default function TooltipIcon({ text, id }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        verticalAlign: 'middle',
        marginLeft: '4px',
        color: '#494848',
      }}
    >
      <button
        type="button"
        aria-describedby={id}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'help',
          display: 'inline-flex',
          alignItems: 'center',
          color: 'inherit',
        }}
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
        <span
          id={id}
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-8px)',
            background: '#1b1b1b',
            color: '#ffffff',
            padding: '0.5rem 0.75rem',
            borderRadius: '4px',
            fontSize: '0.8rem',
            lineHeight: '1.3',
            width: 'max-content',
            maxWidth: '240px',
            textAlign: 'left',
            zIndex: 10,
            pointerEvents: 'none',
            whiteSpace: 'normal',
          }}
        >
          {text}
          <span
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              border: '6px solid transparent',
              borderTopColor: '#1b1b1b',
            }}
          />
        </span>
      )}
    </span>
  );
}
