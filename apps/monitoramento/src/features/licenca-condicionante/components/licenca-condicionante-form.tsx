'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { CondicionanteFormValues, formSchema } from '../utils/form-schema'
// import { FileUpload } from '@/components/ui/file-upload'

interface CondicionanteFormProps {
  onSubmit: (data: CondicionanteFormValues & { arquivos?: File[] }) => void
  defaultValues?: Partial<CondicionanteFormValues>
  condicionantes: { id: string; descricao: string }[]
  users: { id: string; username: string }[]
}

export function LicencaCondicionanteForm({
  onSubmit,
  defaultValues,
  condicionantes,
}: CondicionanteFormProps) {
  const form = useForm<CondicionanteFormValues & { arquivos?: File[] }>({
    resolver: zodResolver(formSchema),
    defaultValues
  })

  const condicionante = condicionantes.find((cond) => cond.id === defaultValues?.condicionanteId)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="condicionanteId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Condicionante</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a condicionante" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {condicionantes.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.descricao}
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
          name='dataAtribuicao'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Atribuição</FormLabel>
              <FormControl>
                <Input 
                  type='date'
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="diasAntecedencia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dias de antecedência para notificação (opcional)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ex: 10" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="arquivos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Arquivos (opcional)</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => field.onChange(Array.from(e.target.files || []))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Salvar</Button>
      </form>
    </Form>
  )
}
