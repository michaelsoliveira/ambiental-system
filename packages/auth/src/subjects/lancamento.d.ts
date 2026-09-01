import z from "zod";
export declare const lancamentoSubject: z.ZodTuple<[z.ZodUnion<readonly [z.ZodLiteral<"manage">, z.ZodLiteral<"get">, z.ZodLiteral<"create">, z.ZodLiteral<"update">, z.ZodLiteral<"delete">]>, z.ZodUnion<readonly [z.ZodLiteral<"Lancamento">, z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"Lancamento">>;
    id: z.ZodString;
    parceiro_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>]>], null>;
export type LancamentoSubject = z.infer<typeof lancamentoSubject>;
//# sourceMappingURL=lancamento.d.ts.map