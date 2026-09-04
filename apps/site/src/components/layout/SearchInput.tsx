import Icon from '@bdc/ui-react/icon/Icon';
import type { FocusEvent, FormEvent } from 'react';

export function SearchInput() {
  const openSearchModal = () => {
    window.dispatchEvent(new CustomEvent('bdc:open-search-modal'));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    openSearchModal();
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    openSearchModal();
    event.currentTarget.blur();
  };

  return (
    <search className="padding-y-2">
      <form
        className="usa-search usa-search--small margin-0 display-flex"
        onSubmit={handleSubmit}
      >
        <label className="usa-sr-only" htmlFor="site-header-search">
          Search site
        </label>
        <input
          className="usa-input"
          id="site-header-search"
          type="search"
          name="search"
          placeholder="Search"
          readOnly
          aria-haspopup="dialog"
          onFocus={handleFocus}
        />
        <button className="usa-button" type="submit" aria-label="Open search">
          <Icon.Search
            className="usa-search__submit-icon"
            aria-hidden="true"
            size={3}
          />
        </button>
      </form>
    </search>
  );
}
