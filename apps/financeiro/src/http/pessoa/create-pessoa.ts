// src/actions/pessoa-actions.ts
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

import { PessoaFormValues } from '@/features/pessoa/utils/form-schema'
import { api } from '@/http/api-client'

// Tipo de retorno padronizado
type ActionResult<T = unknown> = {
  success: boolean
  data?: T
  message?: string | null
  errors?: Record<string, string[]> | null
}

export async function createPessoa(
    data: PessoaFormValues
  ): Promise<ActionResult> {
    try {
      const res = await api.post('/pessoa', {
        json: data
      })
  
      const result = await res.json()
  
      // Revalidar cache
      revalidateTag('pessoas')
      revalidatePath('/pessoas')
  
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
        message: errData?.error || 'Erro ao criar pessoa'
      }
    }
  }