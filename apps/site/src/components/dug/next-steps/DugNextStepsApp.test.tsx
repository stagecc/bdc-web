import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type DugCollection,
  trackDugNextStepsSelectStep,
  useDugCollection,
} from '../shared';
import DugNextStepsApp from './DugNextStepsApp';

vi.mock('../shared', () => ({
  DugCollectionContents: () => null,
  useDugCollection: vi.fn(),
  trackDugNextStepsSelectStep: vi.fn(),
}));

const mockUseDugCollection = vi.mocked(useDugCollection);
const mockTrackDugNextStepsSelectStep = vi.mocked(trackDugNextStepsSelectStep);

const COLLECTION_WITH_ITEMS: DugCollection = {
  concepts: [
    {
      id: 'C1',
      name: 'Concept one',
      description: 'Concept description',
      type: 'concept',
    },
  ],
  studies: [{ id: 'S1', name: 'Study one', url: '/study', source: 'dbGaP' }],
  variables: [
    {
      id: 'V1',
      name: 'Variable one',
      description: 'Variable description',
      url: '/variable',
    },
  ],
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('DugNextStepsApp', () => {
  it('shows collection-empty state and keeps download disabled', () => {
    mockUseDugCollection.mockReturnValue({
      collection: { concepts: [], studies: [], variables: [] },
      collectionCount: 0,
    } as ReturnType<typeof useDugCollection>);

    render(<DugNextStepsApp />);

    expect(screen.getByText(/0 selected items? from Dug/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Download collection' }),
    ).toBeDisabled();
  });

  it('filters relevant IDs by selected decision card', async () => {
    const user = userEvent.setup();

    mockUseDugCollection.mockReturnValue({
      collection: COLLECTION_WITH_ITEMS,
      collectionCount: 3,
    } as ReturnType<typeof useDugCollection>);

    render(<DugNextStepsApp />);

    expect(screen.getByText('S1')).toBeInTheDocument();
    expect(screen.queryByText('C1')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Build a cohort/i }));

    expect(screen.getByText('C1')).toBeInTheDocument();
    expect(screen.getByText('V1')).toBeInTheDocument();
  });

  it('tracks decision card selection', async () => {
    const user = userEvent.setup();

    mockUseDugCollection.mockReturnValue({
      collection: COLLECTION_WITH_ITEMS,
      collectionCount: 3,
    } as ReturnType<typeof useDugCollection>);

    render(<DugNextStepsApp />);

    await user.click(screen.getByRole('button', { name: /Begin analyzing/i }));

    expect(mockTrackDugNextStepsSelectStep).toHaveBeenCalledWith({
      stepTitle: 'Begin analyzing',
      stepIndex: 2,
      location: 'dug-next-steps',
      conceptCount: 1,
      studyCount: 1,
      variableCount: 1,
    });
  });

  it('communicates selected card state with aria-pressed', async () => {
    const user = userEvent.setup();

    mockUseDugCollection.mockReturnValue({
      collection: COLLECTION_WITH_ITEMS,
      collectionCount: 3,
    } as ReturnType<typeof useDugCollection>);

    render(<DugNextStepsApp />);

    const checkDataAccessButton = screen.getByRole('button', {
      name: /Check data access/i,
    });
    const buildCohortButton = screen.getByRole('button', {
      name: /Build a cohort/i,
    });

    expect(checkDataAccessButton).toHaveAttribute('aria-pressed', 'true');
    expect(buildCohortButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(buildCohortButton);

    expect(checkDataAccessButton).toHaveAttribute('aria-pressed', 'false');
    expect(buildCohortButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('enables download when collection has saved items', () => {
    mockUseDugCollection.mockReturnValue({
      collection: COLLECTION_WITH_ITEMS,
      collectionCount: 3,
    } as ReturnType<typeof useDugCollection>);

    render(<DugNextStepsApp />);

    expect(
      screen.getByRole('button', { name: 'Download collection' }),
    ).toBeEnabled();
  });
});
