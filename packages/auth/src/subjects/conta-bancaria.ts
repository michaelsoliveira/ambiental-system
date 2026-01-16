import z from "zod";
import { contaBancariaSchema } from "../models/conta-bancaria";

export const contaBancariaSubject = z.tuple([
    z.union([
        z.literal("manage"),
        z.literal("get"),
        z.literal("create"),
        z.literal("update"),
        z.literal("delete"),
    ]),
    z.union([z.literal("ContaBancaria"), contaBancariaSchema])
]);

export type ContaBancariaSubject = z.infer<typeof contaBancariaSubject>;