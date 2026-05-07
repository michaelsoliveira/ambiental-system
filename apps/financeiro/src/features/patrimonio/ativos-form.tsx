'use client'

import { FormEvent, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PatrimonioAtivo } from '@/http/patrimonio'

import {
  categoriaPatrimonioOptions,
  metodoDepreciacaoOptions,
  statusAtivoOptions,
} from './patrimonio-options'

type AtivoFormProps = {
  initialData?: PatrimonioAtivo | null
  isPending?: boolean
  onSubmit: (data: Record<string, any>) => void
}

function toDateInput(value?: string | null) {
  return value ? new Date(value).toISOString().split('T')[0] : ''
}

export function AtivosForm({ initialData, isPending, onSubmit }: AtivoFormProps) {
  const defaultValues = useMemo(() => ({
    nome: initialData?.nome ?? '',
    descricao: initialData?.descricao ?? '',
    categoria: initialData?.categoria ?? 'OUTRO',
    tipo: initialData?.tipo ?? '',
    codigo: initialData?.codigo ?? '',
    data_aquisicao: toDateInput(initialData?.data_aquisicao),
    valor_aquisicao: String(initialData?.valor_aquisicao ?? ''),
    valor_atual: String(initialData?.valor_atual ?? ''),
    metodo_depreciacao: initialData?.metodo_depreciacao ?? '',
    taxa_depreciacao_anual: String(initialData?.taxa_depreciacao_anual ?? ''),
    vida_util_meses: String(initialData?.vida_util_meses ?? ''),
    status: initialData?.status ?? 'ATIVO',
    localizacao: initialData?.localizacao ?? '',
    responsavel: initialData?.responsavel ?? '',
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
      valor_aquisicao: Number(values.valor_aquisicao || 0),
      valor_atual: values.valor_atual ? Number(values.valor_atual) : undefined,
      taxa_depreciacao_anual: values.taxa_depreciacao_anual
        ? Number(values.taxa_depreciacao_anual)
        : undefined,
      vida_util_meses: values.vida_util_meses ? Number(values.vida_util_meses) : undefined,
      data_aquisicao: values.data_aquisicao || undefined,
      metodo_depreciacao: values.metodo_depreciacao || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Nome *</span>
          <Input value={values.nome} onChange={(event) => setValue('nome', event.target.value)} required />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Categoria *</span>
          <select
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={values.categoria}
            onChange={(event) => setValue('categoria', event.target.value)}
          >
            {categoriaPatrimonioOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Tipo</span>
          <Input value={values.tipo} onChange={(event) => setValue('tipo', event.target.value)} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Código</span>
          <Input value={values.codigo} onChange={(event) => setValue('codigo', event.target.value)} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Data de aquisição</span>
          <Input
            type="date"
            value={values.data_aquisicao}
            onChange={(event) => setValue('data_aquisicao', event.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Status</span>
          <select
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={values.status}
            onChange={(event) => setValue('status', event.target.value)}
          >
            {statusAtivoOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Valor de aquisição *</span>
          <Input
            type="number"
            step="0.01"
            value={values.valor_aquisicao}
            onChange={(event) => setValue('valor_aquisicao', event.target.value)}
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Valor atual</span>
          <Input
            type="number"
            step="0.01"
            value={values.valor_atual}
            onChange={(event) => setValue('valor_atual', event.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Método de depreciação</span>
          <select
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={values.metodo_depreciacao}
            onChange={(event) => setValue('metodo_depreciacao', event.target.value)}
          >
            <option value="">Não informado</option>
            {metodoDepreciacaoOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Taxa anual (%)</span>
          <Input
            type="number"
            step="0.01"
            value={values.taxa_depreciacao_anual}
            onChange={(event) => setValue('taxa_depreciacao_anual', event.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Vida útil (meses)</span>
          <Input
            type="number"
            value={values.vida_util_meses}
            onChange={(event) => setValue('vida_util_meses', event.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Localização</span>
          <Input value={values.localizacao} onChange={(event) => setValue('localizacao', event.target.value)} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Responsável</span>
          <Input value={values.responsavel} onChange={(event) => setValue('responsavel', event.target.value)} />
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-sm font-medium">Descrição</span>
        <textarea
          className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={values.descricao}
          onChange={(event) => setValue('descricao', event.target.value)}
        />
      </label>

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
          {isPending ? 'Salvando...' : 'Salvar ativo'}
        </Button>
      </div>
    </form>
  )
}
