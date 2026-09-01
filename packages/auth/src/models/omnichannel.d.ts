import z from "zod";
export declare const omnichannelSchema: z.ZodObject<{
    __typename: z.ZodDefault<z.ZodLiteral<"Omnichannel">>;
    id: z.ZodString;
}, z.core.$strip>;
export type Omnichannel = z.infer<typeof omnichannelSchema>;
//# sourceMappingURL=omnichannel.d.ts.map