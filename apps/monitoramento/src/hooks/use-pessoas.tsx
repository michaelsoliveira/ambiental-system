'use client';

import { useQuery } from "@tanstack/react-query";
import useClient from "./use-client";
import { usePessoasStore } from "@/stores/usePessoasStore";
  
  type Params = {
    search?: string,
    dataInicio?: string,
    dataFim?: string,
    tipoLicenca?: string,
    page?: number,
    limit?: number,
    orderBy?: string,
    order?: string
  };

export function usePessoas(params: Params) { 
  const client = useClient()
  // const setPessoas = usePessoasStore((state) => state.setPessoas);

  return useQuery({
    queryKey: ["pessoas", params],
    queryFn: async () => {
        const response = await client.get('/pessoa/list-all', { params });

        return response.data;
    }
  });
}
