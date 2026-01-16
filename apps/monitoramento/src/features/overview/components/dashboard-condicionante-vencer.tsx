'use client'

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { useAuthContext } from '@/context/AuthContext';
// import OcorrenciaLatest from '@/features/licenca/components/ocorrencia-latest';
import { fetchAPI } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { useCallback } from 'react';
import { CondicionantesAVencerSkeleton } from './condicionante-vencer-skeleton';
import CondicionantesAVencer from './condicionantes-a-vencer';
import { usePessoaStore } from '@/stores/usePessoaStore';

export function DashboardCondicionanteAVencer() {
  const pessoaSelecionada = usePessoaStore((state) => state.pessoaSelecionada)
  const { client } = useAuthContext()
  const fetchCondicionantes = useCallback(async () => {
    const queryParam = pessoaSelecionada?.id ? `?pessoaId=${pessoaSelecionada.id}` : '';
      const { data } = await client.get(`/dashboard/get-condicionantes-vencer${queryParam}`)
      return data
  }, [client, pessoaSelecionada?.id])

  const { data, isLoading, error, refetch } = useQuery({
      queryKey: ["condicionantes-vencer", pessoaSelecionada?.id ?? null],
      queryFn: () => fetchCondicionantes(),
      staleTime: 500 * 5,
      refetchInterval: 6000 * 10,
      refetchOnWindowFocus: true
  });
  return (
    <>
      {isLoading ? <CondicionantesAVencerSkeleton /> : (
        <Card className='h-full'>
          <CardHeader>
            <div>
              <CardTitle>Condicionantes a vencer</CardTitle>
              <CardDescription>Condicionantes próximas do vencimento...</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
            <div className="text-red-500 flex items-center">
                <AlertCircle className="mr-2" /> Erro ao carregar dados
            </div>
            )}
            <div className='space-y-8'>
              <CondicionantesAVencer data={data}/>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
