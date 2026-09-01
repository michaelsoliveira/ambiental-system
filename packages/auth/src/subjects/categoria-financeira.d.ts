import z from "zod";
export declare const categoriaFinanceiraSubject: z.ZodTuple<[z.ZodUnion<readonly [z.ZodLiteral<"manage">, z.ZodLiteral<"get">, z.ZodLiteral<"create">, z.ZodLiteral<"update">, z.ZodLiteral<"delete">]>, z.ZodUnion<readonly [z.ZodLiteral<"CategoriaFinanceira">, z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"CategoriaFinanceira">>;
    id: z.ZodString;
}, z.core.$strip>]>], null>;
export type CategoriaFinanceiraSubject = z.infer<typeof categoriaFinanceiraSubject>;
//# sourceMappingURL=categoria-financeira.d.ts.map