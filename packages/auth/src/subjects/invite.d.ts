import z from "zod";
export declare const inviteSubject: z.ZodTuple<[z.ZodUnion<readonly [z.ZodLiteral<"manage">, z.ZodLiteral<"get">, z.ZodLiteral<"create">, z.ZodLiteral<"delete">]>, z.ZodLiteral<"Invite">], null>;
export type InviteSubject = z.infer<typeof inviteSubject>;
//# sourceMappingURL=invite.d.ts.map