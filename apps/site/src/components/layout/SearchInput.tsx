import { Search as USWDSSearchInput } from '@trussworks/react-uswds';

export function SearchInput() {
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search');
    if (query) {
      window.location.href = `/search?q=${encodeURIComponent(query.toString())}`;
    }
  };

  return (
    <div className="padding-y-2">
      <USWDSSearchInput
        size="small"
        placeholder="Search..."
        onSubmit={handleSearch}
      />
    </div>
  );
}
