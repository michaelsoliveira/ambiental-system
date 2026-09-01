import z from "zod";
export declare const landingContentSubject: z.ZodTuple<[z.ZodUnion<readonly [z.ZodLiteral<"manage">, z.ZodLiteral<"get">, z.ZodLiteral<"create">, z.ZodLiteral<"update">, z.ZodLiteral<"delete">, z.ZodLiteral<"publish">]>, z.ZodUnion<readonly [z.ZodLiteral<"LandingContent">, z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"LandingContent">>;
    id: z.ZodString;
}, z.core.$strip>]>], null>;
export type LandingContentSubject = z.infer<typeof landingContentSubject>;
//# sourceMappingURL=landing-content.d.ts.map