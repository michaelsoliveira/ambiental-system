import { z } from "zod";

export const condicionanteSchema = z.object({
  descricao: z.string().min(1, "Descrição obrigatória"),
  tipo: z.enum(["monitoramento", "relatorio", "mitigadora", "compensatoria", "legal", "outro"]),
  frequencia: z.enum(["unica", "periodica", "continua", "eventual"]).optional(),
  prazoDias: z.coerce.number().int().optional(),
});

export type CondicionanteFormValues = z.infer<typeof condicionanteSchema>;