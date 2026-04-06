'use client'

import { useQuery } from '@tanstack/react-query'
import { Download, FileSpreadsheet,FileText, Printer } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCategorias } from '@/http/categoria/get-categorias'
import { getCentrosCusto } from '@/http/centro-custo/get-centros-custo'
import { getContas } from '@/http/conta/get-contas'
import { getVeiculos } from '@/http/frota/get-veiculos'
import { getLancamentosRelatorio } from '@/http/lancamento/get-lancamentos-relatorio'
import { getParceiros } from '@/http/parceiro/get-parceiros'
import { exportToCSV, exportToXLS, formatCurrency, formatDate } from '@/lib/export-utils'
import { zodV4Resolver } from '@/lib/zod-v4-resolver'

import { RelatorioExtratoPDF } from './relatorio-extrato-pdf'
import { RelatorioExtratoPrint } from './relatorio-extrato-print'
import { RelatorioExtratoTable } from './relatorio-extrato-table'

const relatorioSchema = z.object({
  periodo_tipo: z.enum(['datas', 'mes_ano']).default('datas'),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  mes: z.string().optional(),
  ano: z.string().optional(),
  conta_bancaria_id: z.string().optional().or(z.literal('all-contas')),
  categoria_id: z.string().optional().or(z.literal('all-categorias')),
  centro_custo_id: z.string().optional().or(z.literal('all-centros')),
  veiculo_id: z.string().optional().or(z.literal('all-veiculos')),
  parceiro_id: z.string().optional().or(z.literal('all-parceiros')),
  tipo: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']).optional().or(z.literal('all-tipos')),
  pago: z.boolean().optional(),
}).refine((data) => {
  if (data.periodo_tipo === 'datas') {
    return !!data.data_inicio && !!data.data_fim
  } else {
    return !!data.mes && !!data.ano
  }
}, {
  message: 'Período é obrigatório',
  path: ['data_inicio'],
})

type RelatorioFormData = z.infer<typeof relatorioSchema>

