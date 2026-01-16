import z from "zod";

export const centroCustoSchema = z.object({
    __typename: z.literal('CentroCusto').default('CentroCusto'),
    id: z.string().uuid(),
})

export type CentroCusto = z.infer<typeof centroCustoSchema>