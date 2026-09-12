import Icon from '@bdc/ui-react/icon/Icon';
import styles from './SearchInput.module.scss';

export function SearchInput() {
  const openSearchModal = () => {
    window.dispatchEvent(new CustomEvent('bdc:open-search-modal'));
  };

  return (
    <search className="padding-y-2">
      <button
        type="button"
        className={`usa-search usa-search--small margin-0 display-flex flex-align-center bg-base-lightest border border-base-lighter radius-pill width-card padding-y-05 padding-x-1 ${styles.searchShell}`}
        onClick={openSearchModal}
        aria-haspopup="dialog"
      >
        <div
          className={`flex-1 usa-search__input bg-transparent border-0 display-flex flex-align-center shadow-none padding-left-2 text-base text-no-wrap ${styles.searchInput}`}
        >
          Search site
        </div>
        <Icon.Search
          className="usa-search__submit-icon flex-align-self-center"
          aria-hidden="true"
          color="gray"
        />
      </button>
    </search>
  );
}
