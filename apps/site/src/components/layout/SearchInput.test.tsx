import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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
});
