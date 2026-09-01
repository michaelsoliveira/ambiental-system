import z from "zod";
export declare const omnichannelSubject: z.ZodTuple<[z.ZodUnion<readonly [z.ZodLiteral<"manage">, z.ZodLiteral<"get">, z.ZodLiteral<"create">, z.ZodLiteral<"update">, z.ZodLiteral<"delete">]>, z.ZodUnion<readonly [z.ZodLiteral<"Omnichannel">, z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"Omnichannel">>;
    id: z.ZodString;
}, z.core.$strip>]>], null>;
export type OmnichannelSubject = z.infer<typeof omnichannelSubject>;
//# sourceMappingURL=omnichannel.d.ts.map