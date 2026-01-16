'use client';


import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import React, { ReactNode, useTransition } from 'react';
import { OptionType } from '@/components/select-searchable';
import { CondicionanteType } from 'types';

interface DataTableSearchProps {
  dataInicio: string;
  dataFim: string;
  condicionantes: Array<CondicionanteType>
  condicionante: string;
  status: string;
  setStatus: (
    value: string | ((old: string) => string | null) | null,
    options?: Options | undefined
  ) => Promise<URLSearchParams>;
  setCondicionante: (
    value: string | ((old: string) => string | null) | null,
    options?: Options | undefined
  ) => Promise<URLSearchParams>;
  setDataInicio: (
    value: string | ((old: string) => string | null) | null,
    options?: Options | undefined
  ) => Promise<URLSearchParams>;
  setDataFim: (
    value: string | ((old: string) => string | null) | null,
    options?: Options | undefined
  ) => Promise<URLSearchParams>;
  children: ReactNode;
  setPage: <Shallow>(
    value: number | ((old: number) => number | null) | null,
    options?: Options | undefined
  ) => Promise<URLSearchParams>;
}

export function LicencaCondicionanteDataTableSearch({
  dataInicio,
  dataFim,
  condicionantes,
  condicionante,
  status,
  setCondicionante,
  setStatus,
  setDataInicio,
  setDataFim,
  setPage,
  children
}: DataTableSearchProps) {
  const [isLoading, startTransition] = useTransition();

  const handleStatus = async (value: string) => {
    setStatus(value, { startTransition });
    setPage(1);
  };

    const handleDataInicio = async (value: string) => {
      setDataInicio(value, { startTransition });
      setPage(1);
    };
  
    const handleDataFim = async (value: string) => {
      setDataFim(value, { startTransition });
      setPage(1);
    };

  const handleCondicionante = async (value: string) => {
    setCondicionante(value, { startTransition });
    setPage(1);
  }

  const optionsCondicionantes : OptionType[] = condicionantes?.map((tipo: any) => {
      return {
          label: tipo?.descricao,
          value: tipo?.id
      }
  })

  return (
    <Card className="mb-4 w-full">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <div className='md:col-span-2 space-y-1'>
            <Label htmlFor="condicionante">Condicionante</Label>
            <Select
              onValueChange={(value) => handleCondicionante(value) }
              value={condicionante}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder='Selecione'
                />
              </SelectTrigger>
              <SelectContent className='overflow-y-auto max-h-[20rem]'>
                {optionsCondicionantes?.map((cond: any) => (
                  <SelectItem key={cond.value} value={cond.value.toString()}>
                    {cond.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1'>
            <Label htmlFor="status">Status</Label>
            <Select
              onValueChange={(value) => handleStatus(value)}
              value={status}
            >
              <SelectTrigger>
                <SelectValue placeholder='Selecione' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="atrasada">Atrasada</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="vencimentoDataInicio">Vencimento Inicio</Label>
              <Input
                type='date'
                value={dataInicio}
                onChange={(e) => handleDataInicio(e.target.value)}
                className={cn('w-full md:max-w-sm', isLoading && 'animate-pulse')}
              />
          </div>

          {/* Data Fim */}
          <div className="space-y-1">
            <Label htmlFor="dataFim">Vencimento Fim</Label>
            <Input
              type='date'
              value={dataFim}
              onChange={(e) => {
                e.preventDefault()
                handleDataFim(e.target.value)
              }}
              className={cn('w-full md:max-w-sm', isLoading && 'animate-pulse')}
            />
          </div>
          <div>
            { children }
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
