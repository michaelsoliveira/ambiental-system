import z from "zod";
export declare const contaBancariaSchema: z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"ContaBancaria">>;
    id: z.ZodString;
}, z.core.$strip>;
export type ContaBancaria = z.infer<typeof contaBancariaSchema>;
//# sourceMappingURL=conta-bancaria.d.ts.map