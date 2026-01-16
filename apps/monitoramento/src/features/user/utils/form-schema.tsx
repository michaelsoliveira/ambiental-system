import { optionalFieldMin } from "@/lib/utils";
import { z } from "zod";

export const userSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: optionalFieldMin({ field: 'password', min: 6 }),
  // password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  roles: z.array(z.string()).min(1, "Selecione ao menos um papel")
});

export type UserFormValues = z.infer<typeof userSchema>;