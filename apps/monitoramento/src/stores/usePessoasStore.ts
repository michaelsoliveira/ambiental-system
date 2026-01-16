import { PessoaType } from 'types'
import { create } from 'zustand'

type PessoasStore = {
  pessoas: PessoaType[]
  setPessoas: (pessoas: PessoaType[]) => void
  clearPessoas: () => void
}

export const usePessoasStore = create<PessoasStore>((set: any) => ({
  pessoas: [],
  setPessoas: (pessoas: any) => set({ pessoas }),
  clearPessoas: () => set({ pessoas: [] }),
}))
