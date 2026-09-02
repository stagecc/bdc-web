import IconButton from '@bdc/ui-react/button/IconButton';

export function SearchInput() {
  const openSearchModal = () => {
    window.dispatchEvent(new CustomEvent('bdc:open-search-modal'));
  };

  return (
    <div className="padding-y-2">
      <IconButton
        tone="primary"
        icon="Search"
        label="Open search"
        onClick={openSearchModal}
      />
    </div>
  );
}
