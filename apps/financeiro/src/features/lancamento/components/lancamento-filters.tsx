'use client'

import { useEffect, useMemo, useState } from 'react';
import { 
  Filter, 
  Search, 
  X, 
  Calendar,
  DollarSign,
  CheckSquare,
  Building2,
  CreditCard,
  Users,
  Layers,
  Receipt,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLancamentoTableFilters } from './lancamento-tables/use-lancamento-table-filters';
import { SelectSearchable } from '@/components/select-searchable';

interface LancamentoFiltersProps {
  totalItems?: number;
  categorias?: Array<{ id: string; nome: string; tipo: string }>;
  contasBancarias?: Array<{ id: string; nome: string }>;
  centrosCusto?: Array<{ id: string; nome: string }>;
  parceiros?: Array<{ id: string; pessoa: any }>;
  veiculos?: Array<{ id: string; placa: string; modelo: string; marca: string }>;
}

export function LancamentoFilters({ 
  totalItems = 0,
  categorias = [],
  contasBancarias = [],
  centrosCusto = [],
  parceiros = [],
  veiculos = [],
}: LancamentoFiltersProps) {
  const {
    search,
    setSearch,
    tipoLancamento,
    setTipoLancamento,
    statusLancamento,
    setStatusLancamento,
    statusPagamento,
    setStatusPagamento,
    filtrarPor,
    setFiltrarPor,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    categoriaId,
    setCategoriaId,
    contaBancariaId,
    setContaBancariaId,
    centroCustoId,
    setCentroCustoId,
    parceiroId,
    setParceiroId,
    veiculoId,
    setVeiculoId,
    formaParcelamento,
    setFormaParcelamento,
    valorMin,
    setValorMin,
    valorMax,
    setValorMax,
    apenasVencidos,
    setApenasVencidos,
    apenasAVencer,
    setApenasAVencer,
    resetFilters,
  } = useLancamentoTableFilters();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    tipoLancamento: tipoLancamento ?? 'todos',
    statusLancamento: statusLancamento ?? 'todos',
    statusPagamento: statusPagamento ?? 'todos',
    filtrarPor: filtrarPor ?? 'data',
    dataInicio: dataInicio ?? '',
    dataFim: dataFim ?? '',
    categoriaId: categoriaId ?? '',
    contaBancariaId: contaBancariaId ?? '',
    centroCustoId: centroCustoId ?? '',
    parceiroId: parceiroId ?? '',
    veiculoId: veiculoId ?? '',
    formaParcelamento: formaParcelamento ?? 'todos',
    valorMin: valorMin ?? '',
    valorMax: valorMax ?? '',
    apenasVencidos: apenasVencidos,
    apenasAVencer: apenasAVencer,
  });

  const categoriasOptions = useMemo(() => {
    return categorias.map((cat) => ({
      label: `${cat.nome} (${cat.tipo})`,
      value: cat.id
    }));
  }, [categorias]);

  const contasBancariasOptions = useMemo(() => {
    return contasBancarias.map((conta) => ({
      label: conta.nome,
      value: conta.id
    }));
  }, [contasBancarias]);

  const centrosCustoOptions = useMemo(() => {
    return centrosCusto.map((centro) => ({
      label: centro.nome,
      value: centro.id
    }));
  }, [centrosCusto]);

  const parceirosOptions = useMemo(() => {
    return parceiros.map((parceiro) => ({
      label: parceiro.pessoa?.fisica?.nome || parceiro.pessoa?.juridica?.nome_fantasia || 'Sem nome',
      value: parceiro.id
    }));
  }, [parceiros]);

  const veiculosOptions = useMemo(() => {
    return veiculos.map((v) => ({
      label: `${v.placa} — ${v.marca} ${v.modelo}`.trim(),
      value: v.id,
    }));
  }, [veiculos]);

  const activeFiltersCount = () => {
    let count = 0;
    if (tempFilters.tipoLancamento !== 'todos') count++;
    if (tempFilters.statusLancamento !== 'todos') count++;
    if (tempFilters.statusPagamento !== 'todos') count++;
    if (tempFilters.dataInicio) count++;
    if (tempFilters.dataFim) count++;
    if (tempFilters.categoriaId) count++;
    if (tempFilters.contaBancariaId) count++;
    if (tempFilters.centroCustoId) count++;
    if (tempFilters.parceiroId) count++;
    if (tempFilters.veiculoId) count++;
    if (tempFilters.formaParcelamento !== 'todos') count++;
    if (tempFilters.valorMin) count++;
    if (tempFilters.valorMax) count++;
    if (tempFilters.apenasVencidos) count++;
    if (tempFilters.apenasAVencer) count++;
    return count;
  };

  const handleApplyFilters = () => {
    setTipoLancamento(tempFilters.tipoLancamento);
    setStatusLancamento(tempFilters.statusLancamento);
    setStatusPagamento(tempFilters.statusPagamento);
    setFiltrarPor(tempFilters.filtrarPor);
    setDataInicio(tempFilters.dataInicio);
    setDataFim(tempFilters.dataFim);
    setCategoriaId(tempFilters.categoriaId);
    setContaBancariaId(tempFilters.contaBancariaId);
    setCentroCustoId(tempFilters.centroCustoId);
    setParceiroId(tempFilters.parceiroId);
    setVeiculoId(tempFilters.veiculoId);
    setFormaParcelamento(tempFilters.formaParcelamento);
    setValorMin(tempFilters.valorMin);
    setValorMax(tempFilters.valorMax);
    setApenasVencidos(tempFilters.apenasVencidos);
    setApenasAVencer(tempFilters.apenasAVencer);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setTempFilters({
      tipoLancamento: 'todos',
      statusLancamento: 'todos',
      statusPagamento: 'todos',
      filtrarPor: 'data',
      dataInicio: '',
      dataFim: '',
      categoriaId: '',
      contaBancariaId: '',
      centroCustoId: '',
      parceiroId: '',
      veiculoId: '',
      formaParcelamento: 'todos',
      valorMin: '',
      valorMax: '',
      apenasVencidos: false,
      apenasAVencer: false,
    });
    resetFilters();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Botão de Busca */}
      <div className="relative">
        {!isSearchOpen ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSearchOpen(true)}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-all duration-300" />
              <Input
                placeholder="Buscar lançamentos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-10 w-[100px] transition-all duration-300 focus:w-[350px]"
                autoFocus
                onBlur={() => {
                  if (!search) {
                    setTimeout(() => setIsSearchOpen(false), 150);
                  }
                }}
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Botão de Filtros */}
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 relative">
            <Filter className="h-4 w-4" />
            Filtrar
            {activeFiltersCount() > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {activeFiltersCount()}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[900px] p-0">
          <div className="flex flex-row items-center justify-between p-4">
            <Label className="text-lg font-semibold px-0">Filtrar lançamentos</Label>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setIsFilterOpen(false)}
              className='rounded-full'
            >
              <X className='w-4 h-4' />
            </Button>
          </div>
          
          <div className="space-y-4 px-4">
            {/* Linha 1: Tipo e Status */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Receipt className="h-4 w-4" />
                  Tipo de Lançamento
                </Label>
                <Select 
                  value={tempFilters.tipoLancamento} 
                  onValueChange={(value) => setTempFilters({...tempFilters, tipoLancamento: value})}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="RECEITA">Receita</SelectItem>
                    <SelectItem value="DESPESA">Despesa</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <CheckSquare className="h-4 w-4" />
                  Status do Lançamento
                </Label>
                <Select 
                  value={tempFilters.statusLancamento} 
                  onValueChange={(value) => setTempFilters({...tempFilters, statusLancamento: value})}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                    <SelectItem value="PAGO">Pago</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                    <SelectItem value="ATRASADO">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <CheckSquare className="h-4 w-4" />
                  Pagamento
                </Label>
                <Select 
                  value={tempFilters.statusPagamento} 
                  onValueChange={(value) => setTempFilters({...tempFilters, statusPagamento: value})}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="Pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="nao_pago">Não Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 2: Datas */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  Filtrar por
                </Label>
                <Select 
                  value={tempFilters.filtrarPor} 
                  onValueChange={(value) => setTempFilters({...tempFilters, filtrarPor: value})}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="Filtrar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data">Data do Lançamento</SelectItem>
                    <SelectItem value="data_vencimento">Data de Vencimento</SelectItem>
                    <SelectItem value="data_pagamento">Data de Pagamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  Data Início
                </Label>
                <Input
                  type="date"
                  value={tempFilters.dataInicio}
                  onChange={(e) => setTempFilters({...tempFilters, dataInicio: e.target.value})}
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  Data Fim
                </Label>
                <Input
                  type="date"
                  value={tempFilters.dataFim}
                  onChange={(e) => setTempFilters({...tempFilters, dataFim: e.target.value})}
                />
              </div>
            </div>

            {/* Linha 3: Categoria, Conta e Centro de Custo */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4" />
                  Categoria
                </Label>
                <SelectSearchable
                  options={[{label: 'Todas', value: ''}, ...categoriasOptions]}
                  value={tempFilters.categoriaId}
                  onValueChange={(value) => setTempFilters({...tempFilters, categoriaId: value})}
                  placeholder="Todas as categorias"
                  searchPlaceholder="Buscar categoria..."
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4" />
                  Conta Bancária
                </Label>
                <SelectSearchable
                  options={[{label: 'Todas', value: ''}, ...contasBancariasOptions]}
                  value={tempFilters.contaBancariaId}
                  onValueChange={(value) => setTempFilters({...tempFilters, contaBancariaId: value})}
                  placeholder="Todas as contas"
                  searchPlaceholder="Buscar conta..."
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4" />
                  Centro de Custo
                </Label>
                <SelectSearchable
                  options={[{label: 'Todos', value: ''}, ...centrosCustoOptions]}
                  value={tempFilters.centroCustoId}
                  onValueChange={(value) => setTempFilters({...tempFilters, centroCustoId: value})}
                  placeholder="Todos os centros"
                  searchPlaceholder="Buscar centro..."
                />
              </div>
            </div>

            {/* Linha 4: Parceiro, Veículo e Forma de Parcelamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  Parceiro
                </Label>
                <SelectSearchable
                  options={[{label: 'Todos', value: ''}, ...parceirosOptions]}
                  value={tempFilters.parceiroId}
                  onValueChange={(value) => setTempFilters({...tempFilters, parceiroId: value})}
                  placeholder="Todos os parceiros"
                  searchPlaceholder="Buscar parceiro..."
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Truck className="h-4 w-4" />
                  Veículo
                </Label>
                <SelectSearchable
                  options={[{label: 'Todos', value: ''}, ...veiculosOptions]}
                  value={tempFilters.veiculoId}
                  onValueChange={(value) => setTempFilters({...tempFilters, veiculoId: value})}
                  placeholder="Todos os veículos"
                  searchPlaceholder="Buscar por placa ou modelo..."
                  emptyText="Nenhum veículo encontrado"
                />
              </div>

              <div>
                <Label className="mb-2 block">Forma de Parcelamento</Label>
                <Select 
                  value={tempFilters.formaParcelamento} 
                  onValueChange={(value) => setTempFilters({...tempFilters, formaParcelamento: value})}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="Forma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="UNICA">Única</SelectItem>
                    <SelectItem value="FIXA">Fixa</SelectItem>
                    <SelectItem value="PROGRESSIVA">Progressiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 5: Valores */}
            {/* <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4" />
                  Valor Mínimo
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={tempFilters.valorMin}
                  onChange={(e) => setTempFilters({...tempFilters, valorMin: e.target.value})}
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4" />
                  Valor Máximo
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={tempFilters.valorMax}
                  onChange={(e) => setTempFilters({...tempFilters, valorMax: e.target.value})}
                />
              </div>
            </div> */}

            {/* Linha 6: Checkboxes */}
            <div className="flex flex-row gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="apenas-vencidos"
                  checked={tempFilters.apenasVencidos}
                  onCheckedChange={(checked) =>
                    setTempFilters({
                      ...tempFilters,
                      apenasVencidos: !!checked
                    })
                  }
                />
                <label
                  htmlFor="apenas-vencidos"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Apenas vencidos
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="apenas-a-vencer"
                  checked={tempFilters.apenasAVencer}
                  onCheckedChange={(checked) =>
                    setTempFilters({
                      ...tempFilters,
                      apenasAVencer: !!checked
                    })
                  }
                />
                <label
                  htmlFor="apenas-a-vencer"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Apenas a vencer
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-2 gap-2 mt-4 py-4 border-t">
              <Button variant="outline" onClick={handleClearFilters}>
                Limpar filtros
              </Button>
              <Button onClick={handleApplyFilters}>
                Aplicar filtros
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {activeFiltersCount() > 0 && !isFilterOpen && (
        <Button size='sm' variant="outline" onClick={handleClearFilters}>
          Limpar filtros
        </Button>
      )}

      {/* Badge de resultados */}
      {totalItems > 0 && (
        <Badge variant="secondary" className="ml-2">
          {totalItems} {totalItems === 1 ? 'resultado' : 'resultados'}
        </Badge>
      )}
    </div>
  );
}