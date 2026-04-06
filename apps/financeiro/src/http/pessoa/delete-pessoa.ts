'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

import { api } from '@/http/api-client'

// Tipo de retorno padronizado
type ActionResult<T = unknown> = {
  success: boolean
  data?: T
  message?: string | null
  errors?: Record<string, string[]> | null
}

export async function deletePessoa(pessoaId: string): Promise<ActionResult> {
  try {
    await api.delete(`/pessoa/${pessoaId}`)

    // Revalidar cache
    revalidateTag('pessoas')
    revalidatePath('/pessoas')

    return {
      success: true
    }
  } catch (error: any) {
    const errData = await error.response?.json?.()

    return {
      success: false,
      message: errData?.message || 'Erro ao excluir pessoa'
    }
  }
}