import z from "zod";
export declare const pessoaSubject: z.ZodTuple<[z.ZodUnion<readonly [z.ZodLiteral<"manage">, z.ZodLiteral<"get">, z.ZodLiteral<"create">, z.ZodLiteral<"update">, z.ZodLiteral<"delete">]>, z.ZodUnion<readonly [z.ZodLiteral<"Pessoa">, z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"Pessoa">>;
    id: z.ZodString;
    organization_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>]>], null>;
export type PessoaSubject = z.infer<typeof pessoaSubject>;
//# sourceMappingURL=pessoa.d.ts.map