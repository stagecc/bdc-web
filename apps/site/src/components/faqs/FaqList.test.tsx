import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import FaqList from './FaqList';

vi.mock('@bdc/ui-react/accordion/Accordion', () => ({
  default: ({
    items,
  }: {
    items: Array<{ id: string; title: string; content: ReactNode }>;
  }) => (
    <div>
      {items.map((item) => (
        <section key={item.id}>
          <h2>{item.title}</h2>
          {item.content}
        </section>
      ))}
    </div>
  ),
}));

describe('FaqList', () => {
  it('keeps safe anchor markup after sanitizing faq HTML', () => {
    render(
      <FaqList
        items={[
          {
            id: 'faq-1',
            title: 'How do I get help?',
            description:
              '<p>Read the <a href="https://example.org/help">help guide</a>.</p><script>alert(1)</script>',
          },
        ]}
      />,
    );

    const link = screen.getByRole('link', { name: 'help guide' });

    expect(link).toHaveAttribute('href', 'https://example.org/help');
    expect(document.body.innerHTML).not.toContain('<script>');
  });
});
