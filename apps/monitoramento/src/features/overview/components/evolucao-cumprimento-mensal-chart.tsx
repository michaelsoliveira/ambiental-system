'use client';

import { DownloadIcon } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/context/AuthContext';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { downloadChart, drawRoundedRect } from '@/lib/utils';
import { usePessoaStore } from '@/stores/usePessoaStore';

export function EvolucaoCumprimentoMensalChart() {
  const pessoaSelecionada = usePessoaStore((state) => state.pessoaSelecionada)
  const chartCompRef = useRef<HTMLDivElement>(null);
  const { client } = useAuthContext()
  const { data, isLoading, isError } = useQuery({
    queryKey: ["evolucao-cumprimento-mensal", pessoaSelecionada?.id ?? null],
    queryFn: async () => {
      const queryParam = pessoaSelecionada?.id ? `?pessoaId=${pessoaSelecionada.id}` : '';
      const response = await client.get(`/dashboard/evolucao-cumprimento-mensal${queryParam}`)
      const data = await response.data
      return data
    },
    refetchOnWindowFocus: true,
    staleTime: 6000 * 10
  });

  if (isLoading) return <p>Carregando...</p>;
  if (isError) return <p className="text-red-500">Erro ao carregar os dados.</p>;

  // Processa os dados para o gráfico
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const anoAtual = new Date().getFullYear();
  const anoAnterior = anoAtual - 1;

  const downloadChartArea = () => downloadChart({
    chartRef: chartCompRef, 
    title: `Comparação de Ocorrências (${anoAnterior} x ${anoAtual})`, 
    description: "Exibe a relação de ocorrências do ano anterior com o ano atual"}
  )

  const dadosProcessados = meses.map((mes, index) => {
    const dadosAtual = data?.find((d: any) => Number(d.mes) === index + 1 && Number(d.ano) === anoAtual) || { cumprido: 0 };
    const dadosAnterior = data?.find((d: any) => Number(d.mes) === index + 1 && Number(d.ano) === anoAnterior) || { cumprido: 0 };
    return {
      mes,
      [`${anoAnterior}`]: Number(dadosAnterior.cumprido),
      [`${anoAtual}`]: Number(dadosAtual.cumprido),
    };
  });

const chartConfig = {
  [`${anoAnterior}`]: {
    label: anoAnterior.toString(),
    color: 'var(--chart-1)'
  },
  [`${anoAtual}`]: {
    label: anoAtual.toString(),
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig;

  return (
    <Card>
      <div className='relative inline-block w-full'>
        <div
          ref={chartCompRef}
          id='chart-comp'
        >
      <CardHeader>
        <CardTitle>Comparação de Condicionantes cumpridas ({anoAnterior} x {anoAtual})</CardTitle>
        <CardDescription>
          Exibe a relação de condicionantes cumpridas do ano atual com o ano anterior
        </CardDescription>
      </CardHeader>
      <CardContent>
            <ChartContainer
              config={chartConfig}
              className='min-h-[350px] w-full'
            >
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart
                data={dadosProcessados}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorAnterior" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="mes" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Area type="monotone" dataKey={`${anoAnterior}`} stroke="#8884d8" fill="url(#colorAnterior)" />
                <Area type="monotone" dataKey={`${anoAtual}`} stroke="#82ca9d" fill="url(#colorAtual)" />
                <Tooltip />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </div>
        <Button
          onClick={downloadChartArea}
          className='absolute top-2 right-2 cursor-pointer'
          variant='outline'
        >
          <DownloadIcon className='h-4 w-4' />
        </Button>
      </div>
    </Card>
  );
}
