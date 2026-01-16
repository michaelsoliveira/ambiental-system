import { optionalFieldMin } from '@/lib/utils';
import { validate } from 'uuid';
import * as z from 'zod';


type optionFieldMinType = {
  field: string,
  min?: number | null,
  type?: string
}

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

export const licencaSchema = z.object({
  id: z.string().optional(),
  tipoLicencaId: z.string().min(1, { message: 'O campo tipo licença é obrigatório' }),
  numeroLicenca: z.string().min(1, 'O campo número da licença é obrigatório'),
  pessoaId: z.string().min(1, 'A empresa é um campo obrigatório'),
  getNumeroLicencaAuto: z.boolean().optional(),
  status: optionalFieldMin({ field: 'status', min: 3 }),
  orgaoEmissor: optionalFieldMin({ field: 'orgaoEmissor', min: 3 }),
  dataEmissao: z.string().refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'Data de emissão deve ter o format DD/MM/YYYY'
  }),
  dataValidade: z.string().refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'Data de emissão deve ter o format DD/MM/YYYY'
  })
});

export type LicencaFormValues = z.infer<typeof licencaSchema>;
