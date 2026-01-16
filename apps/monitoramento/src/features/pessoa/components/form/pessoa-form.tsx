'use client';

import { OptionType, SelectSearchable } from '@/components/select-searchable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/context/AuthContext';
import { cn, formatCpf, formatCnpj, formatCep } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { 
  useFieldArray,
  useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { EstadoType, MunicipioType } from 'types';
import { toDateString } from '@/lib/utils'
import { PessoaFormValues, pessoaSchema } from '../../utils/form-schema';
import LoadingModal from '@/components/loading-modal';
import { motion, AnimatePresence } from "framer-motion";
import { LicencasStep } from './licencas-step';
import ClienteDetails from './pessoa-details';
import { useQueryClient } from '@tanstack/react-query';
import { InputMasked } from '@/components/input-masked';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export default function PessoaForm({
  initialData,
  pageTitle
}: {
  initialData: any | null;
  pageTitle: string;
}) {
  const { client } = useAuthContext();
  const { data: session } = useSession();
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(false)
  const [estados, setEstados] = useState<EstadoType[]>([])
  const [municipios, setMunicipios] = useState<MunicipioType[]>([])
  const [currentStep, setCurrentStep] = useState(0);
  const hasLicencas = initialData?.licencas && initialData?.licencas.length > 0;
  const queryClient = useQueryClient();
  
  const formattedLicencas = initialData?.licencas?.map((licenca: any) => ({
    ...licenca,
    dataEmissao: toDateString(licenca.dataEmissao),
    dataValidade: toDateString(licenca.dataValidade)
  })) ?? [];

  // Determinar tipo de pessoa baseado nos dados iniciais
  const getTipoPessoa = () => {
    if (initialData?.tipo === 'F') {
      return 'fisica' as const;
    }
    if (initialData?.tipo === 'J') {
      return 'juridica' as const;
    }

    return 'fisica' as const; // padrão
  };

  const defaultValues = (() => {
    const tipoPessoa = getTipoPessoa();
    
    const baseDefaults = {
      tipoPessoa,
      email: initialData?.email || '',
      telefone: initialData?.telefone || '',
      endereco: {
        logradouro: initialData?.endereco?.logradouro || '',
        numero: initialData?.endereco?.numero || '',
        complemento: initialData?.endereco?.complemento || '',
        bairro: initialData?.endereco?.bairro || '',
        municipioId: initialData?.endereco?.municipioId || 209,
        estadoId: initialData?.endereco?.estadoId || 4,
        cep: initialData?.endereco?.cep ? formatCep(initialData?.endereco?.cep) : ''
      },
      ...(hasLicencas
        ? {
            hasLicencaData: true as const,
            licencas: formattedLicencas
          }
        : {
            hasLicencaData: false as const
          })
    };

    if (tipoPessoa === 'fisica') {
      return {
        ...baseDefaults,
        tipoPessoa: 'fisica' as const,
        nome: initialData?.fisica?.nome || '',
        cpf: initialData?.fisica?.cpf ? formatCpf(initialData?.fisica?.cpf) : '',
        rg: initialData?.fisica?.rg || '',
        orgaoEmissorRg: initialData?.fisica?.orgaoEmissorRg || '',
        dataNascimento: initialData?.fisica?.dataNascimento ? toDateString(initialData?.fisica?.dataNascimento) : '',
        estadoCivil: (initialData?.fisica?.estado_civil as 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | 'outro') || 'solteiro',
        sexo: (initialData?.fisica?.sexo as 'M' | 'F') || 'M',
        profissao: initialData?.fisica?.profissao || ''
      };
    } else {
      return {
        ...baseDefaults,
        tipoPessoa: 'juridica' as const,
        nomeFantasia: initialData?.juridica?.nomeFantasia || '',
        razaoSocial: initialData?.juridica?.razaoSocial || '',
        cnpj: initialData?.juridica?.cnpj ? formatCnpj(initialData?.juridica?.cnpj) : '',
        inscricaoEstadual: initialData?.juridica?.inscricaoEstadual || '',
        inscricaoMunicipal: initialData?.juridica?.inscricaoMunicipal || '',
        dataAbertura: initialData?.juridica?.dataAbertura ? toDateString(initialData?.juridica?.dataAbertura) : '',
        naturezaJuridica: initialData?.juridica?.naturezaJuridica || '',
        porte: (initialData?.juridica?.porte as 'MEI' | 'ME' | 'EPP' | 'GRANDE') || 'ME'
      };
    }
  })();

  const form = useForm<PessoaFormValues>({
    resolver: zodResolver(pessoaSchema),
    defaultValues,
    mode: 'onChange'
  });

  const {
    formState: { errors },
    control,
    watch,
    setValue,
    reset,
    setFocus
  } = form;

  const formData = form.getValues()
  const tipoPessoa = watch("tipoPessoa");

  type FieldName = keyof PessoaFormValues;

  const loadEstados = useCallback(async () => {
    if (typeof session !== typeof undefined) {
      const response = await client.get('/estado/list-all?orderBy=nome&order=asc')
      const { data: estados } = response.data
      setEstados(estados)
    }
  }, [session, client])

  const loadMunicipios = useCallback(async () => {
    const responseMunicipios = await client.get(`/estado/list-municipios/${form.getValues('endereco.estadoId')}`)
      const { data: municipios } = responseMunicipios.data
      setMunicipios(municipios)
  }, [client, form])

  useEffect(() => {
    loadEstados()
    loadMunicipios()
    
  }, [loadEstados, loadMunicipios])

  // Reset form quando mudar tipo de pessoa
  useEffect(() => {
    if (tipoPessoa && !initialData) {
      const newDefaults = {
        tipoPessoa,
        email: '',
        telefone: '',
        hasLicencaData: false as const,
        endereco: {
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          municipioId: 209,
          estadoId: 4,
          cep: ''
        }
      };

      if (tipoPessoa === 'fisica') {
        const resetData = {
          ...newDefaults,
          tipoPessoa: 'fisica' as const,
          nome: '',
          cpf: '',
          rg: '',
          sexo: 'M' as const, // Definir valor padrão válido
          orgaoEmissorRg: '',
          dataNascimento: '',
          estadoCivil: 'solteiro' as const, // Definir valor padrão válido
          profissao: ''
        };
        
        reset(resetData);
      } else {
        const resetData = {
          ...newDefaults,
          tipoPessoa: 'juridica' as const,
          nomeFantasia: '',
          razaoSocial: '',
          cnpj: '',
          inscricaoEstadual: '',
          inscricaoMunicipal: '',
          dataAbertura: '',
          naturezaJuridica: '',
          porte: 'ME' as const // Definir valor padrão válido
        };

        reset(resetData);
      }
    }

    setTimeout(() => {
      if (tipoPessoa === 'fisica') {
        setFocus('nome');
      } else if (tipoPessoa === 'juridica') {
        setFocus('nomeFantasia');
      }
    }, 0);
  }, [tipoPessoa, reset, initialData, setFocus, setValue]);

  const optionsMunicipios : OptionType[] = municipios?.map((municipio: any) => {
      return {
          label: municipio?.nome,
          value: municipio?.id
      }
  })

  function getSelectedMunicipio(id: number) {
    return optionsMunicipios.find((option: any) => option.value === id)
  }

  const optionsEstados : OptionType[] = estados?.map((estado: any) => {
      return {
          label: estado?.nome,
          value: estado?.id
      }
  })

  const selectMunicipio: MunicipioType | undefined = municipios.find((municipio: MunicipioType) => municipio.id === formData.endereco.municipioId)

  async function onSubmit(data: PessoaFormValues) {
    const { endereco, ...rest } = data
    try {
      setLoading(true)
      const response = initialData?.id 
          ? await client.put(`/pessoa/update/${initialData?.id}`, { ...rest, endereco: { ...endereco, cep: endereco.cep ? endereco.cep.replace(/\D/g, '') : '' }}) 
          : await client.post('/pessoa/create', { ...rest, endereco: { ...endereco, cep: endereco.cep ? endereco.cep.replace(/\D/g, '') : '' }})
      const { error, message } = response.data
      
      if (!error) {
        toast.success(message)
        await queryClient.invalidateQueries({ queryKey: ['pessoas'] })
        await queryClient.invalidateQueries({ queryKey: ['dashboard-totals'] })
        router.push('/dashboard/pessoa')
      } else {
        toast.error(message)
        setLoading(false)
      }
    } catch(error: any) {
      toast.error(error?.message)
    } finally {
      setLoading(false)
    }
  }

  const getFieldsForStep = (step: number): (keyof PessoaFormValues)[] => {
    const baseFields = ['email', 'telefone', 'endereco.logradouro', 'endereco.complemento', 'endereco.bairro', 'endereco.municipioId', 'endereco.estadoId', 'endereco.cep'] as (keyof PessoaFormValues)[];
    
    switch (step) {
      case 0:
        if (tipoPessoa === 'fisica') {
          return ['tipoPessoa', 'nome', 'cpf', 'rg', 'orgaoEmissorRg', 'dataNascimento', 'estadoCivil', 'profissao', 'sexo', ...baseFields] as any;
        } else {
          return ['tipoPessoa', 'nomeFantasia', 'razaoSocial', 'cnpj', 'inscricaoEstadual', 'inscricaoMunicipal', 'dataAbertura', 'naturezaJuridica', 'porte', ...baseFields] as any;
        }
      case 1:
        const licencaFields: (keyof PessoaFormValues)[] = ['hasLicencaData'];
        const currentLicencas = form.getValues('licencas') || [];
        currentLicencas.forEach((_, i) => {
          licencaFields.push(
            `licencas.${i}.tipoLicencaId` as keyof PessoaFormValues,
            `licencas.${i}.numeroLicenca` as keyof PessoaFormValues,
            `licencas.${i}.status` as keyof PessoaFormValues,
            `licencas.${i}.orgaoEmissor` as keyof PessoaFormValues,
            `licencas.${i}.dataEmissao` as keyof PessoaFormValues,
            `licencas.${i}.dataValidade` as keyof PessoaFormValues
          );
        });
        return licencaFields;
      default:
        return [];
    }
  }

  const next = async () => {
    const fields = getFieldsForStep(currentStep);
    
    const output = await form.trigger(fields, {
      shouldFocus: true
    });

    if (!output) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1);
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
    }
  };
  
  const { fields } = useFieldArray({
    control,
    name: 'licencas'
  });

  const steps = [
    {
      id: 'Etapa 1',
      name: 'Informações Básicas',
      fields: []
    },
    {
      id: 'Etapa 2', 
      name: 'Licenças',
      fields: []
    },
    { id: 'Etapa 3', name: 'Revisão' }
  ];

  const getCep: any = async (cepField: string) => {
    const cep = cepField.replace(/\D/g, "")
    if (cep.length !== 8) return;

    try {
      const data = await fetch(`https://viacep.com.br/ws/${cep}/json`).then((data) => data.json())
      
      const estado = estados.find((est: any) => est.uf == data.uf)

      setValue("endereco.logradouro", data.logradouro)
      setValue("endereco.bairro", data.bairro)

      if (estado) {
        setValue("endereco.estadoId", estado?.id);
        loadMunicipios();
        const municipio = municipios.find((mun: any) => mun.nome == data.localidade)
        if (municipio) {
          setValue("endereco.municipioId", municipio?.id)
        }
      }
    } catch (error) {
      alert("Erro ao buscar o endereço.")
      console.error(error)
    }
  }

  const hasLicencaData = watch("hasLicencaData");
  useEffect(() => {
    if (
      hasLicencaData &&
      "licencas" in errors &&
      Array.isArray((errors as any).licencas)
    ) {
      const licencaErrors = (errors as any).licencas as Array<any>;

      for (let i = 0; i < licencaErrors.length; i++) {
        const licencaError = licencaErrors[i];
        if (licencaError) {
          const fieldKeys = Object.keys(licencaError);
          if (fieldKeys.length > 0) {
            const firstErrorField = fieldKeys[0];
            const fieldPath = `licencas.${i}.${firstErrorField}`;
            form.setFocus(fieldPath as any);
            return;
          }
        }
      }
    }
  }, [hasLicencaData, form, errors])

  const renderTipoPessoaStep = () => (
    <>
      {/* Seletor de tipo de pessoa */}
      <div className='col-span-5 mb-4'>
        <FormField
          control={form.control}
          name='tipoPessoa'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fisica" id="fisica" />
                    <Label htmlFor="fisica">Pessoa Física</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="juridica" id="juridica" />
                    <Label htmlFor="juridica">Pessoa Jurídica</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      { tipoPessoa === 'fisica' && (
        <>
            <div className='col-span-2'>
            <FormField
              control={form.control}
              name='nome'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder='Nome do cliente' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div>
            <FormField
              control={form.control}
              name='cpf'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <InputMasked 
                      mask='___.___.___-__'
                      placeholder='000.000.000-00'
                      replacement={{ _: /\d/ }}
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
              name='rg'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RG</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='orgaoEmissorRg'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Órgão Emissor RG</FormLabel>
                  <FormControl>
                    <Input placeholder='SSP/SP' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          
            <FormField
              control={form.control}
              name='sexo'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'M'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Selecione o sexo' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='M'>Masculino</SelectItem>
                      <SelectItem value='F'>Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='dataNascimento'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          
            <FormField
              control={form.control}
              name='estadoCivil'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Civil</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || 'solteiro'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Selecione o estado civil' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='solteiro'>Solteiro(a)</SelectItem>
                      <SelectItem value='casado'>Casado(a)</SelectItem>
                      <SelectItem value='divorciado'>Divorciado(a)</SelectItem>
                      <SelectItem value='viuvo'>Viúvo(a)</SelectItem>
                      <SelectItem value='uniao_estavel'>União Estável</SelectItem>
                      <SelectItem value='outro'>Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='col-span-2'>
              <FormField
                control={form.control}
                name='profissao'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profissão</FormLabel>
                    <FormControl>
                      <Input placeholder='Profissão' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
        </>
      )}  
          
      {/* Campos específicos para Pessoa Física */}
      {tipoPessoa === 'juridica' && (
        <>
          <div className='col-span-2'>
            <FormField
              control={form.control}
              name='nomeFantasia'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder='Nome da empresa' {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='col-span-2'>
            <FormField
              control={form.control}
              name='razaoSocial' // ADICIONAR campo razaoSocial
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razão Social</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder='Razão Social da empresa' 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
            <div>
            <FormField
              control={form.control}
              name='cnpj'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <InputMasked 
                      mask='__.___.___/____-__'
                      placeholder='00.000.000/0000-00'
                      replacement={{ _: /\d/ }}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='col-span-2'>
            <FormField
              control={form.control}
              name='inscricaoEstadual'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inscrição Estadual</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder='Inscrição Estadual' 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='col-span-2'>
            <FormField
              control={form.control}
              name='inscricaoMunicipal'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inscrição Municipal</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder='Inscrição Municipal' 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div>
            <FormField
              control={form.control}
              name='dataAbertura'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Abertura</FormLabel>
                  <FormControl>
                    <Input 
                      type='date' 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='col-span-2'>
            <FormField
              control={form.control}
              name='naturezaJuridica'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Natureza Jurídica</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder='Natureza Jurídica' 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='col-span-2'>
            <FormField
              control={form.control}
              name='porte'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Porte da Empresa</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || 'ME'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Selecione o porte' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='ME'>Micro Empresa</SelectItem>
                      <SelectItem value='MEI'>MEI</SelectItem>
                      <SelectItem value='EPP'>Empresa de Pequeno Porte</SelectItem>
                      <SelectItem value='GRANDE'>Grande Empresa</SelectItem>
                      <SelectItem value='MEDIA'>Média Empresa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </>
      )}

      {/* Campos comuns */}
      <div className='col-span-2'>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type='email'
                  placeholder='email@exemplo.com'
                  disabled={loading}
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
        name='telefone'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Telefone</FormLabel>
            <FormControl>
              <InputMasked 
                mask='(__) _____-____'
                placeholder='(00) 00000-0000'
                replacement={{ _: /\d/ }}
                {...field}
                disabled={loading}
                onBlur={(e) => {
                  field.onBlur()
                  getCep(e.target.value)
                }}
              />
              {/* <Input
                placeholder='(00) 00000-0000'
                disabled={loading}
                {...field}
              /> */}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Seção de Endereço */}
      <div className='col-span-5 my-2'>
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
              <InputMasked 
                mask='_____-___'
                placeholder='00000-000'
                replacement={{ _: /\d/ }}
                {...field}
                disabled={loading}
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
      <div className='col-span-3'>
        <FormField
          control={form.control}
          name='endereco.logradouro'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logradouro</FormLabel>
              <FormControl>
                <Input
                  disabled={loading}
                  placeholder='Rua, Avenida, etc.'
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
        name='endereco.numero'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Número</FormLabel>
            <FormControl>
              <Input
                disabled={loading}
                placeholder='123'
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className='col-span-2'>
        <FormField
          control={form.control}
          name='endereco.complemento'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Complemento</FormLabel>
              <FormControl>
                <Input
                  disabled={loading}
                  placeholder='Apt, Sala, etc.'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className='col-span-2'>
        <FormField
          control={form.control}
          name='endereco.bairro'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bairro</FormLabel>
              <FormControl>
                <Input
                  disabled={loading}
                  placeholder='Nome do bairro'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div></div>
      <div className='col-span-2'>
        <FormField
          control={form.control}
          name='endereco.estadoId'
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>UF</FormLabel>
              <Select
                disabled={loading}
                onValueChange={(value) => {field.onChange(Number(value)); loadMunicipios()} }
                value={String(field.value)}
                defaultValue={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder='Selecione um Estado'
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className='overflow-y-auto max-h-[20rem]'>
                  {optionsEstados?.map((estado: any) => (
                    <SelectItem key={estado.value} value={estado.value.toString()}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className='col-span-2'>
        <FormField
          control={form.control}
          name='endereco.municipioId'
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Município</FormLabel>
              <SelectSearchable 
                callback={(e) => { form.setValue('endereco.municipioId', e.value) }} 
                options={optionsMunicipios} 
                field={getSelectedMunicipio(field.value)} 
                placeholder="Selecione um Município..."
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
 
  return (
    <>
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
            {pageTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <ul className='flex gap-4'>
              {steps.map((step, index) => (
                <li key={step.name} className='md:flex-1'>
                  {currentStep > index ? (
                    <div className='group flex w-full flex-col border-l-4 border-sky-600 py-2 pl-4 transition-colors md:border-t-4 md:border-l-0 md:pt-4 md:pb-0 md:pl-0'
                    >
                      <span className='text-sm font-medium text-sky-600 transition-colors'
                      >
                        {step.id}
                      </span>
                      <span className='text-sm font-medium hover:cursor-pointer'
                        onClick={() => setCurrentStep(index)}
                      >{step.name}</span>
                    </div>
                  ) : currentStep === index ? (
                    <div
                      className='flex w-full flex-col border-l-4 border-sky-600 py-2 pl-4 md:border-t-4 md:border-l-0 md:pt-4 md:pb-0 md:pl-0'
                      aria-current='step'
                    >
                      <span className='text-sm font-medium text-sky-600'>
                        {step.id}
                      </span>
                      <span className='text-sm font-medium hover:cursor-pointer'
                        onClick={() => setCurrentStep(index)}
                      >{step.name}</span>
                    </div>
                  ) : (
                    <div className='group flex h-full w-full flex-col border-l-4 border-gray-200 py-2 pl-4 transition-colors md:border-t-4 md:border-l-0 md:pt-4 md:pb-0 md:pl-0'>
                      <span className='text-sm font-medium text-gray-500 transition-colors'>
                        {step.id}
                      </span>
                      <span className='text-sm font-medium hover:cursor-pointer'
                        onClick={() => setCurrentStep(index)}
                      >{step.name}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <Separator />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="w-full"
                >
                  <div
                    className={cn(
                      currentStep === 1
                        ? 'w-full md:inline-block'
                        : 'md:grid md:grid-cols-5',
                        'gap-2 mt-4'
                    )}
                  >
                    {currentStep === 0 && renderTipoPessoaStep()}
                    
                    {currentStep === 1 && (
                      <div className='col-span-3'>
                        <LicencasStep licencas={form.getValues('licencas')} />
                      </div>                  
                    )}
                  </div>
                  
                  {currentStep === 2 && (
                    <ClienteDetails data={
                      { ...formData, municipio: selectMunicipio } 
                    } />
                  )}
                </motion.div>
              </AnimatePresence>
          
              {/* Navigation */}
              <div className='mt-8 pt-5'>
                <div className='flex justify-between'>
                  <button
                    type='button'
                    onClick={() => {currentStep === 0 ? router.back() : prev() }}
                    className='rounded bg-white px-2 py-1 text-sm font-semibold text-sky-900 ring-1 shadow-xs ring-sky-300 ring-inset hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth='1.5'
                      stroke='currentColor'
                      className='h-6 w-6'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M15.75 19.5L8.25 12l7.5-7.5'
                      />
                    </svg>
                  </button>
                  { currentStep < steps.length - 1 ? (
                    <button
                      type='button'
                      onClick={next}
                      disabled={currentStep === steps.length - 1}
                      className='rounded bg-white px-2 py-1 text-sm font-semibold text-sky-900 ring-1 shadow-xs ring-sky-300 ring-inset hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth='1.5'
                      stroke='currentColor'
                      className='h-6 w-6'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M8.25 4.5l7.5 7.5-7.5 7.5'
                      />
                    </svg>
                  </button>
                  ) : (
                    <>
                    <Button 
                      type='submit'
                      disabled={loading}
                    >
                      {loading ? 'Salvando...' : 'Salvar Cliente'}
                    </Button>
                    </>
                  ) }
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <LoadingModal show={loading} />
    </>
  );
}