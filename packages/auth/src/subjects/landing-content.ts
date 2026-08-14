import z from "zod";

import { landingContentSchema } from "../models/landing-content";

export const landingContentSubject = z.tuple([
  z.union([
    z.literal("manage"),
    z.literal("get"),
    z.literal("create"),
    z.literal("update"),
    z.literal("delete"),
    z.literal("publish"),
  ]),
  z.union([z.literal("LandingContent"), landingContentSchema]),
]);

export type LandingContentSubject = z.infer<typeof landingContentSubject>;
