import { create } from 'zustand';
import { queryClient } from '@/lib/react-query';

type Pessoa = {
  id: string;
  nome: string;
};

type PessoaStore = {
  pessoaSelecionada: Pessoa | null;
  setPessoa: (pessoa: Pessoa | null) => void;
};

export const usePessoaStore = create<PessoaStore>((set) => ({
  pessoaSelecionada: null,
  setPessoa: (pessoa) => {
    set({ pessoaSelecionada: pessoa });

    queryClient.invalidateQueries({
      queryKey: ['totais_dashboard'],
    });
  },
}));
