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
import { Switch } from '@/components/ui/switch'
import { useCreateVeiculo } from '@/hooks/use-frota'

const schema = z.object({
  placa: z.string().min(1, 'Informe a placa'),
  modelo: z.string().min(1),
  marca: z.string().min(1),
  ano: z.coerce.number().optional().nullable(),
  tipo: z.string().optional(),
  km_atual: z.coerce.number().optional().nullable(),
  ativo: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

export function VeiculoForm({
  org,
  onSuccess,
}: {
  org: string
  onSuccess?: (veiculoId: string) => void
}) {
  const { mutateAsync, isPending } = useCreateVeiculo(org)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      placa: '',
      modelo: '',
      marca: '',
      ano: undefined,
      tipo: '',
      km_atual: undefined,
      ativo: true,
    },
  })

  const onSubmit = async (data: FormData) => {
    const res = await mutateAsync({
      placa: data.placa.trim().toUpperCase(),
      modelo: data.modelo,
      marca: data.marca,
      ano: data.ano ?? null,
      tipo: data.tipo || null,
      km_atual: data.km_atual ?? null,
      ativo: data.ativo,
    })
    form.reset()
    onSuccess?.(res.veiculoId)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="placa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa</FormLabel>
                <FormControl>
                  <Input placeholder="ABC1D23" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Caminhão, carro…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="marca"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="modelo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="ano"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="km_atual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Km atual</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ativo"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <FormLabel>Ativo</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando…' : 'Cadastrar veículo'}
        </Button>
      </form>
    </Form>
  )
}
