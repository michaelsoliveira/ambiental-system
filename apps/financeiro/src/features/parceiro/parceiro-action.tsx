'use server'

import { HTTPError } from 'ky'
import { z } from 'zod'

import { getCurrentOrg } from '@/auth/auth'
import { createParceiro } from '@/http/parceiro/create-parceiro'

const parceiroSchema = z.object({
  tipo_parceiro: z
    .string()
    .min(1, { message: 'O código é obrigatório.' })
    .max(100, { message: 'O código deve ter no máximo 100 caracteres.' }),
  pessoa_id: z
    .string()
    .uuid({ message: 'ID da pessoa inválido.' }),
  observacoes: z
    .string()
    .optional(),
  ativo: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .default(true),
})

export async function createParceiroAction(data: FormData) {
  const result = parceiroSchema.safeParse(Object.fromEntries(data))

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors

    return { success: false, message: null, errors }
  }

  const { tipo_parceiro, pessoa_id, observacoes, ativo } = result.data
  const organization = await getCurrentOrg()

  try {
    await createParceiro({
      org: organization!,
      tipo_parceiro,
      pessoa_id,
      observacoes: observacoes || null,
      ativo,
    })
  } catch (err) {
    if (err instanceof HTTPError) {
      const { message } = await err.response.json()

      return { success: false, message, errors: null }
    }

    console.error(err)

    return {
      success: false,
      message: 'Erro inesperado, tente novamente em alguns minutos.',
      errors: null,
    }
  }

  return {
    success: true,
    message: 'Parceiro cadastrado com sucesso.',
    errors: null,
  }
}