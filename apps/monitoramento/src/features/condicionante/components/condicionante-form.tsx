'use client'
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CondicionanteFormValues, condicionanteSchema } from "../utils/form-schema";
import { useForm, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Props {
  pageTitle?: string;
  defaultValues?: Partial<CondicionanteFormValues> & { id: string };
  isSubmitting?: boolean;
  onClose?: () => void
}

const tiposCondicionantes = [
    { label: "Monitoramento", value: "monitoramento" }, 
    { label: "Relatório", value: "relatorio"}, 
    { label: "Mitigadora", value: "mitigadora"}, 
    { label: "Compensatória", value: "compensatoria"}, 
    { label: "Legal", value: "legal" }, 
    { label: "Outro", value: "outro" }
];

const frequenciasCondicionantes = [
    { label: "Eventual", value: "eventual" },
    { label: "Contínua", value: "continua" },
    { label: "Única", value: "unica" }, 
    { label: "Periódica", value: "periodica" }
];

const fields = ['descricao', 'tipo', 'frenquencia', 'prazoDias']

export function CondicionanteForm({ onClose, defaultValues, isSubmitting }: Props) {
  const [loading, setLoading] = useState<boolean>(false);
  const form = useForm<CondicionanteFormValues>({
    resolver: zodResolver(condicionanteSchema),
    defaultValues: {
      descricao: defaultValues?.descricao ?? '',
      tipo: defaultValues?.tipo ?? undefined,
      frequencia: defaultValues?.frequencia ?? undefined,
      prazoDias: defaultValues?.prazoDias ?? 0,
    },
  });

  const frequencia = useWatch({ name: 'frequencia', control: form.control })

  const { client } = useAuthContext()
  const router = useRouter();
  const queryClient = useQueryClient();

  type FieldName = keyof CondicionanteFormValues;

  async function onSubmit(data: CondicionanteFormValues) {
    try {
      const output = await form.trigger(fields as FieldName[], {
        shouldFocus: true
      });
  
      if (!output) return;

      setLoading(true)
      const response = defaultValues?.id 
          ? await client.put(`/condicionante/update/${defaultValues?.id}`, data) 
          : await client.post('/condicionante/create', data)
      const { error, message } = response.data
      if (!error) {
        setLoading(false)
        toast.success(message)
        router.push('/dashboard/condicionante')
      } else {
        setLoading(false)
        toast.error(message)
      }
    } catch(error: any) {
      setLoading(false)
      toast.error(error?.message)
    } finally {
      onClose && onClose();
      await queryClient.invalidateQueries({ queryKey: ["condicionantes"] })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-2' id="form-condicionante">
      <div
          className='w-full flex flex-col md:grid md:grid-cols-3 gap-4 mt-4'
        >
          <div className="md:col-span-3">
          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Input placeholder="Descrição da condicionante" {...field} />
                </FormControl>
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
              <FormLabel>Tipo</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposCondicionantes.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="frequencia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frequência</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequenciasCondicionantes.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        { frequencia === 'eventual' && (
          <FormField
            control={form.control}
            name="prazoDias"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prazo (em dias)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ex: 30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) }
        </div>
      </form>
    </Form>
  );
}