export function LancamentoRelatorioExtrato() {
  const { slug } = useParams<{ slug: string }>()
  const [filters, setFilters] = useState<RelatorioFormData | null>(null)
  const [showPrint, setShowPrint] = useState(false)

  const { data: contasData } = useQuery({
    queryKey: ['contas', slug],
    queryFn: () => getContas(slug!),
    enabled: !!slug,
  })

  const { data: categoriasData } = useQuery({
    queryKey: ['categorias', slug],
    queryFn: () => getCategorias(slug!),
    enabled: !!slug,
  })

  const { data: centrosCustoData } = useQuery({
    queryKey: ['centros-custo', slug],
    queryFn: () => getCentrosCusto(slug!),
    enabled: !!slug,
  })

  const { data: parceirosData } = useQuery({
    queryKey: ['parceiros', slug],
    queryFn: () => getParceiros(slug!),
    enabled: !!slug,
  })

  const { data: veiculosData } = useQuery({
    queryKey: ['veiculos-relatorio', slug],
    queryFn: () => getVeiculos(slug!, { limit: 100, ativo: true }),
    enabled: !!slug,
  })

  const { data: relatorioData, isLoading } = useQuery({
    queryKey: ['lancamentos-relatorio', slug, filters],
    queryFn: () => {
      if (!filters) return Promise.resolve(null)
      
      // Calcular datas baseado no tipo de período
      let data_inicio = filters.data_inicio
      let data_fim = filters.data_fim
      
      if (filters.periodo_tipo === 'mes_ano' && filters.mes && filters.ano) {
        // Primeiro dia do mês
        const mesNum = parseInt(filters.mes)
        const anoNum = parseInt(filters.ano)
        data_inicio = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`
        // Último dia do mês
        const ultimoDia = new Date(anoNum, mesNum, 0).getDate()
        data_fim = `${anoNum}-${String(mesNum).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
      }
      
      // Garantir que os valores "all-*" sejam removidos antes de enviar
      const cleanFilters = {
        data_inicio,
        data_fim,
        conta_bancaria_id: filters.conta_bancaria_id === 'all-contas' ? undefined : filters.conta_bancaria_id,
        categoria_id: filters.categoria_id === 'all-categorias' ? undefined : filters.categoria_id,
        centro_custo_id: filters.centro_custo_id === 'all-centros' ? undefined : filters.centro_custo_id,
        veiculo_id: filters.veiculo_id === 'all-veiculos' ? undefined : filters.veiculo_id,
        parceiro_id: filters.parceiro_id === 'all-parceiros' ? undefined : filters.parceiro_id,
        tipo: filters.tipo === 'all-tipos' ? undefined : filters.tipo as 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA' | undefined,
        pago: filters.pago,
      }
      return getLancamentosRelatorio(slug!, cleanFilters)
    },
    enabled: !!slug && !!filters,
  })

  const form = useForm<RelatorioFormData>({
    resolver: zodV4Resolver(relatorioSchema) as any,
    defaultValues: {
      periodo_tipo: 'datas',
      data_inicio: '',
      data_fim: '',
      mes: undefined,
      ano: new Date().getFullYear().toString(),
      conta_bancaria_id: 'all-contas',
      categoria_id: 'all-categorias',
      centro_custo_id: 'all-centros',
      veiculo_id: 'all-veiculos',
      parceiro_id: 'all-parceiros',
      tipo: 'all-tipos',
      pago: undefined,
    },
  })

  const periodoTipo = form.watch('periodo_tipo')
  
  // Resetar campos quando mudar o tipo de período
  const handlePeriodoTipoChange = (value: 'datas' | 'mes_ano') => {
    form.setValue('periodo_tipo', value)
    if (value === 'datas') {
      form.setValue('mes', undefined)
      form.setValue('ano', new Date().getFullYear().toString())
    } else {
      form.setValue('data_inicio', '')
      form.setValue('data_fim', '')
    }
  }

  const onSubmit = (data: RelatorioFormData) => {
    // Calcular datas se for período por mês/ano
    let data_inicio = data.data_inicio
    let data_fim = data.data_fim
    
    if (data.periodo_tipo === 'mes_ano' && data.mes && data.ano) {
      const mesNum = parseInt(data.mes)
      const anoNum = parseInt(data.ano)
      // Primeiro dia do mês
      data_inicio = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`
      // Último dia do mês
      const ultimoDia = new Date(anoNum, mesNum, 0).getDate()
      data_fim = `${anoNum}-${String(mesNum).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
    }
    
    // Limpar valores "all-*" para não enviar ou enviar undefined
    const cleanData: RelatorioFormData = {
      ...data,
      data_inicio,
      data_fim,
      conta_bancaria_id: data.conta_bancaria_id === 'all-contas' ? undefined : data.conta_bancaria_id,
      categoria_id: data.categoria_id === 'all-categorias' ? undefined : data.categoria_id,
      centro_custo_id: data.centro_custo_id === 'all-centros' ? undefined : data.centro_custo_id,
      veiculo_id: data.veiculo_id === 'all-veiculos' ? undefined : data.veiculo_id,
      parceiro_id: data.parceiro_id === 'all-parceiros' ? undefined : data.parceiro_id,
      tipo: data.tipo === 'all-tipos' ? undefined : data.tipo,
    }
    setFilters(cleanData)
  }

  const onInvalidSubmit = (errors: any) => {
    const firstErrorMessage =
      errors?.data_inicio?.message ||
      errors?.data_fim?.message ||
      errors?.mes?.message ||
      errors?.ano?.message ||
      'Verifique os campos obrigatórios'

    toast.error(firstErrorMessage)
  }

  const handleExportCSV = () => {
    if (!relatorioData) return
    
    let saldoAtual = relatorioData.saldo_anterior
    const csvData = relatorioData.lancamentos.map(lanc => {
      if (lanc.tipo === 'RECEITA') {
        saldoAtual += lanc.valor
      } else if (lanc.tipo === 'DESPESA') {
        saldoAtual -= lanc.valor
      }
      
      return {
        Data: formatDate(lanc.data),
        'Código': lanc.numero,
        'Classificação': lanc.categoria?.nome || '---',
        'Pessoa': lanc.parceiro_nome || '---',
        'Descrição': lanc.descricao,
        'Valor': formatCurrency(lanc.valor),
        'Saldo': formatCurrency(saldoAtual),
      }
    })

    exportToCSV(csvData, `extrato-${new Date().toISOString().split('T')[0]}`)
  }

  const handleExportXLS = () => {
    if (!relatorioData) return
    
    let saldoAtual = relatorioData.saldo_anterior
    const xlsData = relatorioData.lancamentos.map(lanc => {
      if (lanc.tipo === 'RECEITA') {
        saldoAtual += lanc.valor
      } else if (lanc.tipo === 'DESPESA') {
        saldoAtual -= lanc.valor
      }
      
      return {
        Data: formatDate(lanc.data),
        'Código': lanc.numero,
        'Classificação': lanc.categoria?.nome || '---',
        'Pessoa': lanc.parceiro_nome || '---',
        'Descrição': lanc.descricao,
        'Valor': lanc.valor,
        'Saldo': saldoAtual,
      }
    })

    exportToXLS(xlsData, `extrato-${new Date().toISOString().split('T')[0]}`)
  }

  const handlePrint = () => {
    setShowPrint(true)
    setTimeout(() => {
      window.print()
      setShowPrint(false)
    }, 100)
  }

  const contas = contasData?.contas || []
  const categorias = categoriasData?.categorias || []
  const centrosCusto = centrosCustoData?.centros || []
  const parceiros = parceirosData?.parceiros || []
  const veiculos = veiculosData?.veiculos || []

  // Gerar lista de anos (últimos 10 anos até o próximo)
  const anos = Array.from({ length: 11 }, (_, i) => {
    const ano = new Date().getFullYear() - 5 + i
    return ano.toString()
  })

  const meses = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ]

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6 bg-card print:hidden">
        <h2 className="text-lg font-semibold mb-4">Filtros do Relatório</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-4">
            {/* Tipo de Período */}
            <FormField
              control={form.control}
              name="periodo_tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Período *</FormLabel>
                  <Select onValueChange={handlePeriodoTipoChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Selecione o tipo de período" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="datas">Entre Datas</SelectItem>
                      <SelectItem value="mes_ano">Por Mês/Ano</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Campos condicionais baseado no tipo de período */}
              {periodoTipo === 'datas' ? (
                <>
                  <FormField
                    control={form.control}
                    name="data_inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Inicial *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_fim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Final *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="mes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mês *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione o mês" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {meses.map((mes) => (
                              <SelectItem key={mes.value} value={mes.value}>
                                {mes.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ano"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione o ano" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {anos.map((ano) => (
                              <SelectItem key={ano} value={ano}>
                                {ano}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="conta_bancaria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta Bancária</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value || undefined)} 
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todas as contas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all-contas">Todas as contas</SelectItem>
                        {contas.map((conta) => (
                          <SelectItem key={conta.id} value={conta.id}>
                            {conta.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === 'all-categorias' ? undefined : value)} 
                      value={field.value || 'all-categorias'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todas as categorias" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all-categorias">Todas as categorias</SelectItem>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === 'all-tipos' ? undefined : value)} 
                      value={field.value || 'all-tipos'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todos os tipos" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all-tipos">Todos os tipos</SelectItem>
                        <SelectItem value="RECEITA">Receita</SelectItem>
                        <SelectItem value="DESPESA">Despesa</SelectItem>
                        <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="centro_custo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Centro de Custo</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === 'all-centros' ? undefined : value)} 
                      value={field.value || 'all-centros'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todos os centros de custo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all-centros">Todos os centros de custo</SelectItem>
                        {centrosCusto.map((centro) => (
                          <SelectItem key={centro.id} value={centro.id}>
                            {centro.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="veiculo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veículo</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === 'all-veiculos' ? undefined : value)
                      }
                      value={field.value || 'all-veiculos'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todos os veículos" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all-veiculos">Todos os veículos</SelectItem>
                        {veiculos.map((veiculo) => (
                          <SelectItem key={veiculo.id} value={veiculo.id}>
                            {veiculo.placa} · {veiculo.marca} {veiculo.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parceiro_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parceiro</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === 'all-parceiros' ? undefined : value)} 
                      value={field.value || 'all-parceiros'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todos os parceiros" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all-parceiros">Todos os parceiros</SelectItem>
                        {parceiros.map((parceiro) => {
                          const nome = parceiro.pessoa.tipo === 'F'
                            ? parceiro.pessoa.fisica?.nome
                            : parceiro.pessoa.juridica?.nome_fantasia || parceiro.pessoa.juridica?.razao_social
                          return (
                            <SelectItem key={parceiro.id} value={parceiro.id}>
                              {nome || 'Sem nome'}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">Gerar Relatório</Button>
              {relatorioData && (
                <>
                  <Button type="button" variant="outline" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button type="button" variant="outline" onClick={handleExportCSV}>
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                  <Button type="button" variant="outline" onClick={handleExportXLS}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar XLS
                  </Button>
                  <RelatorioExtratoPDF data={relatorioData} />
                </>
              )}
            </div>
          </form>
        </Form>
      </div>

      {isLoading && <div className="text-center py-8">Carregando...</div>}

      {relatorioData && !showPrint && (
        <RelatorioExtratoTable data={relatorioData} />
      )}

      {relatorioData && showPrint && (
        <RelatorioExtratoPrint data={relatorioData} />
      )}
    </div>
  )
}
