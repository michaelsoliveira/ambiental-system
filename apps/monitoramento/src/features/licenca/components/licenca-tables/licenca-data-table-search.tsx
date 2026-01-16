'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import React, { ReactNode, useTransition } from 'react';
import { OptionType } from '@/components/select-searchable';
import { TipoLicencaType } from 'types';
import { useQueryClient } from '@tanstack/react-query';
import { DataTableSearch } from '@/components/ui/table/data-table-search';

interface DataTableSearchProps {
  dataInicio: string;
  dataFim: string;
  tiposLicenca: Array<TipoLicencaType>
  tipoLicenca: string;
  search: string;
  setSearch: (
    value: string | ((old: string) => string | null) | null,
    options?: Options | undefined
  ) => Promise<URLSearchParams>;
  setTipoLicenca: (
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

export function LicencaDataTableSearch({
  search,
  setSearch,
  dataInicio,
  dataFim,
  tiposLicenca,
  tipoLicenca,
  setTipoLicenca,
  setDataInicio,
  setDataFim,
  setPage,
  children
}: DataTableSearchProps) {
  const [isLoading, startTransition] = useTransition();
  const handleDataInicio = async (value: string) => {
    setDataInicio(value, { startTransition });
    setPage(1);
  };

  const handleTipoLicenca = async (value: string) => {
    setTipoLicenca(value, { startTransition });
    setPage(1);
  }

  const handleDataFim = async (value: string) => {
    setDataFim(value, { startTransition });
    setPage(1);
  };

  const optionsTiposLicenca : OptionType[] = tiposLicenca?.map((tipo: any) => {
      return {
          label: tipo?.descricao,
          value: tipo?.id
      }
  })

  return (
    <Card className="mb-4 w-full">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className='flex flex-col space-y-1'>
          <Label htmlFor="dataInicio">Número da Licença</Label>
          <DataTableSearch 
            searchKey='Nº Licença'
            searchQuery={search}
            setSearchQuery={setSearch}
            setPage={setPage}
          />
          </div>
          <div className="flex flex-col space-y-1">
            <Label htmlFor="dataInicio">Data Inicio</Label>
              <Input
                type='date'
                value={dataInicio}
                onChange={(e) => handleDataInicio(e.target.value)}
                className={cn('w-full md:max-w-sm', isLoading && 'animate-pulse')}
              />
          </div>

          {/* Data Fim */}
          <div className="flex flex-col space-y-1">
            <Label htmlFor="dataFim">Data Fim</Label>
            <Input
              type='date'
              value={dataFim}
              onChange={(e) => handleDataFim(e.target.value)}
              className={cn('w-full md:max-w-sm', isLoading && 'animate-pulse')}
            />
          </div>

          <div className='flex flex-col space-y-1'>
            <Label htmlFor="tipo_ocorrencia">Tipo Licença</Label>
            <Select
              onValueChange={(value) => handleTipoLicenca(value) }
              value={tipoLicenca}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder='Selecione'
                />
              </SelectTrigger>
              <SelectContent className='overflow-y-auto max-h-[20rem]'>
                {optionsTiposLicenca?.map((tipo: any) => (
                  <SelectItem key={tipo.value} value={tipo.value.toString()}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            { children }
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
