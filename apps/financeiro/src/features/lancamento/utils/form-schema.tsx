import { z } from 'zod'

export const lancamentoSchema = z.object({
  id: z.string().optional(),
  numero: z.string().min(1, 'O número único é obrigatório'),
  tipo: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']),
  data: z.string().min(1, 'Data é obrigatória'),
  data_vencimento: z.string().optional(),
  descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  valor: z.string()
    .min(1, 'Valor é obrigatório')
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Valor deve ser maior que 0'),
  categoria_id: z.string().min(1, 'Categoria é obrigatória'),
  conta_bancaria_id: z.string().min(1, 'Conta bancária é obrigatória'),
  centro_custo_id: z.string().optional(),
  parceiro_id: z.string().optional(),
  forma_parcelamento: z.enum(['UNICA', 'FIXA', 'PROGRESSIVA']).default('UNICA'),
  numero_parcelas: z.string()
    .default('1')
    .refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, 'Número de parcelas deve ser maior que 0'),
  pago: z.boolean().default(false),
  status_lancamento: z.enum(['PENDENTE', 'CONFIRMADO', 'PAGO', 'CANCELADO', 'ATRASADO']).default('PENDENTE'),
  observacoes: z.string().optional(),
  parcelas: z.array(z.object({
    id: z.string().optional(),
    numero_parcela: z.number(),
    data_vencimento: z.string(),
    valor: z.string(),
    pago: z.boolean().default(false),
    status_parcela: z.enum(['PENDENTE', 'PAGA', 'CANCELADA', 'ATRASADA']).default('PENDENTE'),
    observacoes: z.string().optional()
  })).optional()
})

export type LancamentoFormValues = z.infer<typeof lancamentoSchema>