'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useEffect } from 'react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { formSchema } from '../utils/form-schema'
import { toDateString } from '@/lib/utils'
import { CondicionanteFrequenciaType } from 'types'
const meses = [
  { label: 'Jan', value: 1 },
  { label: 'Fev', value: 2 },
  { label: 'Mar', value: 3 },
  { label: 'Abr', value: 4 },
  { label: 'Mai', value: 5 },
  { label: 'Jun', value: 6 },
  { label: 'Jul', value: 7 },
  { label: 'Ago', value: 8 },
  { label: 'Set', value: 9 },
  { label: 'Out', value: 10 },
  { label: 'Nov', value: 11 },
  { label: 'Dez', value: 12 },
]

export type EditLicencaCondicionanteFormData = z.infer<typeof formSchema>

interface EditCondicionanteDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: EditLicencaCondicionanteFormData) => void
  initialData?: Partial<EditLicencaCondicionanteFormData>
  condicionantesDisponiveis: { id: string; descricao: string, frequencia: CondicionanteFrequenciaType }[]
}

export function EditLicencaCondicionanteDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  condicionantesDisponiveis
}: EditCondicionanteDialogProps) {
  const form = useForm<EditLicencaCondicionanteFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
  })

  const {
    handleSubmit,
    setValue,
    reset,
    watch,
    control,
    formState: { errors }
  } = form

  const condicionanteId = watch('condicionanteId')
  const hasUnicaCondicionante = useWatch({ name: 'hasUnicaCondicionante', control })

  const condicionante = condicionantesDisponiveis.find((cond) => cond.id === condicionanteId)

  const vencimentos = watch('meses') || []

  const toggleMes = (mes: number, checked: boolean) => {
    const atualizados = checked
      ? [...vencimentos, mes]
      : vencimentos.filter((v) => v !== mes)
    
    setValue('meses', atualizados)
  }

  useEffect(() => {
    if (open) {
      reset(initialData)
    }
  }, [open, initialData, reset])

  useEffect(() => {
    if (condicionante) {
      setValue('frequencia', condicionante.frequencia)
      if (condicionante.frequencia === 'unica') { 
        setValue('hasUnicaCondicionante', true) 
      } else {
        setValue('hasUnicaCondicionante', false)
      }
    }
  }, [condicionante, setValue])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {initialData?.condicionanteId ? 'Editar Condicionante' : 'Adicionar Condicionante'}
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={control}
            name='condicionanteId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condicionante</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="truncate">
                      <span className="truncate block max-w-[25rem] md:max-w-[41.5rem] whitespace-nowrap overflow-hidden">
                        {
                          condicionantesDisponiveis.find(opt => opt.id === field.value)?.descricao ??
                          'Selecione a condicionante'
                        }
                      </span>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent 
                    className="max-h-84 md:max-h-72 max-w-[var(--radix-select-trigger-width)] overflow-y-auto w-[var(--radix-select-trigger-width)]"
                  >
                    {condicionantesDisponiveis.map((opt) => (
                      <SelectItem 
                        key={opt.id} 
                        value={opt.id}  
                      >
                        {opt.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={control}
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
              control={control}
              name='diasAntecedencia'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dias de antecedência p/ notificar</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder='Ex: 15'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
            {hasUnicaCondicionante && (
                <FormField
                  control={control}
                  name='dataVencimento'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Vencimento</FormLabel>
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
            )}
            </div>
            {condicionante?.frequencia === 'periodica' && (
              <div className='col-span-2 w-full'>
                <Label>Vencimentos</Label>
                <div className="grid grid-cols-4 gap-4">
                  {meses.map((mes) => {
                    const selecionado = vencimentos.find((v) => v === mes.value)
                    return (
                      <div key={mes.value} className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={!!selecionado}
                            onCheckedChange={(val: boolean) => toggleMes(mes.value, val)}
                          />
                          <span>{mes.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
