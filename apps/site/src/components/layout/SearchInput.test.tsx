import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  it('renders a search bar trigger', () => {
    render(<SearchInput />);
    expect(
      screen.getByRole('searchbox', { name: /search site/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /open search/i }),
    ).toBeInTheDocument();
  });

  it('requests the search modal when the input is focused', () => {
    const listener = vi.fn();
    window.addEventListener('bdc:open-search-modal', listener);

    render(<SearchInput />);
    fireEvent.focus(screen.getByRole('searchbox', { name: /search site/i }));

    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener('bdc:open-search-modal', listener);
  });

  it('requests the search modal when the search button is clicked', () => {
    const listener = vi.fn();
    window.addEventListener('bdc:open-search-modal', listener);

    render(<SearchInput />);
    fireEvent.click(screen.getByRole('button', { name: /open search/i }));

    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener('bdc:open-search-modal', listener);
  });
});
