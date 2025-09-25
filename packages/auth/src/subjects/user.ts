import z from "zod";

export const userSubject = z.tuple([
    z.union([
        z.literal("manage"),
        z.literal("get"),
        z.literal("invite"),
        z.literal("create"),
        z.literal("update"),
        z.literal("delete"),
        z.literal("update_password"),
        z.literal("change_password"),
        z.literal("change_email")
    ]),
    z.literal("User")
]);

export type UserSubject = z.infer<typeof userSubject>;