import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useDugDetailPanel } from './useDugDetailPanel';

const fetchStudiesMock = vi.fn();

vi.mock('../api', () => ({
  fetchStudies: (...args: unknown[]) => fetchStudiesMock(...args),
}));

const SAMPLE_CONCEPT = {
  id: 'MONDO:0004979',
  name: 'Asthma',
  description: 'A chronic respiratory disease.',
  type: 'DISEASE',
  identifiers: [],
};

function TestHarness() {
  const {
    selectedResult,
    isDetailClosing,
    openDetailPanel,
    closeDetailPanel,
    handleDetailPanelExited,
    modalPanelRef,
    closeButtonRef,
  } = useDugDetailPanel('asthma');

  return (
    <div>
      <button
        type="button"
        data-testid="open-trigger"
        onClick={() => openDetailPanel(SAMPLE_CONCEPT)}
      >
        Open
      </button>
      {selectedResult && (
        <div
          ref={modalPanelRef}
          data-testid="modal-panel"
          data-closing={isDetailClosing ? 'true' : 'false'}
          onAnimationEnd={handleDetailPanelExited}
        >
          <button ref={closeButtonRef} type="button" onClick={closeDetailPanel}>
            Close
          </button>
          <button type="button">Secondary</button>
          <p>{selectedResult.name}</p>
        </div>
      )}
    </div>
  );
}

describe('useDugDetailPanel', () => {
  it('fetches related studies when a concept is selected', async () => {
    fetchStudiesMock.mockResolvedValueOnce([]);

    render(<TestHarness />);
    fireEvent.click(screen.getByTestId('open-trigger'));

    await waitFor(() => {
      expect(fetchStudiesMock).toHaveBeenCalledWith(
        'MONDO:0004979',
        'asthma',
        expect.any(AbortSignal),
      );
    });
  });

  it('moves focus to close button and restores focus after Escape closes', async () => {
    vi.useFakeTimers();
    fetchStudiesMock.mockResolvedValueOnce([]);

    render(<TestHarness />);

    const trigger = screen.getByTestId('open-trigger');
    trigger.focus();
    fireEvent.click(trigger);

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();

    vi.useRealTimers();

    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    const modalPanel = screen.queryByTestId('modal-panel');
    if (modalPanel) {
      act(() => {
        fireEvent.animationEnd(modalPanel);
      });
    }

    await waitFor(() => {
      expect(screen.queryByTestId('modal-panel')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it('traps tab focus within the modal panel', async () => {
    vi.useFakeTimers();
    fetchStudiesMock.mockResolvedValueOnce([]);

    render(<TestHarness />);
    fireEvent.click(screen.getByTestId('open-trigger'));

    act(() => {
      vi.runAllTimers();
    });

    const closeButton = screen.getByRole('button', { name: 'Close' });
    const secondaryButton = screen.getByRole('button', { name: 'Secondary' });

    secondaryButton.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(closeButton).toHaveFocus();

    closeButton.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(secondaryButton).toHaveFocus();

    vi.useRealTimers();
  });
});
