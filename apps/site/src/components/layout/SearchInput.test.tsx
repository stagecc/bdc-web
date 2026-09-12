import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  it('renders a search dialog trigger button', () => {
    render(<SearchInput />);
    expect(
      screen.getByRole('button', { name: /search site/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('requests the search modal when the trigger is clicked', () => {
    const listener = vi.fn();
    window.addEventListener('bdc:open-search-modal', listener);

    render(<SearchInput />);
    fireEvent.click(screen.getByRole('button', { name: /search site/i }));

    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener('bdc:open-search-modal', listener);
  });
});
