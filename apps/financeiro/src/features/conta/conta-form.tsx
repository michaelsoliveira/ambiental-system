'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Switch } from '@/components/ui/switch'
import { FormDescription } from '@/components/ui/form'
import { useCreateConta, useUpdateConta, useConta } from '@/hooks/use-conta'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getContas } from '@/http/conta/get-contas'

const contaSchema = z
  .object({
    codigo: z.string().min(1, 'Código é obrigatório'),
    nome: z.string().min(1, 'Nome é obrigatório'),
    tipo_conta: z.enum(['BANCARIA', 'CONTABIL']).default('BANCARIA'),
    banco: z.string().optional(),
    agencia: z.string().optional(),
    numero: z.string().optional(),
    tipoConta: z.enum(['CORRENTE', 'POUPANCA', 'INVESTIMENTO', 'CREDITO']).optional(),
    saldoInicial: z.coerce.number().default(0),
    conta_pai_id: z.string().uuid().optional().or(z.literal('')),
    ativo: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.tipo_conta === 'BANCARIA') {
        return !!data.banco
      }
      return true
    },
    {
      message: 'Banco é obrigatório para contas bancárias',
      path: ['banco'],
    }
  )

type ContaFormData = z.infer<typeof contaSchema>

interface ContaFormProps {
  contaId?: string
  onSuccess?: () => void
}

export function ContaForm({ contaId, onSuccess }: ContaFormProps) {
  const { slug } = useParams<{ slug: string }>()
  const { data: conta } = useConta(slug!, contaId || '', !!contaId)
  const { data: contasData } = useQuery({
    queryKey: ['contas', slug],
    queryFn: () => getContas(slug!),
    enabled: !!slug,
  })
  const { mutate: createConta, isPending: isCreating } = useCreateConta(slug!)
  const { mutate: updateConta, isPending: isUpdating } = useUpdateConta(slug!)

  const contas = contasData?.contas || []
  const contasContabeis = contas.filter((c) => c.tipo_conta === 'CONTABIL')

  const form = useForm<ContaFormData>({
    resolver: zodResolver(contaSchema),
    defaultValues: {
      codigo: '',
      nome: '',
      tipo_conta: 'BANCARIA',
      banco: '',
      agencia: '',
      numero: '',
      tipoConta: 'CORRENTE',
      saldoInicial: 0,
      conta_pai_id: '',
      ativo: true,
    },
  })

  const tipoConta = form.watch('tipo_conta')

  useEffect(() => {
    if (conta) {
      form.reset({
        codigo: conta.codigo,
        nome: conta.nome,
        tipo_conta: conta.tipo_conta,
        banco: conta.banco || '',
        agencia: conta.agencia || '',
        numero: conta.numero || '',
        tipoConta: (conta.tipoConta as any) || 'CORRENTE',
        saldoInicial: conta.saldoInicial,
        conta_pai_id: conta.conta_pai_id || '',
        ativo: conta.ativo,
      })
    }
  }, [conta, form])

  const onSubmit = (data: ContaFormData) => {
    const submitData = {
      ...data,
      conta_pai_id: data.conta_pai_id && data.conta_pai_id !== 'none' ? data.conta_pai_id : undefined,
    }

    if (contaId) {
      updateConta(
        { id: contaId, data: submitData },
        {
          onSuccess: () => {
            onSuccess?.()
          },
        }
      )
    } else {
      createConta(submitData, {
        onSuccess: () => {
          form.reset()
          onSuccess?.()
        },
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Tipo de Conta */}
        <FormField
          control={form.control}
          name="tipo_conta"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Conta *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BANCARIA">Conta Bancária</SelectItem>
                  <SelectItem value="CONTABIL">Conta Contábil (Plano de Contas)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nome */}
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={
                    tipoConta === 'BANCARIA'
                      ? 'Ex: Banco do Brasil - Conta Corrente'
                      : 'Ex: Receitas Operacionais'
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campos específicos para Conta Contábil */}
        {tipoConta === 'CONTABIL' && (
          <>
            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código da Conta *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: 3.1.1" />
                  </FormControl>
                  <FormDescription>
                    Código único da conta no plano de contas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conta_pai_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta Pai (Opcional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a conta pai" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma (Conta principal)</SelectItem>
                      {contasContabeis
                        .filter((c) => c.id !== contaId)
                        .map((conta) => (
                          <SelectItem key={conta.id} value={conta.id}>
                            {conta.codigo} - {conta.nome}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecione uma conta pai para criar uma subconta (ex: "CONSULTORIA" como subconta de "RECEITAS OPERACIONAIS")
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Campos específicos para Conta Bancária */}
        {tipoConta === 'BANCARIA' && (
          <>
            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Código da conta" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="banco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banco</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome do banco" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="agencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agência</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Número da agência" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da Conta</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Número da conta" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipoConta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Conta</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Ex: Corrente, Poupança" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CORRENTE">Corrente</SelectItem>
                        <SelectItem value="POUPANCA">Poupança</SelectItem>
                        <SelectItem value="INVESTIMENTO">Investimento</SelectItem>
                        <SelectItem value="CREDITO">Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="saldoInicial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo Inicial</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value || 0}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        {/* Conta Ativa - Switch */}
        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Conta ativa</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Botões */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {isCreating || isUpdating
              ? 'Salvando...'
              : contaId
              ? 'Atualizar'
              : 'Salvar Dados'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
