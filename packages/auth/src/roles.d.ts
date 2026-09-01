import z from "zod";
export declare const roleSchema: z.ZodUnion<readonly [z.ZodLiteral<"admin">, z.ZodLiteral<"owner">, z.ZodLiteral<"manager">, z.ZodLiteral<"billing">, z.ZodLiteral<"guest">, z.ZodLiteral<"member">]>;
export type Role = z.infer<typeof roleSchema>;
//# sourceMappingURL=roles.d.ts.map