'use client'

import useClient from './use-client'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'

export function useUnidades() { 
  const client = useClient()
  const { data: session } = useSession()

  return useQuery({
    queryKey: ["get-unidades"],
    queryFn: async () => {

      const { data } = await client.get('/unidade', {
        params: {
          orderBy: 'pessoa.pessoaJuridica.nome_fantasia',
          order: 'asc'
        }
      });
      
      const { unidades, error, message } = data
      if (error) {
        console.log(message)
      }
      return unidades;
    },
    // enabled: !!params.unidade_id,
  });
}
