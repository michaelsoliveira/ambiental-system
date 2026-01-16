"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { downloadChart, formatLabel } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { AlertCircle, DownloadIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAnoStore } from "@/stores/useAnoStore";

// const fetchData = async () => {
//   const result = await fetchAPI("/dashboard/ocorrencia-tipos-totais");
//   const { totals, error } = result.data as any
//   return totals
// };

const CustomXAxisTick = (props: any) => {
    const { x, y, angle, payload } = props;
    const lines = formatLabel(payload.value);
  
    return (
      <g transform={`translate(${x},${y}) rotate(${angle})`}>
        <text fontSize={11} fontWeight='bold' textAnchor="end" fill="#333">
          {lines.map((line, index) => (
            <tspan key={index} x={0} dy={index * 14}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  };

export function DashboardTiposOcorrencias() {
    const [isClient, setIsClient] = useState<boolean>(false);
    const { client } = useAuthContext()
    const { anoAtivo } = useAnoStore();
    const chartRef = useRef<HTMLDivElement>(null);

    const fetchData = useCallback(async () => {
        const { data: { totals, error } } = await client.get(`/dashboard/ocorrencia-tipos-totais`)
        return totals
    }, [client])

    const downloadChartBarra = () => downloadChart({
      chartRef, 
      title: "Ocorrências por Tipo", 
      description: "Gráfico das ocorrências agrupadas por tipo"
    })

    useEffect(() => {
        setIsClient(true);
    }, []);
  
    const { data, isLoading, error } = useQuery({
        queryKey: ["ocorrencia-tipos-totais", anoAtivo],
        queryFn: () => fetchData(),
        // enabled: !!token,
        staleTime: 1000 * 5,
        refetchInterval: 1000 * 60,
        refetchOnWindowFocus: true
    });

    if (!isClient) {
        return null
    }
    
    const chartData = data?.map((d: any) => {
      return { sequencia: d.sequencia, name: d.tipo, value: d.total }
    });
    
  return (
    <Card>
      <div className='relative inline-block w-full'>
        <div
          ref={chartRef}
        >
          <CardHeader>
            <CardTitle>Ocorrências por Tipo</CardTitle>
            <CardDescription>Gráfico das ocorrências agrupadas por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <Skeleton className="h-24 w-full" />}
            {error && (
              <div className="text-red-500 flex items-center">
                  <AlertCircle className="mr-2" /> Erro ao carregar dados
              </div>
            )}
            { data && (
              <ResponsiveContainer width="100%" height={375}>
              <BarChart 
                // layout="vertical"
                data={chartData} 
                margin={{bottom: 55, top: 5, left: 5}}
              >
              <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  interval={0} 
                  height={50}
                //   tickFormatter={(label) => formatLabel(label)}
                  tick={<CustomXAxisTick />}
                />
                <YAxis 
                    interval={1} 
                    tick={{fontSize: 12}}
                />
                <Tooltip />
                <Bar dataKey="value" fill="#87CEEB" />
              </BarChart>
            </ResponsiveContainer>
            ) }
          </CardContent>
        </div>
        <Button
          onClick={downloadChartBarra}
          className='absolute top-2 right-2 cursor-pointer'
          variant='outline'
        >
          <DownloadIcon className='h-4 w-4' />
        </Button>
      </div>
    </Card>
  );
}
