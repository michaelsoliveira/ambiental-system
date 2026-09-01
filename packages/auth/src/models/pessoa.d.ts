import z from "zod";
export declare const pessoaSchema: z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"Pessoa">>;
    id: z.ZodString;
    organization_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Pessoa = z.infer<typeof pessoaSchema>;
//# sourceMappingURL=pessoa.d.ts.map