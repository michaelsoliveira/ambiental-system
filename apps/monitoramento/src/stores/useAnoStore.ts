// stores/useAnoStore.ts
import { create } from 'zustand'

type AnoStore = {
  anoAtivo: string | null
  loading: boolean
  setAnoAtivo: (ano: string) => void
  resetAnoAtivo: () => void
}

const LOCAL_KEY = 'ano_ativo'

export const useAnoStore = create<AnoStore>((set, get) => {
  const storedAno = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_KEY) : null

  return {
    anoAtivo: storedAno ?? null,
    loading: false,

    setAnoAtivo: (ano: string) => {
      localStorage.setItem(LOCAL_KEY, ano)
      set({ anoAtivo: ano })
    },

    resetAnoAtivo: () => {
      localStorage.removeItem(LOCAL_KEY)
      set({ anoAtivo: null })
    },
  }
})
