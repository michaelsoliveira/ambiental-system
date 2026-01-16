import { useFormContext } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from "@/components/ui/form"
import { SelectSearchable } from "@/components/select-searchable"
import { Input } from "@/components/ui/input"
import { useEffect, useMemo, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface DadosLancamentoTabProps {
  categorias: any
  contas: any
  centrosCusto: any
  parceiros: any
}

export function DadosLancamentoTab({ 
  categorias, 
  contas,
  centrosCusto,
  parceiros
}: DadosLancamentoTabProps) {
  const form = useFormContext()
  const { watch, setValue } = form
  
  const tipoLancamento = watch('tipo')
  const formaParcelamento = watch('forma_parcelamento')
  const numeroParcelas = watch('numero_parcelas')
  const valor = watch('valor')

  const tiposOptions = [
    { label: 'Receita', value: 'RECEITA' },
    { label: 'Despesa', value: 'DESPESA' },
    { label: 'Transferência', value: 'TRANSFERENCIA' }
  ]

  const formaParcelamentoOptions = [
    { label: 'Única', value: 'UNICA' },
    { label: 'Fixa', value: 'FIXA' },
    { label: 'Progressiva', value: 'PROGRESSIVA' }
  ]

  const statusOptions = [
    { label: 'Pendente', value: 'PENDENTE' },
    { label: 'Confirmado', value: 'CONFIRMADO' },
    { label: 'Pago', value: 'PAGO' },
    { label: 'Cancelado', value: 'CANCELADO' },
    { label: 'Atrasado', value: 'ATRASADO' }
  ]

  const categoriasOptions = useMemo(() => {
    if (!categorias || !Array.isArray(categorias)) return []
    return categorias.map((cat: any) => ({
      label: cat.nome,
      value: cat.id
    }))
  }, [categorias])

  const contasOptions = useMemo(() => {
    if (!contas || !Array.isArray(contas)) return []
    return contas.map((conta: any) => ({
      label: `${conta.nome} - ${conta.banco}`,
      value: conta.id
    }))
  }, [contas])

  const parceirosOptions = useMemo(() => {
    if (!parceiros || !Array.isArray(parceiros)) return []
    return parceiros.map((parceiro: any) => ({
      label: parceiro.pessoa_nome,
      value: parceiro.id
    }))
  }, [parceiros])

  const centrosCustoOptions = useMemo(() => {
    if (!centrosCusto || !Array.isArray(centrosCusto)) return []
    return centrosCusto.map((cc: any) => ({
      label: cc.nome,
      value: cc.id
    }))
  }, [centrosCusto])

  // Gerar parcelas automaticamente quando número de parcelas muda
  useEffect(() => {
    if (formaParcelamento !== 'UNICA' && numeroParcelas && valor) {
      const numParcelas = parseInt(numeroParcelas)
      const valorNumerico = parseFloat(valor)
      
      if (numParcelas > 0 && valorNumerico > 0) {
        const parcelas: any = []
        const valorPorParcela = valorNumerico / numParcelas

        for (let i = 1; i <= numParcelas; i++) {
          const dataVencimento = new Date()
          dataVencimento.setDate(dataVencimento.getDate() + (30 * i))
          
          parcelas.push({
            numero_parcela: i,
            data_vencimento: dataVencimento.toISOString().split('T')[0],
            valor: valorPorParcela.toFixed(2),
            pago: false,
            status_parcela: 'PENDENTE'
          })
        }

        setValue('parcelas', parcelas)
      }
    }
  }, [formaParcelamento, numeroParcelas, valor, setValue])

  return (
    <div className="space-y-6">
      {/* Seção 1: Informações Básicas */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-4">
          <FormField
            control={form.control}
            name="numero"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número do Lançamento</FormLabel>
                <FormControl>
                  <Input placeholder="Número único do lançamento" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="col-span-2">
            <FormField
              control={form.control}
              name="parceiro_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parceiro</FormLabel>
                  <SelectSearchable
                    options={parceirosOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Selecione o parceiro"
                    emptyText="Nenhuma parceiro encontrada"
                    searchPlaceholder="Buscar parceiro..."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <SelectSearchable
                  options={tiposOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecione o tipo"
                  emptyText="Nenhum tipo encontrado"
                  searchPlaceholder="Buscar tipo..."
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
          <FormField
            control={form.control}
            name="data"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data do Lançamento *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_vencimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Vencimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Seção 2: Descrição */}
      <div>
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Descrição do lançamento"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Seção 3: Valores */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-10"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoria_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria *</FormLabel>
                <SelectSearchable
                  options={categoriasOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecione categoria"
                  emptyText="Nenhuma categoria encontrada"
                  searchPlaceholder="Buscar categoria..."
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="conta_bancaria_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conta Bancária *</FormLabel>
                <SelectSearchable
                  options={contasOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecione conta"
                  emptyText="Nenhuma conta encontrada"
                  searchPlaceholder="Buscar conta..."
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Seção 4: Classificação */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
          <FormField
            control={form.control}
            name="centro_custo_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Centro de Custo</FormLabel>
                <SelectSearchable
                  options={centrosCustoOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecione centro de custo"
                  emptyText="Nenhum centro de custo encontrado"
                  searchPlaceholder="Buscar centro de custo..."
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status_lancamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <SelectSearchable
                  options={statusOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecione status"
                  emptyText="Nenhum status encontrado"
                  searchPlaceholder="Buscar status..."
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Seção 5: Parcelamento */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
          <FormField
            control={form.control}
            name="forma_parcelamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forma de Parcelamento</FormLabel>
                <SelectSearchable
                  options={formaParcelamentoOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecione forma"
                  emptyText="Nenhuma forma encontrada"
                  searchPlaceholder="Buscar forma..."
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {formaParcelamento !== 'UNICA' && (
            <FormField
              control={form.control}
              name="numero_parcelas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Parcelas</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Número de parcelas"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </div>

      {/* Seção 6: Status */}
      <div>
        <FormField
          control={form.control}
          name="pago"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox 
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal cursor-pointer mb-0">
                Marcar como pago
              </FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Seção 7: Observações */}
      <div>
        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações adicionais"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="text-xs text-gray-500">
        * Campos obrigatórios
      </div>
    </div>
  )
}