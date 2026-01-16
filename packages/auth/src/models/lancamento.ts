import z from "zod";

export const lancamentoSchema = z.object({
    __typename: z.literal('Lancamento').default('Lancamento'),
    id: z.string().uuid(),
    parceiro_id: z.string().optional()
})

export type Lancamento = z.infer<typeof lancamentoSchema>