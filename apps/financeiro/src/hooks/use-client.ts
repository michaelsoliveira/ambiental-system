'use client'

import axios from 'axios';
import { deleteCookie,getCookie, setCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import { useCallback,useMemo } from 'react';

const isServer = typeof window === "undefined"

const API_URL = isServer 
    ? process.env.INTERNAL_API_URL
    : process.env.NEXT_PUBLIC_API_URL

const useClient = (options?: any) => {
  const router = useRouter();
  
  // Lê o token do cookie
  const token = getCookie('token') as string | undefined;
  const refreshToken = getCookie('refresh_token') as string | undefined;

  const handleLogout = useCallback(() => {
    deleteCookie('token');
    deleteCookie('refresh_token');
    router.push('/auth/sign-in'); // Ajuste a rota conforme necessário
  }, [router]);

  return useMemo(() => {
    const api = axios.create({
      baseURL: API_URL,
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        ...(options?.headers ? options.headers : {})
      }
    })

    api.interceptors.request.use(request => {
      request.maxContentLength = Infinity;
      request.maxBodyLength = Infinity;
      return request;
    })
    
    api.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401 && refreshToken) {
          try {
            const refreshedTokens = await fetch('/api/auth/refresh-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ refreshToken }),
            }).then((res) => res.json());

            if (!refreshedTokens?.access_token) {
              throw new Error('Refresh falhou');
            }

            // Atualiza os cookies com os novos tokens
            setCookie('token', refreshedTokens.access_token, {
              maxAge: 60 * 60 * 24 * 7, // 7 dias
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production'
            });

            if (refreshedTokens.refresh_token) {
              setCookie('refresh_token', refreshedTokens.refresh_token, {
                maxAge: 60 * 60 * 24 * 30, // 30 dias
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production'
              });
            }

            // Refaz a requisição com o novo token
            error.config.headers['Authorization'] = `Bearer ${refreshedTokens.access_token}`;
            return axios(error.config);
          } catch (refreshError) {
            handleLogout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    )
          
    return api;
  }, [options, token, refreshToken, handleLogout]);
};

export default useClient;