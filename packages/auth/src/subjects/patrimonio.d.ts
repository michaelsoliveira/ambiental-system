import z from "zod";
export declare const patrimonioSubject: z.ZodTuple<[z.ZodUnion<readonly [z.ZodLiteral<"manage">, z.ZodLiteral<"get">, z.ZodLiteral<"create">, z.ZodLiteral<"update">, z.ZodLiteral<"delete">]>, z.ZodUnion<readonly [z.ZodLiteral<"Patrimonio">, z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"Patrimonio">>;
    id: z.ZodOptional<z.ZodString>;
    organization_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>]>], null>;
export type PatrimonioSubject = z.infer<typeof patrimonioSubject>;
//# sourceMappingURL=patrimonio.d.ts.map