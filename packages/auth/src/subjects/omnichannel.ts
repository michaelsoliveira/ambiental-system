import z from "zod";

import { omnichannelSchema } from "../models/omnichannel";

export const omnichannelSubject = z.tuple([
  z.union([
    z.literal("manage"),
    z.literal("get"),
    z.literal("create"),
    z.literal("update"),
    z.literal("delete"),
  ]),
  z.union([z.literal("Omnichannel"), omnichannelSchema]),
]);

export type OmnichannelSubject = z.infer<typeof omnichannelSubject>;
