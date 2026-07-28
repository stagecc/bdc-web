import { useCallback, useEffect, useState } from 'react';

function readParam(key: string): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return new URLSearchParams(window.location.search).get(key) ?? '';
}

export function useQueryParam(
  key: string,
): [string, (nextValue: string) => void] {
  const [value, setValue] = useState<string>('');

  useEffect(() => {
    const sync = () => setValue(readParam(key));

    sync();
    window.addEventListener('popstate', sync);

    return () => window.removeEventListener('popstate', sync);
  }, [key]);

  const updateValue = useCallback(
    (nextValue: string) => {
      if (typeof window === 'undefined') {
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const trimmed = nextValue.trim();

      if (trimmed) {
        params.set(key, trimmed);
      } else {
        params.delete(key);
      }

      const nextSearch = params.toString();
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;
      window.history.pushState(null, '', nextUrl);
      setValue(trimmed);
    },
    [key],
  );

  return [value, updateValue];
}
