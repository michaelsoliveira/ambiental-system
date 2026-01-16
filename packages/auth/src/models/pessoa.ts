import z from "zod";

export const pessoaSchema = z.object({
  __typename: z.literal("Pessoa").default("Pessoa"),
  id: z.string().uuid(),
  organization_id: z.string().optional()
})

export type Pessoa = z.infer<typeof pessoaSchema>