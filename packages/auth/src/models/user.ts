import z from "zod";
import { roleSchema } from "../roles";

export const userSchema = z.object({
  id: z.string(),
  roles: z.array(roleSchema),
  organization_id: z.string().optional()
})

export type User = z.infer<typeof userSchema>