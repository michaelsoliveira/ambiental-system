import z from "zod";

export const patrimonioSchema = z.object({
    __typename: z.literal('Patrimonio').default('Patrimonio'),
    id: z.string().uuid().optional(),
    organization_id: z.string().uuid().optional()
})

export type Patrimonio = z.infer<typeof patrimonioSchema>
