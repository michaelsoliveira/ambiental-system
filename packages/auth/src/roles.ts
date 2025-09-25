import z from "zod";

export const roleSchema = z.union([
    z.literal("admin"),
    z.literal("owner"),
    z.literal("manager"),
    z.literal("billing"),
    z.literal("guest"),
    z.literal("member")
]);

export type Role = z.infer<typeof roleSchema>;