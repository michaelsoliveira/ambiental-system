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
import { Textarea } from '@/components/ui/textarea'
import { useCreateCentroCusto, useUpdateCentroCusto, useCentroCusto } from '@/hooks/use-centro-custo'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'

const centroCustoSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true),
})

type CentroCustoFormData = z.infer<typeof centroCustoSchema>

interface CentroCustoFormProps {
  centroCustoId?: string
  onSuccess?: () => void
}

export function CentroCustoForm({ centroCustoId, onSuccess }: CentroCustoFormProps) {
  const { slug } = useParams<{ slug: string }>()
  const { data: centroCusto } = useCentroCusto(slug!, centroCustoId || '', !!centroCustoId)
  const { mutate: createCentroCusto, isPending: isCreating } = useCreateCentroCusto(slug!)
  const { mutate: updateCentroCusto, isPending: isUpdating } = useUpdateCentroCusto(slug!)

  const form = useForm<CentroCustoFormData>({
    resolver: zodResolver(centroCustoSchema),
    defaultValues: {
      codigo: '',
      nome: '',
      descricao: '',
      ativo: true,
    },
  })

  useEffect(() => {
    if (centroCusto) {
      form.reset({
        codigo: centroCusto.codigo,
        nome: centroCusto.nome,
        descricao: centroCusto.descricao || '',
        ativo: centroCusto.ativo,
      })
    }
  }, [centroCusto, form])

  const onSubmit = (data: CentroCustoFormData) => {
    if (centroCustoId) {
      updateCentroCusto(
        { id: centroCustoId, data },
        {
          onSuccess: () => {
            onSuccess?.()
          },
        }
      )
    } else {
      createCentroCusto(data, {
        onSuccess: () => {
          form.reset()
          onSuccess?.()
        },
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="codigo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
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
              : centroCustoId
              ? 'Atualizar'
              : 'Criar'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
