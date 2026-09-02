import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  it('renders an open search button', () => {
    render(<SearchInput />);
    const trigger = screen.getByRole('button', { name: /open search/i });
    expect(trigger).toBeInTheDocument();
  });

  it('requests the search modal when clicked', () => {
    const listener = vi.fn();
    window.addEventListener('bdc:open-search-modal', listener);

    render(<SearchInput />);
    fireEvent.click(screen.getByRole('button', { name: /open search/i }));

    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener('bdc:open-search-modal', listener);
  });
});
