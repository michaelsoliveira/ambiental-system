import z from "zod";
export declare const organizationSubject: z.ZodTuple<[z.ZodUnion<readonly [z.ZodLiteral<"manage">, z.ZodLiteral<"create">, z.ZodLiteral<"update">, z.ZodLiteral<"delete">, z.ZodLiteral<"transfer_ownership">]>, z.ZodUnion<readonly [z.ZodLiteral<"Organization">, z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"Organization">>;
    id: z.ZodString;
    owner_id: z.ZodString;
}, z.core.$strip>]>], null>;
export type OrganizationSubject = z.infer<typeof organizationSubject>;
//# sourceMappingURL=organization.d.ts.map