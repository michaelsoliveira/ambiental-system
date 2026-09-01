import z from "zod";

export const omnichannelSchema = z.object({
  __typename: z.literal("Omnichannel").default("Omnichannel"),
  id: z.string().uuid(),
});

export type Omnichannel = z.infer<typeof omnichannelSchema>;
