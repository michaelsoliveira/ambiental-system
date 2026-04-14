'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  useCargoFuncionario,
  useCreateCargoFuncionario,
  useUpdateCargoFuncionario,
} from '@/hooks/use-cargos-funcionario'

const schema = z.object({
  codigo: z.string().optional(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  salario_base: z.coerce.number().nonnegative(),
  ativo: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

export function CargoFuncionarioForm({
  cargoId,
  onSuccess,
}: {
  cargoId?: string
  onSuccess?: () => void
}) {
  const { slug } = useParams<{ slug: string }>()
  const { data } = useCargoFuncionario(slug!, cargoId || '', !!cargoId)
  const { mutate: createCargo, isPending: isCreating } = useCreateCargoFuncionario(slug!)
  const { mutate: updateCargo, isPending: isUpdating } = useUpdateCargoFuncionario(slug!)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      codigo: '',
      nome: '',
      descricao: '',
      salario_base: 0,
      ativo: true,
    },
  })

  useEffect(() => {
    if (data?.cargo) {
      form.reset({
        codigo: data.cargo.codigo ?? '',
        nome: data.cargo.nome,
        descricao: data.cargo.descricao ?? '',
        salario_base: Number(data.cargo.salario_base ?? 0),
        ativo: data.cargo.ativo,
      })
    }
  }, [data, form])

  function onSubmit(values: FormData) {
    if (cargoId) {
      updateCargo(
        { id: cargoId, data: values },
        {
          onSuccess: () => onSuccess?.(),
        },
      )
      return
    }

    createCargo(values, {
      onSuccess: () => {
        form.reset()
        onSuccess?.()
      },
    })
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="codigo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código</FormLabel>
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
        <FormField
          control={form.control}
          name="salario_base"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Salário base *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded border p-3">
              <FormLabel>Ativo</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {isCreating || isUpdating ? 'Salvando...' : cargoId ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
