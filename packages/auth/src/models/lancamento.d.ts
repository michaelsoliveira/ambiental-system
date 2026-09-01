import z from "zod";
export declare const lancamentoSchema: z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"Lancamento">>;
    id: z.ZodString;
    parceiro_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Lancamento = z.infer<typeof lancamentoSchema>;
//# sourceMappingURL=lancamento.d.ts.map