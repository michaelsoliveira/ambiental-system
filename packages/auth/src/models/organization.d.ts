import z from "zod";
export declare const organizationSchema: z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"Organization">>;
    id: z.ZodString;
    owner_id: z.ZodString;
}, z.core.$strip>;
export type Organization = z.infer<typeof organizationSchema>;
//# sourceMappingURL=organization.d.ts.map