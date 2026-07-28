import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import DugSearchBar from './DugSearchBar';

describe('DugSearchBar', () => {
  it('renders search input and submit button', () => {
    render(
      <DugSearchBar
        id="dug-search"
        placeholder="Search BDC data"
        submitLabel="Search"
      />,
    );

    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('calls onChange with latest input value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <DugSearchBar
        id="dug-search"
        placeholder="Search BDC data"
        submitLabel="Search"
        onChange={onChange}
      />,
    );

    await user.type(screen.getByRole('searchbox'), 'asthma');

    expect(onChange).toHaveBeenLastCalledWith('asthma');
  });

  it('submits through onSubmit handler', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());

    render(
      <DugSearchBar
        id="dug-search"
        placeholder="Search BDC data"
        submitLabel="Search"
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('supports static form mode used by homepage search', () => {
    render(
      <DugSearchBar
        id="home-discover-search"
        placeholder="Search BDC data"
        submitLabel="Search BDC data"
        action="/data/explore/dug"
        method="get"
      />,
    );

    const form = screen.getByRole('search');
    const input = screen.getByRole('searchbox');

    expect(form).toHaveAttribute('method', 'get');
    expect((form as HTMLFormElement).action).toContain('/data/explore/dug');
    expect(input).toHaveAttribute('name', 'q');
  });

  it('shows shortcut label and clear button when query has text', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();

    render(
      <DugSearchBar
        id="dug-search"
        placeholder="Search BDC data"
        submitLabel="Search"
        value="asthma"
        onChange={() => {}}
        onClear={onClear}
        shortcutLabel="Ctrl K"
      />,
    );

    expect(screen.getByText('Ctrl K')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /clear search/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
