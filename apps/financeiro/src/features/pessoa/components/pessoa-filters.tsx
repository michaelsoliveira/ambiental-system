'use client'

import { Filter } from 'lucide-react';
import { useState } from 'react';

import { OptionType } from '@/components/select-searchable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEstados } from '@/hooks/use-estados';

import PessoaTableAction from './pessoa-tables/pessoa-table-action';
import { usePessoaTableFilters } from './pessoa-tables/use-pessoa-table-filters';

export function PessoaFilters() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: responseEstados = [] }: any = useEstados()
  const { estados = [] } = responseEstados?.data ?? { estados: []}

  const optionsEstados: OptionType[] = estados ? estados?.map((estado: any) => {
    return {
      label: estado?.uf,
      value: estado?.id
    }
  }) : [{ label: "", value: "" }]

  const { 
      cidade,
      setCidade,
      estado,
      setEstado,
      tipo,
      setTipo,
      hasEmail,
      setHasEmail,
      hasPhone,
      setHasPhone,
      createdAfter,
      setCreatedAfter,
      createdBefore,
      setCreatedBefore,
      isAnyFilterActive
    } = usePessoaTableFilters();

  return (
    <div className="flex items-end gap-3">
      <div className='flex flex-row items-center gap-4'>
        <label htmlFor="pesquisar" className='text-sm'>Pesquisar</label>
        <PessoaTableAction />
      </div>
      {/* Dropdown de filtros */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            className={`relative ${isAnyFilterActive ? 'border-blue-500 bg-blue-50' : ''}`}
          >
            <Filter className="h-4 w-4" />
            {isAnyFilterActive && (
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[700px] p-0" align="center" sideOffset={5}>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Filtros Avançados</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tipo de pessoa */}
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <Select value={tipo} onValueChange={(value) => setTipo(value)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="F">Pessoa Física</SelectItem>
                    <SelectItem value="J">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Cidade */}
              <div>
                <label className="block text-sm font-medium mb-1">Cidade</label>
                <Input
                  placeholder="Nome da cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                />
              </div>
              
              {/* Estado */}
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <Select
                  onValueChange={(value) => setEstado(value)}
                  value={estado}
                  defaultValue={estado}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Selecione um Estado' />
                  </SelectTrigger>
                  <SelectContent className='overflow-y-auto max-h-[20rem]'>
                    {optionsEstados?.map((estado: OptionType) => (
                      <SelectItem key={estado.value?.toString()!} value={estado.value?.toString()!}>
                        {estado.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Tem email */}
              <div>
                <label className="block text-sm font-medium mb-1">Tem Email</label>
                <Select value={hasEmail} onValueChange={(value) => setHasEmail(value)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Tem telefone */}
              <div>
                <label className="block text-sm font-medium mb-1">Tem Telefone</label>
                <Select value={hasPhone} onValueChange={(value) => setHasPhone(value)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Data de criação - Depois de */}
              <div>
                <label className="block text-sm font-medium mb-1">Criado Após</label>
                <Input
                  type="date"
                  value={createdAfter}
                  onChange={(e) => setCreatedAfter(e.target.value)}
                />
              </div>
              
              {/* Data de criação - Antes de */}
              <div>
                <label className="block text-sm font-medium mb-1">Criado Antes</label>
                <Input
                  type="date"
                  value={createdBefore}
                  onChange={(e) => setCreatedBefore(e.target.value)}
                />
              </div>
            </div>
            
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}