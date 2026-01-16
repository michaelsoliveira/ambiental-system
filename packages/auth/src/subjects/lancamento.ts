import z from "zod";
import { lancamentoSchema } from "..";

export const lancamentoSubject = z.tuple([
    z.union([
        z.literal("manage"),
        z.literal("get"),
        z.literal("create"),
        z.literal("update"),
        z.literal("delete"),
    ]),
    z.union([z.literal("Lancamento"), lancamentoSchema])
]);

export type LancamentoSubject = z.infer<typeof lancamentoSubject>;