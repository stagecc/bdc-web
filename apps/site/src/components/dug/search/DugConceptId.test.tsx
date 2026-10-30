import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DugConceptId from './DugConceptId';

describe('DugConceptId', () => {
  it('links the concept ID to its ontology record', () => {
    render(
      <DugConceptId
        id="MONDO:0005405"
        conceptAction="http://purl.obolibrary.org/obo/MONDO_0005405"
      />,
    );

    const link = screen.getByRole('link', {
      name: 'MONDO:0005405 ontology record',
    });

    expect(link).toHaveAttribute(
      'href',
      'http://purl.obolibrary.org/obo/MONDO_0005405',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the ID without a link when no ontology URL is available', () => {
    render(<DugConceptId id="MONDO:0005405" />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('MONDO:0005405').tagName).toBe('CODE');
  });
});
