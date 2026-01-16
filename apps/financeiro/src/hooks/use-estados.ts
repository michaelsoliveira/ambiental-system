import { useState, useEffect } from 'react';;
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useClient from './use-client';
import { api } from '@/http/api-client';
import { queryClient } from '@/lib/react-query';

export function useEstados(params = {}) {
  return useQuery({
    queryKey: ['estados', params],
    queryFn: async () => {
        const res = api.get('estados', { 
        searchParams: params
      })
      const data = await res.json()

      return data
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false, 
  })
}

export function useMunicipiosByEstado(onSuccess?: (municipios: any[]) => void) {
  return useMutation({
    mutationFn: async (estadoId?: string) => {
        if (!estadoId) return;
        const response = api.get(`estados/${estadoId}/municipios`);
        const data = await response.json()
        
        return data;
    },
    onSuccess: (municipios: any) => {
      if (onSuccess) onSuccess(municipios);
      queryClient.invalidateQueries({ queryKey: ['municipios-estado'] });
    },
    onError: (error: any) => {
      console.error("Erro ao carregar municípios:", error);
    }
  });
}
