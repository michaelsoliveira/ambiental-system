import z from "zod";
export declare const billingSubject: z.ZodTuple<[z.ZodUnion<readonly [z.ZodLiteral<"manage">, z.ZodLiteral<"get">, z.ZodLiteral<"export">]>, z.ZodLiteral<"Billing">], null>;
export type BillingSubject = z.infer<typeof billingSubject>;
//# sourceMappingURL=billing.d.ts.map