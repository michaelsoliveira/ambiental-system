import z from "zod";
export declare const patrimonioSchema: z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"Patrimonio">>;
    id: z.ZodOptional<z.ZodString>;
    organization_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Patrimonio = z.infer<typeof patrimonioSchema>;
//# sourceMappingURL=patrimonio.d.ts.map