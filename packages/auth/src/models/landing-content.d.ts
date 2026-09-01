import z from "zod";
export declare const landingContentSchema: z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"LandingContent">>;
    id: z.ZodString;
}, z.core.$strip>;
export type LandingContent = z.infer<typeof landingContentSchema>;
//# sourceMappingURL=landing-content.d.ts.map