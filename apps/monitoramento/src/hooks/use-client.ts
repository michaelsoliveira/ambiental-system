'use client'

import axios from 'axios';
import { useSession, signOut, getSession } from 'next-auth/react';
import { useMemo } from 'react';

const isServer = typeof window === "undefined"

const API_URL = isServer 
    ? process.env.INTERNAL_API_URL
    : process.env.NEXT_PUBLIC_API_URL

const useClient = (options?: any) => {
  const { data: session, update } = useSession();
  
  const token = session?.accessToken;

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
    
    api.interceptors.response.use(response => {
        return response
    }, async error => {
      if (error.response?.status === 401 && session?.refreshToken) {
        try {
          const refreshedTokens = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              "Authorization": `Bearer ${session.accessToken}`
            },
            body: JSON.stringify({ refreshToken: session.refreshToken }),
          }).then((res) => res.json());

          if (!refreshedTokens?.access_token) throw new Error('Refresh falhou');

          // Atualiza a session do next-auth!
          await update({
            accessToken: refreshedTokens.access_token,
            refreshToken: refreshedTokens.refresh_token ?? session.refreshToken,
          });

          // Refaz a requisição com novo token
          error.config.headers['Authorization'] = `Bearer ${refreshedTokens.access_token}`;
          return axios(error.config);
        } catch (refreshError) {
          await signOut();
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    })
          
    return api;
  }, [options, token, session?.accessToken, session?.refreshToken, update]);
};

export default useClient;