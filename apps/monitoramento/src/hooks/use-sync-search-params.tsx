'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export const useSyncSearchParamsWithLocalStorage = (keys: string[]) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Só executa no client
    if (typeof window === 'undefined') return;

    const newParams = new URLSearchParams(searchParams.toString());
    let changed = false;

    keys.forEach((key) => {
      const currentValue = searchParams.get(key);
      const localValue = localStorage.getItem(key);

      if (!currentValue && localValue) {
        newParams.set(key, localValue);
        changed = true;
      }
    });

    if (changed) {
      router.replace(`?${newParams.toString()}`);
    }
  }, [router, searchParams, keys]);
};
