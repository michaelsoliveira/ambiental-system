'use client';

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import useClient from "./use-client";
  
  type Params = {
    search: string,
    dataInicio?: string,
    dataFim?: string,
    tipoLicenca?: string,
    page?: number,
    limit?: number,
    orderBy?: string,
    order?: string
  };

export function useLicencas(params: Params) { 
  const client = useClient()

  return useQuery({
    queryKey: ["empresas-licencas", params],
    queryFn: async () => {
        const response = await client.get('/licenca/list-all', { params });

        return response.data;
    },
  });
}

export function useLicencaFindById(licencaId: string) {
  const client = useClient()

  return useQuery({
    queryKey: ["get-licenca", licencaId],
    queryFn: async () => {
      const response = await client.get(`/licenca/find-one/${licencaId}`)

      return response.data;
    }
  })
}
