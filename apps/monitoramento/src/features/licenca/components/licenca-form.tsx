'use client'

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  FormProvider,
  useForm,
} from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/context/AuthContext";
import { useTiposLicenca } from "@/hooks/use-tipos-licenca";
import { useRouter } from "next/navigation";
import { PessoaType, LicencaType } from "types";
import { toDateString } from '@/lib/utils'
import { OptionType, SelectSearch } from "@/components/select-search";
import { LicencaFormValues, licencaSchema } from "../utils/form-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePessoas } from "@/hooks/use-pessoas";
import { SelectInstance } from "react-select/dist/declarations/src";
import { SelectSearchable } from "@/components/select-searchable";

export default function LicencaForm({
  initialData,
  onSubmit,
  pageTitle,
  modal = false,
}: {
  initialData: LicencaType | null;
  onSubmit?: () => void;
  pageTitle: string;
  modal?: boolean;
}) {
  const queryClient = useQueryClient();
  const { client } = useAuthContext();
  const { data: dataTiposLicenca = [], isLoading: isLoadingTiposLicenca } = useTiposLicenca({ orderBy: 'descricao' })
  const { data: tiposLicenca, error: errorLicencas, total } = dataTiposLicenca
  const [loading, setLoading] = useState(false)
  const defaultValues = {
    id: initialData?.id ?? '',
    tipoLicencaId: initialData?.tipoLicencaId ?? '',
    pessoaId: initialData?.pessoaId ?? '',
    numeroLicenca: initialData?.numeroLicenca ?? '',
    orgaoEmissor: initialData?.orgaoEmissor ?? '',
    status: initialData?.status ?? '',
    dataEmissao: initialData?.dataEmissao ? toDateString(initialData?.dataEmissao) : '',
    dataValidade: initialData?.dataEmissao ? toDateString(initialData?.dataValidade) : '',
  }

  const form = useForm<LicencaFormValues>({
    resolver: zodResolver(licencaSchema),
    defaultValues,
    mode: 'onChange'
  });

  const router = useRouter();

  const {
    control,
  } = form

  // const fullErrors: FieldErrors<Extract<DiretorFormValues, { hasDiretorData: true}>> = errors

  const fields = ['tipoLicencaId', 'numeroLicenca', 'orgaoEmissor', 'status', 'dataEmissao', 'dataValidade']
  
  const statusOptions = [
    { label: "Ativa", value: "ativa" },
    { label: "Inativa", value: "inativa" },
  ];

  const { data: result, isLoading, error } = usePessoas({ 
    orderBy: initialData?.pessoa?.tipo === 'F' ? 'fisica.nome' : 'juridica.nome_fantasia', 
    order: 'asc' 
  })
    
  const pessoas = result && result.data?.map((pessoa: PessoaType) => {
    const { licencas, ...rest } = pessoa
    return rest
  })
  
  
  const optionsPessoas = pessoas?.map((pessoa: any) => {
      return {
        label: pessoa.nome,
        value: pessoa.id
      }
  })

  const filterPessoa = async (inputValue: string) => {
  const response = await client.get('/pessoa/list-all', {
      params: {
        search: inputValue
      }
    })
    const { data } = response.data
  
    return data?.map((pessoa: any) => ({
        label: pessoa.nome,  
        value: pessoa.id
      }))
  }

  const ano = new Date().getFullYear();

  type FieldName = keyof LicencaFormValues;

  async function processForm(data: LicencaFormValues) {
    try {
      const output = await form.trigger(fields as FieldName[], {
        shouldFocus: true
      });
  
      if (!output) return;

      setLoading(true)
      const response = initialData?.id 
          ? await client.put(`/licenca/update/${initialData?.id}`, data) 
          : await client.post('/licenca/create', data)
      const { error, message } = response.data
      if (!error) {
        setLoading(false)
        toast.success(message)
        router.push('/dashboard/licenca')
      } else {
        setLoading(false)
        toast.error(message)
      }
    } catch(error: any) {
      setLoading(false)
      toast.error(error?.message)
    } finally {
      onSubmit && onSubmit()
      await queryClient.invalidateQueries({ queryKey: ["empresas-licencas"] })
    }
  }

  const firstFieldRef = useRef<SelectInstance<OptionType, false> | null>(null)

  useEffect(() => {
      setTimeout(() => {
        if (firstFieldRef.current) {
          firstFieldRef.current.focus()
        }
      }, 150)
  }, [])

  return (<>
    {
        isLoading ? <span>Carregando...</span> :
        (
          <Card>
            {!modal && (
              <CardHeader>
              <CardTitle className='text-left text-2xl font-bold'>
                {pageTitle}
              </CardTitle>
            </CardHeader>
            )}
            <CardContent>
              {!modal && <Separator />}
              <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(processForm)} className='space-y-2' id="form-licenca">
                <div
                    className={modal ? 'w-full flex flex-col md:grid md:grid-cols-2 gap-4 mt-4' : 'gap-4 w-full flex flex-col md:grid md:grid-cols-3 mt-4'}
                  >
                    <div className='col-span-2'>
                      <FormField
                        control={form.control}
                        name="pessoaId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Responsável</FormLabel>
                            <FormControl>
                              <SelectSearch
                                ref={firstFieldRef}
                                defaultOptions={optionsPessoas}
                                loadOptions={filterPessoa}
                                placeholder='Nome'
                                value={optionsPessoas?.find((pessoa: OptionType) => pessoa.value === field.value)}
                                onChange={(v) => form.setValue('pessoaId', v.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  <FormField
                    control={form.control}
                    name={'tipoLicencaId'}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Licença</FormLabel>
                        <Select 
                          onValueChange={field.onChange} value={field.value}
                        >
                          <FormControl>
                          <SelectTrigger
                            disabled={loading}
                          >
                            <SelectValue 
                              placeholder="Selecione o Tipo da Licença" 
                            />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {
                              tiposLicenca.map((tipo: any) => (
                                <SelectItem key={tipo.id} value={tipo.id}>
                                  {tipo.descricao}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={'numeroLicenca'}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número da Licença <span className="text-zinc-500">(Ex: &ldquo;LO-{ano}-0001&rdquo;)</span> </FormLabel>
                        <FormControl>
                          <Input 
                            disabled={loading}
                            {...field} placeholder={`LO-${ano}-0001`} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={'status'}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger
                              disabled={loading}
                            >
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                    name={'orgaoEmissor'}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Órgão Emissor</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={'dataEmissao'}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Emissão</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={'dataValidade'}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Validade</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  { !modal && (
                    <div className='flex flex-row w-full items-center justify-between col-span-4'>
                      <Button 
                        onClick={(e) => {e.preventDefault(); router.back();}}
                        className="mt-4 w-48"
                        variant='outline'
                      >Voltar</Button>
                      <Button 
                        type='submit'
                        className="mt-4 w-48"
                      >Salvar</Button>
                    </div>
                  )}
                  </div>
                </form>
              </FormProvider>
            </CardContent>
          </Card>
        )
      }
  </>
  );
};
