import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRecaptchaToken } from './getRecaptchaToken';

// Mock the global grecaptcha object that would normally be injected
// by the reCAPTCHA script loaded in Base.astro.
const mockExecute = vi.fn();
const mockReady = vi.fn((callback: () => void) => callback());

beforeEach(() => {
  vi.resetAllMocks();
  mockReady.mockImplementation((callback: () => void) => callback());

  Object.defineProperty(window, 'grecaptcha', {
    value: { execute: mockExecute, ready: mockReady },
    writable: true,
  });
});

describe('getRecaptchaToken', () => {
  it('returns a token on success', async () => {
    mockExecute.mockResolvedValue('mock-token-123');

    const token = await getRecaptchaToken('site-key');
    expect(token).toBe('mock-token-123');
  });

  it('calls execute with the provided site key and default action', async () => {
    mockExecute.mockResolvedValue('mock-token');

    await getRecaptchaToken('my-site-key');
    expect(mockExecute).toHaveBeenCalledWith('my-site-key', {
      action: 'submit',
    });
  });

  it('calls execute with a custom action when provided', async () => {
    mockExecute.mockResolvedValue('mock-token');

    await getRecaptchaToken('my-site-key', 'cloud_credits_submit');
    expect(mockExecute).toHaveBeenCalledWith('my-site-key', {
      action: 'cloud_credits_submit',
    });
  });

  it('calls grecaptcha.ready before executing', async () => {
    mockExecute.mockResolvedValue('mock-token');

    await getRecaptchaToken('site-key');
    expect(mockReady).toHaveBeenCalledTimes(1);
  });

  it('rejects if execute throws', async () => {
    mockExecute.mockRejectedValue(new Error('reCAPTCHA failed'));

    await expect(getRecaptchaToken('site-key')).rejects.toThrow(
      'reCAPTCHA failed',
    );
  });
});
