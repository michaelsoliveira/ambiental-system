import z from "zod";
export declare const parceiroSchema: z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"Parceiro">>;
    id: z.ZodString;
    organization_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Parceiro = z.infer<typeof parceiroSchema>;
//# sourceMappingURL=parceiro.d.ts.map