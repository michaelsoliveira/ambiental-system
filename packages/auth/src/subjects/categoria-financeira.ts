import z from "zod";
import { categoriaFinanceiraSchema } from "../models/categoria-financeira";

export const categoriaFinanceiraSubject = z.tuple([
    z.union([
        z.literal("manage"),
        z.literal("get"),
        z.literal("create"),
        z.literal("update"),
        z.literal("delete"),
    ]),
    z.union([z.literal("CategoriaFinanceira"), categoriaFinanceiraSchema])
]);

export type CategoriaFinanceiraSubject = z.infer<typeof categoriaFinanceiraSubject>;