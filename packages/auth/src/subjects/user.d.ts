import z from "zod";
export declare const userSubject: z.ZodTuple<[z.ZodUnion<readonly [z.ZodLiteral<"manage">, z.ZodLiteral<"get">, z.ZodLiteral<"invite">, z.ZodLiteral<"create">, z.ZodLiteral<"update">, z.ZodLiteral<"delete">, z.ZodLiteral<"update_password">, z.ZodLiteral<"change_password">, z.ZodLiteral<"change_email">]>, z.ZodLiteral<"User">], null>;
export type UserSubject = z.infer<typeof userSubject>;
//# sourceMappingURL=user.d.ts.map