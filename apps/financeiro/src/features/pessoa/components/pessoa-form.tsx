'use client';

// import { FileUploader } from '@/components/file-uploader';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { 
  useForm, 
  useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { InputMasked } from '@/components/input-masked';
import { OptionType, SelectSearchable } from '@/components/select-searchable';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/context/AuthContext';
import { useEstados, useMunicipiosByEstado } from '@/hooks/use-estados';
import { useCreatePessoa, useUpdatePessoa } from '@/hooks/use-pessoas';
import { cn, formatCnpj, formatCpf } from '@/lib/utils';
import { zodV4Resolver } from '@/lib/zod-v4-resolver';

import { PessoaFormValues, pessoaSchema } from '../utils/form-schema';

interface PessoaFormProps {
  slug: string; // ⭐ Adicione esta prop
  initialData?: any;
  onClose?: () => void;
}

export function PessoaForm({ slug, initialData, onClose }: PessoaFormProps) {
  const [loading, setLoading] = useState<boolean>(false)
  const formContainerRef = useRef<HTMLDivElement>(null);
  const { mutateAsync: createPessoaMutate, isPending } = useCreatePessoa(slug)
  const { mutateAsync: updatePessoaMutate, isPending: isPendingUpdate } = useUpdatePessoa(slug)
  const [municipios, setMunicipios] = useState<any[]>([]);

  const isPessoaFisica = (data: any): data is { tipo: 'F'; fisica: any } => {
    return data?.tipo === 'F' && data?.fisica;
  };

  const isPessoaJuridica = (data: any): data is { tipo: 'J'; juridica: any } => {
    return data?.tipo === 'J' && data?.juridica;
  };

  const createDefaultValues = (initialData?: any): PessoaFormValues => {
    const tipoPessoa = initialData?.tipo || 'F';
    const baseValues = {
      telefone: initialData?.telefone || '',
      email: initialData?.email || '',
      endereco: {
        logradouro: initialData?.endereco?.logradouro || '',
        numero: initialData?.endereco?.numero || '',
        complemento: initialData?.endereco?.complemento || '',
        bairro: initialData?.endereco?.bairro || '',
        municipio_id: initialData?.endereco?.municipio_id?.toString() || '209',
        estado_id: initialData?.endereco?.estado_id?.toString() || '4',
        cep: initialData?.endereco?.cep || ''
      }
    };
    
    if (tipoPessoa === 'F') {
      const fisicaData = isPessoaFisica(initialData) ? initialData.fisica : {};
      
      return {
        tipo: 'F' as const,
        fisica: {
          nome: fisicaData?.nome || '',
          rg: fisicaData?.rg || '',
          cpf: fisicaData?.cpf ? formatCpf(fisicaData.cpf) : '',
          data_nascimento: fisicaData?.data_nascimento
            ? new Date(fisicaData.data_nascimento).toISOString().split('T')[0]
            : ''
        },
        // juridica: undefined,
        ...baseValues
      };
    }
  
    const juridicaData = isPessoaJuridica(initialData) ? initialData.juridica : {};
    
    return {
      tipo: 'J' as const,
      juridica: {
        razao_social: juridicaData?.razao_social || '',
        nome_fantasia: juridicaData?.nome_fantasia || '',
        cnpj: juridicaData?.cnpj ? formatCnpj(juridicaData.cnpj) : '',
        inscricao_estadual: juridicaData?.inscricao_estadual || '',
        inscricao_municipal: juridicaData?.inscricao_municipal || '',
        data_abertura: juridicaData?.data_abertura
          ? new Date(juridicaData.data_abertura).toISOString().split('T')[0]
          : ''
      },
      // fisica: undefined,
      ...baseValues
    };
  };

    // Função para trocar o tipo de pessoa e resetar apenas os campos necessários
    const resetFormByType = (novoTipo: 'F' | 'J') => {
      const currentValues = form.getValues();
      
      // Preserva apenas os campos comuns (endereço, email, telefone)
      const newDefaults = createDefaultValues({
        tipo: novoTipo,
        telefone: currentValues.telefone,
        email: currentValues.email,
        endereco: currentValues.endereco
      });
      
      // Reset completo com os novos valores
      form.reset(newDefaults);
      
      setTimeout(() => {
        setFocus(novoTipo === 'F' ? 'fisica.nome' : 'juridica.nome_fantasia');
      }, 50);
    };

  const defaultValues = useMemo(
    () => createDefaultValues(initialData),
    [initialData]
  );

  const form = useForm<PessoaFormValues>({
    resolver: zodV4Resolver(pessoaSchema),
    defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const getCep: any = async (cepField: string) => {
    const cep = cepField.replace(/\D/g, "")
    if (cep.length !== 8) return;

    try {
      const data = await fetch(`https://viacep.com.br/ws/${cep}/json`).then((data) => data.json())
      
      const estado = estados.find((est: any) => est.uf == data.uf)

      form.setValue("endereco.logradouro", data.logradouro)
      form.setValue("endereco.bairro", data.bairro)

      if (estado) {
        form.setValue("endereco.estado_id", estado?.id.toString());
        fetchMunicipiosByEstado(estado?.id);
        const municipio = municipios.find((mun: any) => mun.nome == data.localidade)
        if (municipio) {
          form.setValue("endereco.municipio_id", municipio?.id.toString())
        }
      }
    } catch (error) {
      alert("Erro ao buscar o endereço.")
      console.error(error)
    }
  }

  const { control, setFocus } = form;

  const tipoPessoa = useWatch({
    control: form.control,
    name: "tipo",
  });

  const { mutate: fetchMunicipiosByEstado, error } = useMunicipiosByEstado(setMunicipios);
  const { data: responseEstados }: any = useEstados()
  const { data: estados = [], pagination } = responseEstados ?? { estados: [], pagination: null }

  const optionsEstados = useMemo<OptionType[]>(() => {
    return estados?.map((estado: any) => ({
      label: estado?.uf,
      value: estado?.id.toString()
    }));
  }, [estados]);

  const selectedEstadoId = useWatch({
    control: form.control,
    name: "endereco.estado_id",
  });

  useEffect(() => {
      if (!selectedEstadoId) return;
      fetchMunicipiosByEstado(selectedEstadoId);
  }, [selectedEstadoId, fetchMunicipiosByEstado]);
 
  useLayoutEffect(() => {    
      const timer = setTimeout(() => {
        if (tipoPessoa === 'F') {
          setFocus('fisica.nome');
        } else {
          setFocus('juridica.nome_fantasia');
        }
      }, 500);
      return () => {clearTimeout(timer)};
  }, [setFocus, tipoPessoa]);

  type FieldName = keyof PessoaFormValues;

  // Campos dinâmicos baseados no tipo
  const getFieldsForValidation = (tipo: 'F' | 'J') => {
    const baseFields = ['email', 'telefone', 'endereco.logradouro', 'endereco.complemento', 'endereco.bairro', 'endereco.estado_id', 'endereco.municipio_id', 'endereco.cep'];
    
    if (tipo === 'F') {
      return ['fisica.nome', 'fisica.cpf', ...baseFields];
    } else {
      return ['juridica.razao_social', 'juridica.cnpj', ...baseFields];
    }
  };
  
  const optionsMunicipios = useMemo<OptionType[]>(() => {
    return municipios.map((municipio: any) => ({
      label: municipio?.nome,
      value: municipio?.id.toString()
    }));
  }, [municipios]);

  async function onSubmit(data: PessoaFormValues) {
    try {
        const fieldsToValidate = getFieldsForValidation(data.tipo);
        const output = await form.trigger(fieldsToValidate as FieldName[], {
            shouldFocus: true
        });
        
        if (!output) return;

        if (data.tipo === 'F' && data.fisica?.cpf) {
            data.fisica.cpf = data.fisica.cpf.replace(/\D/g, '');
        }

        if (data.tipo === 'J' && data.juridica?.cnpj) {
            data.juridica.cnpj = data.juridica.cnpj.replace(/\D/g, '');
        }

        setLoading(true);
        const result = pessoaSchema.safeParse(data)
        
        if (initialData?.id) {
          await updatePessoaMutate({ 
            pessoaId: initialData.id, 
            ...data 
          });
        } else {
          await createPessoaMutate(data);
        }
        
        onClose?.();
        
    } catch(error: any) {
        setLoading(false);
        console.log(error?.response)
        toast.error(error?.response?.error);
    } finally {
      setLoading(false);
    }
  }

  // Componente para campos de Pessoa Física
  const PessoaFisicaFields = () => (
    <>
      <div className='col-span-2'>
        <FormField
          control={form.control}
          name='fisica.nome'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder='Digite o nome completo' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name='fisica.rg'
        render={({ field }) => (
          <FormItem>
            <FormLabel>RG</FormLabel>
            <FormControl>
              <Input
                disabled={loading}
                placeholder='Digite o RG'
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='fisica.cpf'
        render={({ field }) => (
          <FormItem>
            <FormLabel>CPF</FormLabel>
            <FormControl>
              <InputMasked 
                mask='___.___.___-__'
                placeholder='000.000.000-00'
                replacement={{ _: /\d/ }}
                disabled={loading}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='fisica.data_nascimento'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data de Nascimento</FormLabel>
            <FormControl>
              <Input
                type='date'
                disabled={loading}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  // Componente para campos de Pessoa Jurídica
  const PessoaJuridicaFields = () => (
    <>
      <div className='col-span-2'>
        <FormField
          control={form.control}
          name='juridica.nome_fantasia'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input
                  disabled={loading}
                  placeholder='Digite o nome fantasia'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name='juridica.razao_social'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Razão Social</FormLabel>
            <FormControl>
              <Input placeholder='Digite a razão social' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='juridica.cnpj'
        render={({ field }) => (
          <FormItem>
            <FormLabel>CNPJ</FormLabel>
            <FormControl>
              <InputMasked 
                mask='__.___.___/____-__'
                placeholder='00.000.000/0000-00'
                replacement={{ _: /\d/ }}
                disabled={loading}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='juridica.inscricao_estadual'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Inscrição Estadual</FormLabel>
            <FormControl>
              <Input
                disabled={loading}
                placeholder='Digite a inscrição estadual'
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='juridica.inscricao_municipal'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Inscrição Municipal</FormLabel>
            <FormControl>
              <Input
                disabled={loading}
                placeholder='Digite a inscrição municipal'
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='juridica.data_abertura'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data de Abertura</FormLabel>
            <FormControl>
              <Input
                type='date'
                disabled={loading}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  return (
    <div ref={formContainerRef} className=''>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id='form-pessoa'>
            <Card>
              <CardContent className='gap-2 grid grid-cols-3 space-y-2 px-4 h-[30rem] overflow-y-auto w-full'>
                <FormField
                  control={form.control}
                  name='tipo'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Pessoa</FormLabel>
                      <Select
                        disabled={loading}
                        onValueChange={(value) => {
                          field.onChange(value);
                          resetFormByType(value as 'F' | 'J');
                        }}
                        value={field.value?.toString()}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Selecione' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className='overflow-y-auto max-h-[20rem]'>
                          {[
                            { label: 'Física', value: 'F'}, 
                            { label: 'Jurídica', value: 'J'}
                          ].map((tipo: OptionType) => (
                            <SelectItem key={tipo.value?.toString()!} value={tipo.value?.toString()!}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campos condicionais baseados no tipo */}
                {tipoPessoa === 'F' ? <PessoaFisicaFields /> : <PessoaJuridicaFields />}

                {/* Campos comuns */}
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder='Digite o email'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='telefone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder='Digite o telefone'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Seção de Endereço */}
                <div className='col-span-3'>
                  <span className='text-md'>Endereço</span>
                  <Separator />
                </div>
                
                <FormField
                  control={form.control}
                  name='endereco.cep'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder='00000-000'
                          {...field}
                          onBlur={(e) => {
                            field.onBlur()
                            getCep(e.target.value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name='endereco.logradouro'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logradouro</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder='Digite o logradouro'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name='endereco.numero'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder='Digite o número'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name='endereco.complemento'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder='Digite o complemento'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name='endereco.bairro'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder='Digite o bairro'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />   
                
                <FormField
                  control={form.control}
                  name='endereco.estado_id'
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>UF</FormLabel>
                      <Select
                        disabled={loading}
                        onValueChange={field.onChange}
                        value={field.value.toString()}
                        // defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Selecione um Estado' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className='overflow-y-auto max-h-[20rem]'>
                          {optionsEstados?.map((estado: OptionType) => (
                            <SelectItem key={estado.value?.toString()!} value={estado.value?.toString()!}>
                              {estado.label}
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
                  name='endereco.municipio_id'
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Município</FormLabel>
                      <SelectSearchable
                        options={optionsMunicipios} 
                        value={field.value.toString()}
                        onValueChange={field.onChange}
                        placeholder="Selecione um município"
                        emptyText="Nenhum município encontrado."
                        searchPlaceholder="Digite para buscar municípios..."
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </form>
        </Form>
    </div>
  );
}