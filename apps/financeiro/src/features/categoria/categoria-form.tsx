'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { Textarea } from '@/components/ui/textarea'
import { useCategoria,useCreateCategoria, useUpdateCategoria } from '@/hooks/use-categoria'
import { getCategorias } from '@/http/categoria/get-categorias'

const categoriaSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  tipo: z.enum(['RECEITA', 'DESPESA']),
  nivel: z.coerce.number().default(1),
  parent_id: z.string().uuid().optional().or(z.literal('')),
  ativo: z.boolean().default(true),
})

type CategoriaFormData = z.infer<typeof categoriaSchema>

interface CategoriaFormProps {
  categoriaId?: string
  onSuccess?: () => void
}

export function CategoriaForm({ categoriaId, onSuccess }: CategoriaFormProps) {
  const { slug } = useParams<{ slug: string }>()
  const { data: categoria } = useCategoria(slug!, categoriaId || '', !!categoriaId)
  const { data: categoriasData } = useQuery({
    queryKey: ['categorias', slug],
    queryFn: () => getCategorias(slug!),
    enabled: !!slug,
  })
  const { mutate: createCategoria, isPending: isCreating } = useCreateCategoria(slug!)
  const { mutate: updateCategoria, isPending: isUpdating } = useUpdateCategoria(slug!)

  const categorias = categoriasData?.categorias || []
  const categoriasMesmoTipo = categorias.filter(
    (c) => c.id !== categoriaId && c.tipo === (categoria?.tipo || 'RECEITA')
  )

  const form = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      codigo: '',
      nome: '',
      descricao: '',
      tipo: 'RECEITA',
      nivel: 1,
      parent_id: '',
      ativo: true,
    },
  })

  const tipo = form.watch('tipo')

  useEffect(() => {
    if (categoria) {
      form.reset({
        codigo: categoria.codigo,
        nome: categoria.nome,
        descricao: categoria.descricao || '',
        tipo: categoria.tipo,
        nivel: categoria.nivel,
        parent_id: categoria.parent_id || '',
        ativo: categoria.ativo,
      })
    }
  }, [categoria, form])

  useEffect(() => {
    // Atualizar lista de categorias pai quando tipo mudar
    form.setValue('parent_id', '')
  }, [tipo, form])

  const onSubmit = (data: CategoriaFormData) => {
    const submitData = {
      ...data,
      parent_id: data.parent_id || undefined,
    }

    if (categoriaId) {
      updateCategoria(
        { id: categoriaId, data: submitData },
        {
          onSuccess: () => {
            onSuccess?.()
          },
        }
      )
    } else {
      createCategoria(submitData, {
        onSuccess: () => {
          form.reset()
          onSuccess?.()
        },
      })
    }
  }

  const categoriasPaiFiltradas = categoriasMesmoTipo.filter(
    (c) => c.tipo === tipo && c.id !== categoriaId
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="RECEITA">Receita</SelectItem>
                  <SelectItem value="DESPESA">Despesa</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nivel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nível</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria Pai</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria pai (opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {categoriasPaiFiltradas.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.codigo} - {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
              : categoriaId
              ? 'Atualizar'
              : 'Criar'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
