import { optionalFieldMin } from "@/lib/utils";
import { z } from "zod";

export const tipoLicencaSchema = z.object({
  nome: z.string().min(1, "Nome do tipo da licença é obrigatório"),
  descricao: optionalFieldMin({ field: 'descricao', min: 4 })
});

export type TipoLicencaFormValues = z.infer<typeof tipoLicencaSchema>;