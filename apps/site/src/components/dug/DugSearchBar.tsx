import Icon from '@bdc/ui-react/icon/Icon';
import type { FormEvent } from 'react';
import { useRef } from 'react';
import styles from './DugSearchBar.module.scss';

type Props = {
  id: string;
  placeholder: string;
  submitLabel: string;
  className?: string;
  action?: string;
  method?: 'get' | 'post';
  name?: string;
  value?: string;
  onChange?: (nextValue: string) => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onClear?: () => void;
  shortcutLabel?: string;
};

export default function DugSearchBar({
  id,
  placeholder,
  submitLabel,
  className,
  action,
  method = 'get',
  name = 'q',
  value,
  onChange,
  onSubmit,
  onClear,
  shortcutLabel,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isControlled = typeof value === 'string';
  const shouldShowClear = Boolean(
    isControlled && value && value.trim().length > 0 && onClear,
  );

  const handleClear = () => {
    if (!onClear) {
      return;
    }

    onClear();
    inputRef.current?.focus();
  };

  return (
    <form
      className={`usa-search usa-search--big maxw-none ${styles.searchShell} display-flex bg-base-lightest border border-base-lighter radius-pill padding-05 ${className ?? ''}`}
      action={action}
      method={method}
      onSubmit={onSubmit}
    >
      <label className="usa-sr-only" htmlFor={id}>
        Search BDC data
      </label>
      <div className="position-relative flex-1">
        <input
          ref={inputRef}
          className={`usa-input usa-search__input ${styles.searchInput} flex-1 maxw-none bg-transparent border-0 shadow-none padding-left-2`}
          id={id}
          name={name}
          type="search"
          placeholder={placeholder}
          {...(isControlled ? { value } : {})}
          onChange={
            onChange ? (event) => onChange(event.target.value) : undefined
          }
        />
        {(shouldShowClear || shortcutLabel) && (
          <div
            className={`${styles.searchAffordance} display-flex flex-align-center`}
          >
            {shouldShowClear && (
              <button
                type="button"
                className="usa-button usa-button--unstyled display-flex flex-align-center flex-justify-center margin-left-1 radius-pill padding-05 text-base"
                onClick={handleClear}
                aria-label="Clear search"
              >
                <Icon.Cancel aria-hidden />
              </button>
            )}
            {shortcutLabel && (
              <kbd className="text-base-dark bg-base-lightest border border-base-lighter radius-pill padding-x-1 font-mono-2xs line-height-sans-1">
                {shortcutLabel}
              </kbd>
            )}
          </div>
        )}
      </div>
      <button
        className={`usa-button usa-search__submit-button flex-shrink-0 radius-pill ${styles.submitButton}`}
        type="submit"
      >
        <span className="usa-search__submit-text">{submitLabel}</span>
      </button>
    </form>
  );
}
