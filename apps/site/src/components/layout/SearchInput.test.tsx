import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  it('renders a search input', () => {
    render(<SearchInput />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('renders a submit button', () => {
    render(<SearchInput />);
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<SearchInput />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'heart disease');
    expect(input).toHaveValue('heart disease');
  });

  it('redirects to dug search results on submit', async () => {
    const openSpy = vi
      .spyOn(window, 'open')
      .mockImplementation(() => null);

    const user = userEvent.setup();
    render(<SearchInput />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'asthma');
    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(openSpy).toHaveBeenCalledWith('/data/explore/dug?q=asthma', '_self');

    openSpy.mockRestore();
  });
});
