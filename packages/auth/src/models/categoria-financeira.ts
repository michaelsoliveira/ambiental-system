import z from "zod";

export const categoriaFinanceiraSchema = z.object({
    __typename: z.literal('CategoriaFinanceira').default('CategoriaFinanceira'),
    id: z.string().uuid(),
})

export type CategoriaFinanceira = z.infer<typeof categoriaFinanceiraSchema>