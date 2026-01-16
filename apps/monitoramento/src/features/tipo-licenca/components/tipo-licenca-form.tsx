'use client'
import { useForm } from "react-hook-form";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { TipoLicencaFormValues, tipoLicencaSchema } from "../utils/form-schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  defaultValues?: Partial<TipoLicencaFormValues> & { id?: string };
  onClose?: () => void;
}

export function TipoLicencaForm({ defaultValues, onClose }: Props) {
  const form = useForm<TipoLicencaFormValues>({
    resolver: zodResolver(tipoLicencaSchema),
    defaultValues: {
      nome: defaultValues?.nome ?? "",
      descricao: defaultValues?.descricao ?? ""
    },
  });

  const { client } = useAuthContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function onSubmit(data: TipoLicencaFormValues) {
    
    const isValid = await form.trigger();
    if (!isValid) return;

    setLoading(true);
    try {
      const response = defaultValues?.id
        ? await client.put(`/tipo-licenca/update/${defaultValues.id}`, data)
        : await client.post(`/tipo-licenca/create`, data);
      
      const { error, message } = response.data;
      if (!error) {
        toast.success(message);
        // router.push("/dashboard/user");
      } else {
        toast.error(message);
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar tipo da licença");
    } finally {
      setLoading(false);
      onClose?.();
      await queryClient.invalidateQueries({ queryKey: ["tipos-licenca"] });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="form-tipo-licenca">
        <div
            className='w-full flex flex-col md:grid md:grid-cols-2 gap-4 mt-4'
          >
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: LO" {...field} />
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
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Licença de Operação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
      </form>
    </Form>
  );
}
