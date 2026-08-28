import Button from '@bdc/ui-react/button/Button';
import Icon from '@bdc/ui-react/icon/Icon';

export function SearchInput() {
  const openSearchModal = () => {
    window.dispatchEvent(new CustomEvent('bdc:open-search-modal'));
  };

  return (
    <div className="padding-y-2">
      <Button
        type="button"
        outline
        className="width-full text-no-wrap margin-0 display-flex flex-align-center flex-justify-center"
        aria-label="Open search"
        onClick={openSearchModal}
      >
        <Icon.Search aria-hidden="true" className="margin-right-1" />
        Search Site
      </Button>
    </div>
  );
}
