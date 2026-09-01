import z from "zod";
export declare const userSchema: z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"User">>;
    id: z.ZodString;
    roles: z.ZodArray<z.ZodUnion<readonly [z.ZodLiteral<"admin">, z.ZodLiteral<"owner">, z.ZodLiteral<"manager">, z.ZodLiteral<"billing">, z.ZodLiteral<"guest">, z.ZodLiteral<"member">]>>;
    organization_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type User = z.infer<typeof userSchema>;
//# sourceMappingURL=user.d.ts.map