import { z } from 'zod';

import { isValidCnpj, isValidCpf } from '@/lib/utils';

type optionFieldMinType = {
  field: string,
  min?: number | null,
  type?: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Schema base
const enderecoSchema = z.object({
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  municipio_id: z.string().min(1, 'O município é obrigatório'),
  estado_id: z.string().min(1, 'O campo estado é obrigatório'),
  cep: z.string().optional()
});

const camposComunsSchema = z.object({
  telefone: optionalFieldMin({ field: 'telefone', min: 6 }),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  endereco: enderecoSchema
});

// ⭐ ZOD v4: Use .superRefine ao invés de múltiplos .refine
const pessoaFisicaSchema = z.object({
  nome: z.string().min(5, 'O campo nome deve conter pelo menos 5 caracteres'),
  rg: z.string().optional().or(z.literal('')),
  cpf: z.string().optional(),
  data_nascimento: z.string().optional().or(z.literal(''))
}).superRefine((data, ctx) => {
  // Validação do CPF em um único lugar
  const cpfLimpo = data.cpf?.replace(/\D/g, '');
  
  if (cpfLimpo && cpfLimpo.length > 0 && cpfLimpo.length < 11) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'O CPF deve ter 11 dígitos',
      path: ['cpf']
    });
  }
  
  if (cpfLimpo && cpfLimpo.length === 11 && !isValidCpf(cpfLimpo)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'CPF inválido',
      path: ['cpf']
    });
  }
});

const pessoaJuridicaSchema = z.object({
  nome_fantasia: z.string().min(5, 'O campo nome deve conter pelo menos 5 caracteres'),
  razao_social: z.string().optional().or(z.literal('')),
  cnpj: z.string().min(1, 'O CNPJ é obrigatório'),
  inscricao_estadual: z.string().optional().or(z.literal('')),
  inscricao_municipal: z.string().optional().or(z.literal('')),
  data_abertura: z.string().optional().or(z.literal(''))
}).superRefine((data, ctx) => {
  // Validação do CNPJ em um único lugar
  const cnpjLimpo = data.cnpj.replace(/\D/g, '');
  
  if (cnpjLimpo.length > 0 && cnpjLimpo.length < 14) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'O CNPJ deve ter 14 dígitos',
      path: ['cnpj']
    });
  }
  
  if (cnpjLimpo.length === 14 && !isValidCnpj(cnpjLimpo)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'CNPJ inválido',
      path: ['cnpj']
    });
  }
});

// ⭐ ZOD v4: discriminatedUnion mudou - use assim:
export const pessoaSchema = z.union([
  z.object({
    tipo: z.literal('F'),
    fisica: pessoaFisicaSchema,
  }).merge(camposComunsSchema),
  z.object({
    tipo: z.literal('J'),
    juridica: pessoaJuridicaSchema,
  }).merge(camposComunsSchema)
]);

export type PessoaFormValues = z.infer<typeof pessoaSchema>;