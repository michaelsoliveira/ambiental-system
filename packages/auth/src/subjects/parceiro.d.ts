import z from "zod";
export declare const parceiroSubject: z.ZodTuple<[z.ZodUnion<readonly [z.ZodLiteral<"manage">, z.ZodLiteral<"get">, z.ZodLiteral<"create">, z.ZodLiteral<"update">, z.ZodLiteral<"delete">]>, z.ZodUnion<readonly [z.ZodLiteral<"Parceiro">, z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"Parceiro">>;
    id: z.ZodString;
    organization_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>]>], null>;
export type ParceiroSubject = z.infer<typeof parceiroSubject>;
//# sourceMappingURL=parceiro.d.ts.map