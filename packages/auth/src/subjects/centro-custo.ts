import z from "zod";
import { centroCustoSchema } from "../models/centro-custo";

export const centroCustoSubject = z.tuple([
    z.union([
        z.literal("manage"),
        z.literal("get"),
        z.literal("create"),
        z.literal("update"),
        z.literal("delete"),
    ]),
    z.union([z.literal("CentroCusto"), centroCustoSchema])
]);

export type CentroCustoSubject = z.infer<typeof centroCustoSubject>;