import { useEffect, useMemo, useState } from "react"
import { useFormContext } from "react-hook-form"

import { SelectSearchable } from "@/components/select-searchable"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

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
  const controleInterno = watch('controle_interno')
  const formaParcelamento = watch('forma_parcelamento')
  const numeroParcelas = watch('numero_parcelas')
  const valor = watch('valor')
  const dataVencimento = watch('data_vencimento')

  const tiposOptions = [
    { label: 'Receita', value: 'RECEITA' },
    { label: 'Despesa', value: 'DESPESA' },
    { label: 'Transferência', value: 'TRANSFERENCIA' }
  ]

  const formaParcelamentoOptions = [
    { label: 'Única', value: 'UNICA' },
    { label: 'Fixa', value: 'FIXA' },
    { label: 'Progressiva', value: 'PROGRESSIVA' },
    { label: 'Recorrente', value: 'RECORRENTE' }
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
        const valorPorParcela = formaParcelamento === 'RECORRENTE' ? valorNumerico : valorNumerico / numParcelas
        const dataBase = dataVencimento ? new Date(`${dataVencimento}T00:00:00`) : new Date()

        for (let i = 1; i <= numParcelas; i++) {
          const dataVencimentoParcela = new Date(dataBase)
          dataVencimentoParcela.setMonth(dataVencimentoParcela.getMonth() + (i - 1))
          
          parcelas.push({
            numero_parcela: i,
            data_vencimento: dataVencimentoParcela.toISOString().split('T')[0],
            valor: valorPorParcela.toFixed(2),
            pago: false,
            status_parcela: 'PENDENTE'
          })
        }

        setValue('parcelas', parcelas)
      }
    }
  }, [formaParcelamento, numeroParcelas, valor, dataVencimento, setValue])

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

      {/* Seção 5: Controle interno e integração Asaas */}
      <div>
        <FormField
          control={form.control}
          name="controle_interno"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox 
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal cursor-pointer mb-0">
                Apenas controle interno (não gera cobrança no Asaas)
              </FormLabel>
              <FormDescription>
                Marque para registrar apenas internamente, sem integrar com boleto ou PIX.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {tipoLancamento === 'RECEITA' && !controleInterno && (
          <div className="mt-4 flex flex-wrap gap-6">
            <FormField
              control={form.control}
              name="gerar_boleto"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox 
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer mb-0">
                    Gerar boleto
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="permitir_pix"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox 
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer mb-0">
                    Permitir PIX
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>

      {/* Seção 6: Parcelamento */}
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
          {formaParcelamento === 'RECORRENTE' && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 md:col-span-2">
              Recorrente gera automaticamente a quantidade informada de lançamentos mensais com o mesmo valor.
              Use para parcelas fixas de financeiro, consórcio, mensalidades e cobranças recorrentes.
            </div>
          )}
        </div>
      </div>

      {/* Seção 7: Status */}
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

      {/* Seção 8: Observações */}
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