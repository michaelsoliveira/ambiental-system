import z from "zod";
export declare const centroCustoSubject: z.ZodTuple<[z.ZodUnion<readonly [z.ZodLiteral<"manage">, z.ZodLiteral<"get">, z.ZodLiteral<"create">, z.ZodLiteral<"update">, z.ZodLiteral<"delete">]>, z.ZodUnion<readonly [z.ZodLiteral<"CentroCusto">, z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"CentroCusto">>;
    id: z.ZodString;
}, z.core.$strip>]>], null>;
export type CentroCustoSubject = z.infer<typeof centroCustoSubject>;
//# sourceMappingURL=centro-custo.d.ts.map