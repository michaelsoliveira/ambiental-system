import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OcAtribuicaoFiltro = 'todas' | 'minhas';

interface OcStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  conversaAtivaId: string | null;
  setConversaAtiva: (id: string | null) => void;
  canalFiltro: string | null;
  customInboxId: string | null;
  atribuicaoFiltro: OcAtribuicaoFiltro;
  buscaTexto: string;
  filtroNaoLidas: boolean;
  filtroArquivadas: boolean;
  filtroGrupos: boolean;
  tagsFiltro: string[];
  setFiltros: (
    f: Partial<
      Pick<
        OcStore,
        | 'canalFiltro'
        | 'customInboxId'
        | 'atribuicaoFiltro'
        | 'buscaTexto'
        | 'filtroNaoLidas'
        | 'filtroArquivadas'
        | 'filtroGrupos'
        | 'tagsFiltro'
      >
    >,
  ) => void;
}

export const useOcStore = create<OcStore>()(
  persist(
    (set, get) => ({
  sidebarOpen: true,
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  conversaAtivaId: null,
  setConversaAtiva: (id) => set({ conversaAtivaId: id }),
  canalFiltro: null,
  customInboxId: null,
  atribuicaoFiltro: 'todas',
  buscaTexto: '',
  filtroNaoLidas: false,
  filtroArquivadas: false,
  filtroGrupos: false,
  tagsFiltro: [],
  setFiltros: (f) =>
    set((state) => {
      const next = {
        canalFiltro: f.canalFiltro !== undefined ? f.canalFiltro : state.canalFiltro,
        customInboxId: f.customInboxId !== undefined ? f.customInboxId : state.customInboxId,
        atribuicaoFiltro: f.atribuicaoFiltro ?? state.atribuicaoFiltro,
        buscaTexto: f.buscaTexto !== undefined ? f.buscaTexto : state.buscaTexto,
        filtroNaoLidas: f.filtroNaoLidas ?? state.filtroNaoLidas,
        filtroArquivadas: f.filtroArquivadas ?? state.filtroArquivadas,
        filtroGrupos: f.filtroGrupos ?? state.filtroGrupos,
        tagsFiltro: f.tagsFiltro !== undefined ? f.tagsFiltro : state.tagsFiltro,
      };
      if (
        next.canalFiltro === state.canalFiltro &&
        next.customInboxId === state.customInboxId &&
        next.atribuicaoFiltro === state.atribuicaoFiltro &&
        next.buscaTexto === state.buscaTexto &&
        next.filtroNaoLidas === state.filtroNaoLidas &&
        next.filtroArquivadas === state.filtroArquivadas &&
        next.filtroGrupos === state.filtroGrupos &&
        next.tagsFiltro === state.tagsFiltro
      ) {
        return state;
      }
      return next;
    }),
}),
    {
      name: 'oc-store',
      partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
    },
  ),
);
