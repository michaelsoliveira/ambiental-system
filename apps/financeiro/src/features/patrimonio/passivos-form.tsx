'use client'

import { FormEvent, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PatrimonioPassivo } from '@/http/patrimonio'

import { statusPassivoOptions, tipoPassivoOptions } from './patrimonio-options'

type PassivoFormProps = {
  initialData?: PatrimonioPassivo | null
  isPending?: boolean
  onSubmit: (data: Record<string, any>) => void
}

function toDateInput(value?: string | null) {
  return value ? new Date(value).toISOString().split('T')[0] : ''
}

export function PassivosForm({ initialData, isPending, onSubmit }: PassivoFormProps) {
  const defaultValues = useMemo(() => ({
    descricao: initialData?.descricao ?? '',
    tipo: initialData?.tipo ?? 'EMPRESTIMO',
    credor: initialData?.credor ?? '',
    valor_original: String(initialData?.valor_original ?? ''),
    saldo_devedor: String(initialData?.saldo_devedor ?? ''),
    data_inicio: toDateInput(initialData?.data_inicio),
    data_vencimento: toDateInput(initialData?.data_vencimento),
    taxa_juros: String(initialData?.taxa_juros ?? ''),
    status: initialData?.status ?? 'ABERTO',
    observacoes: initialData?.observacoes ?? '',
  }), [initialData])

  const [values, setValues] = useState(defaultValues)

  function setValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    onSubmit({
      ...values,
      valor_original: Number(values.valor_original || 0),
      saldo_devedor: values.saldo_devedor ? Number(values.saldo_devedor) : undefined,
      taxa_juros: values.taxa_juros ? Number(values.taxa_juros) : undefined,
      data_inicio: values.data_inicio || undefined,
      data_vencimento: values.data_vencimento || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium">Descrição *</span>
          <Input value={values.descricao} onChange={(event) => setValue('descricao', event.target.value)} required />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Tipo *</span>
          <select
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={values.tipo}
            onChange={(event) => setValue('tipo', event.target.value)}
          >
            {tipoPassivoOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Status</span>
          <select
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={values.status}
            onChange={(event) => setValue('status', event.target.value)}
          >
            {statusPassivoOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Credor/Instituição</span>
          <Input value={values.credor} onChange={(event) => setValue('credor', event.target.value)} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Taxa de juros (%)</span>
          <Input
            type="number"
            step="0.01"
            value={values.taxa_juros}
            onChange={(event) => setValue('taxa_juros', event.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Valor original *</span>
          <Input
            type="number"
            step="0.01"
            value={values.valor_original}
            onChange={(event) => setValue('valor_original', event.target.value)}
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Saldo devedor</span>
          <Input
            type="number"
            step="0.01"
            value={values.saldo_devedor}
            onChange={(event) => setValue('saldo_devedor', event.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Data de início</span>
          <Input
            type="date"
            value={values.data_inicio}
            onChange={(event) => setValue('data_inicio', event.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Vencimento final</span>
          <Input
            type="date"
            value={values.data_vencimento}
            onChange={(event) => setValue('data_vencimento', event.target.value)}
          />
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-sm font-medium">Observações</span>
        <textarea
          className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={values.observacoes}
          onChange={(event) => setValue('observacoes', event.target.value)}
        />
      </label>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar passivo'}
        </Button>
      </div>
    </form>
  )
}
