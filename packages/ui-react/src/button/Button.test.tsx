import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Button from './Button';

describe('Button', () => {
  it('renders a native button when href is not provided', () => {
    render(<Button type="button">Trigger action</Button>);

    const button = screen.getByRole('button', { name: 'Trigger action' });
    expect(button.tagName).toBe('BUTTON');
  });

  it('renders an anchor when href is provided', () => {
    render(<Button href="/about">Go to About</Button>);

    const link = screen.getByRole('link', { name: 'Go to About' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/about');
  });

  it('applies USWDS variant classes in link mode', () => {
    render(
      <Button href="/join" secondary outline size="big">
        Join now
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'Join now' });
    expect(link).toHaveClass('usa-button');
    expect(link).toHaveClass('usa-button--secondary');
    expect(link).toHaveClass('usa-button--outline');
    expect(link).toHaveClass('usa-button--big');
  });
});
