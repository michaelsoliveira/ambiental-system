import z from "zod";

export const parceiroSchema = z.object({
    __typename: z.literal("Parceiro").default("Parceiro"),
    id: z.string().uuid(),
    organization_id: z.string().optional()
})

export type Parceiro = z.infer<typeof parceiroSchema>