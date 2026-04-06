// src/actions/pessoa-actions.ts
'use server'
import { api } from '@/http/api-client'

// Tipo de retorno padronizado
type ActionResult<T = unknown> = {
  success: boolean
  data?: T
  message?: string | null
  errors?: Record<string, string[]> | null
}

export async function getPessoas(params = {}): Promise<ActionResult> {
  try {
    const res = await api.get('/pessoa', { 
      searchParams: params,
      next: {
        tags: ['pessoas']
      }
    })
    const data = await res.json()
    
    return {
      success: true,
      data
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Erro ao buscar pessoas'
    }
  }
}