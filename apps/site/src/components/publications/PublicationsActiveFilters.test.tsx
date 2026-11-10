import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PublicationsActiveFilters from './PublicationsActiveFilters';

describe('PublicationsActiveFilters', () => {
  it('uses a specific accessible name for the search pill', async () => {
    const user = userEvent.setup();
    const updateSearch = vi.fn();

    render(
      <PublicationsActiveFilters
        search="asthma"
        filters={{
          year: [],
          researchCommunity: [],
          researchArea: [],
          bdcContribution: [],
        }}
        hasActiveFilters={false}
        updateSearch={updateSearch}
        toggleFilter={vi.fn()}
        clearAll={vi.fn()}
      />,
    );

    expect(screen.getByText('Search: "asthma"')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Remove search term: asthma' }),
    );

    expect(updateSearch).toHaveBeenCalledWith('');
  });
});
