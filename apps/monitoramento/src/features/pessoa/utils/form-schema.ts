import { isValidCnpj, isValidCpf } from '@/lib/utils';
import { validate } from 'uuid';
import * as z from 'zod';

type optionFieldMinType = {
  field: string,
  min?: number | null,
  type?: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const cnpjRegex = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;
const rgRegex = /^[\d\w.-]+$/;

const optionalFieldMin = ({ field, min, type = "string" }: optionFieldMinType) => {
  switch(type) {
    case "string": 
      return z.string()
        .optional()
        .refine((val) => !val || val.length >= min!, {
          message: `O campo '${field}' deve ter ao menos ${min} caracteres, se preenchido.`,
        });
    case "number":
      return z.literal("")
      .transform(() => undefined)
      .or(z.number().transform((value: any) => value ?? NaN))
      .or(z.coerce.number().positive());
    case "email": 
      return z.string()
          .optional()
          .refine(
            (val) => !val || val.length >= min!, {
            message: `O campo '${field}' deve ter ao menos ${min} caracteres, se preenchido.`,
          }).refine((val: any) => !val || emailRegex.test(val), {
            message: "O email informado está inválido",
          })
    default:
      return z.string().optional()
        .refine((val) => !val || val.length >= min!, {
          message: `O campo '${field}' deve ter ao menos ${min} caracteres, se preenchido.`,
        })
  }
}

// Schema base para endereço (comum para PF e PJ)
const enderecoSchema = z.object({
  logradouro: optionalFieldMin({ field: "logradaouro", min: 4 }),
  numero: z.string().optional(),
  complemento: optionalFieldMin({ field: "complemento", min: 4 }),
  bairro: optionalFieldMin({ field: "bairro", min: 3 }),
  municipioId: z.number({ required_error: 'O campo município é obrigatório' }).int(),
  estadoId: z.number({ required_error: 'O campo estado é obrigatório' }).int(),
  cep: optionalFieldMin({ field: "cep", min: 8 }),
});

// Schema para licenças (pode ser usado por ambos)
const licencaItemSchema = z.object({
  id: z.string().optional(),
  tipoLicencaId: z.string().min(1, { message: 'O campo tipo licença é obrigatório' }),
  getNumeroLicencaAuto: z.boolean().optional(),
  numeroLicenca: z.string().min(1, 'O campo número da licença é obrigatório'),
  status: z.string().min(1, { message: 'Por favor selecione o status' }),
  orgaoEmissor: z.string().min(1, { message: 'O orgão de emissão é obrigatório' }),
  dataEmissao: z.string().refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'Data de emissão deve ter o formato DD/MM/YYYY'
  }),
  dataValidade: z.string().refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'Data de validade deve ter o formato DD/MM/YYYY'
  })
}).superRefine((data, ctx) => {
  if (!data.getNumeroLicencaAuto && (!data.numeroLicenca || data.numeroLicenca.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'O número da licença é obrigatório quando preenchimento automático está desativado.',
      path: ['numeroLicenca'],
    });
  }
});

const licencaDataSchema = z.discriminatedUnion("hasLicencaData", [
  z.object({
    hasLicencaData: z.literal(true),
    licencas: z.array(licencaItemSchema)
  }),
  z.object({
    hasLicencaData: z.literal(false)
  })
]);

// Schema para Pessoa Física
const pessoaFisicaSchema = z.object({
  tipoPessoa: z.literal("fisica"),
  nome: z.string()
    .nonempty('O nome é obrigatório')
    .min(2, { message: 'O nome deve conter pelo menos 2 caracteres' }),
  cpf: z.string()
    .min(11, 'CPF é obrigatório')
    .refine((val) => isValidCpf(val), {
      message: 'CPF inválido',
    }),
  rg: z.string()
    .min(1, 'RG é obrigatório')
    .refine((val) => rgRegex.test(val), {
      message: 'RG deve conter apenas números, letras, pontos e hífens',
    }),
  orgaoEmissorRg: z.string()
    .min(2, 'Órgão emissor do RG é obrigatório').optional(),
  dataNascimento: z.string()
    .optional()
    .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: 'Data de abertura deve ter o formato DD/MM/YYYY'
    }),
  estadoCivil: z.enum(['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel', 'outro'], {
    required_error: 'Estado civil é obrigatório'
  }).optional(),
  sexo: z.enum(['M', 'F'], {
    required_error: 'Sexo é obrigatório'
  }).optional(),
  profissao: optionalFieldMin({ field: "profissao", min: 2 }),
  email: optionalFieldMin({ field: "email", min: 5, type: "email" }),
  telefone: optionalFieldMin({ field: "telefone", min: 10 }),
  endereco: enderecoSchema
});

// Schema para Pessoa Jurídica
const pessoaJuridicaSchema = z.object({
  tipoPessoa: z.literal("juridica"),
  nomeFantasia: z.string()
    .nonempty('O nome fantasia é obrigatório')
    .min(2, { message: 'O nome fantasia deve conter pelo menos 2 caracteres' }),
  razaoSocial: z.string()
    .nonempty('A razão social é obrigatória')
    .min(5, { message: 'A razão social deve conter pelo menos 5 caracteres' }),
  cnpj: z.string()
    .min(14, 'CNPJ é obrigatório')
    .refine((val) => isValidCnpj(val), {
      message: 'CNPJ inválido',
    }),
  inscricaoEstadual: optionalFieldMin({ field: "inscricao_estadual", min: 5 }),
  inscricaoMunicipal: optionalFieldMin({ field: "inscricao_municipal", min: 5 }),
  dataAbertura: z.string()
    .optional()
    .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: 'Data de abertura deve ter o formato DD/MM/YYYY'
    }),
  naturezaJuridica: optionalFieldMin({ field: "natureza_juridica", min: 3 }),
  porte: z.enum(['MEI', 'ME', 'EPP', 'GRANDE', 'MEDIA'], {
    required_error: 'Porte da empresa é obrigatório'
  }).optional(),
  email: optionalFieldMin({ field: "email", min: 5, type: "email" }),
  telefone: optionalFieldMin({ field: "telefone", min: 10 }),
  endereco: enderecoSchema
});

// Union discriminada principal
export const pessoaSchema = z.discriminatedUnion("tipoPessoa", [
  pessoaFisicaSchema,
  pessoaJuridicaSchema
]).and(licencaDataSchema);

export type PessoaFormValues = z.infer<typeof pessoaSchema>;

// Tipos auxiliares para melhor type safety
export type PessoaFisicaFormValues = z.infer<typeof pessoaFisicaSchema>;
export type PessoaJuridicaFormValues = z.infer<typeof pessoaJuridicaSchema>;