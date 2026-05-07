import z from "zod";
import { patrimonioSchema } from "..";

export const patrimonioSubject = z.tuple([
    z.union([
        z.literal("manage"),
        z.literal("get"),
        z.literal("create"),
        z.literal("update"),
        z.literal("delete"),
    ]),
    z.union([z.literal("Patrimonio"), patrimonioSchema])
]);

export type PatrimonioSubject = z.infer<typeof patrimonioSubject>;
