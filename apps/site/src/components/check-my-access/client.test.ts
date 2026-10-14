import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trackCheckMyAccessCsvExport } from './analytics';
import { bootCheckMyAccess } from './client';
import { downloadProjectsCsv } from './lib';

vi.mock('./analytics', () => ({
  trackCheckMyAccessCsvExport: vi.fn(),
}));

vi.mock('./lib', async () => {
  const actual = await vi.importActual<typeof import('./lib')>('./lib');

  return {
    ...actual,
    downloadProjectsCsv: vi.fn(),
  };
});

const trackCheckMyAccessCsvExportMock = vi.mocked(trackCheckMyAccessCsvExport);
const downloadProjectsCsvMock = vi.mocked(downloadProjectsCsv);

const renderCheckMyAccessFixture = () => {
  document.body.innerHTML = `
    <section data-check-my-access aria-labelledby="check-my-access">
      <h4 data-check-my-access-title tabindex="-1">Check My Access</h4>
      <span data-check-my-access-preview-badge hidden>Preview Mode</span>
      <div data-check-my-access-content aria-live="polite" aria-busy="false"></div>
    </section>
  `;
};

describe('bootCheckMyAccess', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    document.body.innerHTML = '';
    delete window.__bdcCheckMyAccessBooted;
    trackCheckMyAccessCsvExportMock.mockReset();
    downloadProjectsCsvMock.mockReset();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete window.__bdcCheckMyAccessBooted;
  });

  it('tracks analytics when downloading the Check My Access CSV export', () => {
    window.history.replaceState(
      {},
      '',
      '/data/explore/?check-my-access-preview=projects&check-my-access-preview-name=Taylor%20Lee&check-my-access-preview-projects=TOPMed,HeartShare',
    );
    renderCheckMyAccessFixture();

    bootCheckMyAccess();

    fireEvent.click(
      screen.getByRole('button', { name: 'Download Project List' }),
    );

    expect(trackCheckMyAccessCsvExportMock).toHaveBeenCalledWith(2);
    expect(downloadProjectsCsvMock).toHaveBeenCalledWith('Taylor Lee', [
      'TOPMed',
      'HeartShare',
    ]);
  });
});
