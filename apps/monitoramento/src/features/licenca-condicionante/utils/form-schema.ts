import { z } from "zod"

const unicaCondicionanteSchema = z.discriminatedUnion("hasUnicaCondicionante", [
  z.object({
    hasUnicaCondicionante: z.literal(true),
    dataVencimento: z.string().refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: 'Data de atribuição deve ter o format DD/MM/YYYY'
    })
    .refine((value) => !isNaN(Date.parse(value)), {
      message: 'Data inválida',
    }).optional(),
  }),
  z.object({
    hasUnicaCondicionante: z.literal(false)
  })
]);

export const formSchema = z.object({
  frequencia: z.enum(['unica', 'periodica', 'continua', 'eventual']).optional(),
  condicionanteId: z.string().uuid({ message: 'Condicionante obrigatória' }),
  dataAtribuicao: z.string().refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'Data de atribuição deve ter o format DD/MM/YYYY'
  }),
  dataCumprimento: z.string().refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'Data de atribuição deve ter o format DD/MM/YYYY'
  }).optional(),
  diasAntecedencia: z.coerce.number().min(0).optional(),
  userId: z.string().optional(),
  meses: z
    .array(z.number())
    .optional()
}).and(unicaCondicionanteSchema)
  
export type CondicionanteFormValues = z.infer<typeof formSchema>