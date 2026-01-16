import z from "zod";

export const contaBancariaSchema = z.object({
    __typename: z.literal('ContaBancaria').default('ContaBancaria'),
    id: z.string().uuid(),
})

export type ContaBancaria = z.infer<typeof contaBancariaSchema>