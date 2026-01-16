'use client';

import { refreshSession } from '@/lib/refresh-session';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

const EXPIRATION_THRESHOLD = 60 * 1000; // 1 minuto antes de expirar

export function useAutoRefreshToken() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.accessToken || !session?.expiresIn) return;
    
    const refreshTime = session.expiresIn * 1000 - Date.now() - EXPIRATION_THRESHOLD;
    
    if (refreshTime <= 0) {
      console.warn('Token já está expirado ou prestes a expirar, forçando refresh.');
      refreshToken();
      return;
    }

    // const timeout = setTimeout(() => {
    //   refreshToken();
    // }, refreshTime);

    async function refreshToken() {
      try {
        console.log('Auto refreshing token...');
        const refreshed = await refreshSession(session?.refreshToken!);

        console.log('Token refreshed successfully!', refreshed);
      } catch (error) {
        console.error('Failed to refresh token silently', error);
      }
    }

    // return () => clearTimeout(timeout); // Limpamos caso o componente desmonte
  }, [session]);
}
