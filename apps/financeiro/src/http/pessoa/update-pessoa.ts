'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { api } from '@/http/api-client'
import { PessoaFormValues } from '@/features/pessoa/utils/form-schema'

// Tipo de retorno padronizado
type ActionResult<T = unknown> = {
  success: boolean
  data?: T
  message?: string | null
  errors?: Record<string, string[]> | null
}

export async function updatePessoa(
  pessoaId: string,
  data: Partial<PessoaFormValues>
): Promise<ActionResult> {
  try {
    const res = await api.put(`/pessoa/${pessoaId}`, {
      json: data
    })

    const result = await res.json()

    // Revalidar cache
    revalidateTag('pessoas')
    revalidatePath('/pessoas')
    revalidatePath(`/pessoas/${pessoaId}`)

    return {
      success: true,
      data: result
    }
  } catch (error: any) {
    const errData = await error.response?.json?.()
    
    if (errData?.errors) {
      return {
        success: false,
        errors: Array.isArray(errData.errors) 
          ? errData.errors 
          : [errData.errors]
      }
    }

    return {
      success: false,
      message: errData?.error || 'Erro ao atualizar pessoa'
    }
  }
}