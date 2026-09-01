import z from "zod";
export declare const contaBancariaSubject: z.ZodTuple<[z.ZodUnion<readonly [z.ZodLiteral<"manage">, z.ZodLiteral<"get">, z.ZodLiteral<"create">, z.ZodLiteral<"update">, z.ZodLiteral<"delete">]>, z.ZodUnion<readonly [z.ZodLiteral<"ContaBancaria">, z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"ContaBancaria">>;
    id: z.ZodString;
}, z.core.$strip>]>], null>;
export type ContaBancariaSubject = z.infer<typeof contaBancariaSubject>;
//# sourceMappingURL=conta-bancaria.d.ts.map