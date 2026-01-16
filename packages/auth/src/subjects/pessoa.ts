import z from "zod";
import { pessoaSchema } from "..";

export const pessoaSubject = z.tuple([
    z.union([
        z.literal("manage"),
        z.literal("get"),
        z.literal("create"),
        z.literal("update"),
        z.literal("delete"),
    ]),
    z.union([z.literal("Pessoa"), pessoaSchema])
]);

export type PessoaSubject = z.infer<typeof pessoaSubject>;