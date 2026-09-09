import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { DugCollection } from '../shared/collection';
import DugCollectionPanel from './DugCollectionPanel';

const collection: DugCollection = {
  concepts: [],
  studies: [],
  variables: [],
};

describe('DugCollectionPanel', () => {
  it('toggles inline help text from the help icon button', async () => {
    const user = userEvent.setup();

    render(
      <DugCollectionPanel
        collection={collection}
        collectionCount={0}
        onDownloadCollection={vi.fn()}
        onRemoveCollectionItem={vi.fn()}
        onClearCollection={vi.fn()}
        onCheckoutCollection={vi.fn()}
      />,
    );

    expect(screen.queryByText('How this works')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /show collection help/i }),
    );
    expect(screen.getByText('How this works')).toBeInTheDocument();
    expect(screen.getByText(/then choose/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /hide collection help/i }),
    );
    expect(screen.queryByText('How this works')).not.toBeInTheDocument();
  });
});
