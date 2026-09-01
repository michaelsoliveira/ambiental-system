import z from "zod";
export declare const categoriaFinanceiraSchema: z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"CategoriaFinanceira">>;
    id: z.ZodString;
}, z.core.$strip>;
export type CategoriaFinanceira = z.infer<typeof categoriaFinanceiraSchema>;
//# sourceMappingURL=categoria-financeira.d.ts.map