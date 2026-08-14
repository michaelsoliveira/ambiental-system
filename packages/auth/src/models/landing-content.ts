import z from "zod";

export const landingContentSchema = z.object({
  __typename: z.literal("LandingContent").default("LandingContent"),
  id: z.string().uuid(),
});

export type LandingContent = z.infer<typeof landingContentSchema>;
