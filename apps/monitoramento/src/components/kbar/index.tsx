'use client';
import { navItems } from '@/constants/data';
import {
  Action,
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarSearch,
  useRegisterActions,
  useMatches,
  useKBar,
} from 'kbar';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import RenderResults from './render-result';
import useThemeSwitching from './use-theme-switching';
import { usePessoas } from '@/hooks/use-pessoas';
import { usePessoaStore } from '@/stores/usePessoaStore';
import { formatCnpj, formatCpf } from '@/lib/utils';
import { revalidatePessoaTag } from '@/app/actions/revalidate-pessoa';
import { setPessoaCookie } from '@/app/actions/set-pessoa-cookie';

type KBarProps = {
  children: React.ReactNode;
};

function MyActions() {
  const setPessoa = usePessoaStore((state) => state.setPessoa);
  const router = useRouter();
  const { searchQuery } = useKBar((state) => ({
    searchQuery: state.searchQuery,
  }));

  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const isSearchValid = debouncedQuery.length >= 2;

  const navigateTo = useCallback((url: string) => {
    router.push(url);
  }, [router]);

  const { data: pessoasResponse = [] } = usePessoas({ orderBy: 'fisica.nome' });

  const navActions = navItems.flatMap((navItem) => {
    const baseAction =
      navItem.url !== '#'
        ? {
            id: `${navItem.title.toLowerCase()}Action`,
            name: navItem.title,
            shortcut: navItem.shortcut,
            keywords: navItem.title.toLowerCase(),
            section: 'Navigation',
            subtitle: `Go to ${navItem.title}`,
            perform: () => navigateTo(navItem.url),
          }
        : null;

    const childActions =
      navItem.items?.map((childItem) => ({
        id: `${childItem.title.toLowerCase()}Action`,
        name: childItem.title,
        shortcut: childItem.shortcut,
        keywords: childItem.title.toLowerCase(),
        section: navItem.title,
        subtitle: `Go to ${childItem.title}`,
        perform: () => navigateTo(childItem.url),
      })) ?? [];

    return baseAction ? [baseAction, ...childActions] : childActions;
  });

  const pessoaActions = pessoasResponse?.data?.map((pessoa: any) => ({
    id: `pessoa-${pessoa.id}`,
    name: pessoa.tipo === 'F' ? pessoa.fisica?.nome : pessoa.juridica?.nomeFantasia,
    section: 'Pessoas',
    keywords: pessoa.tipo === 'F' ? pessoa.fisica?.nome.toLowerCase() : pessoa.juridica?.nomeFantasia.toLowerCase,
    subtitle: `(${pessoa.tipo === 'F' ? formatCpf(pessoa.fisica?.cpf) : formatCnpj(pessoa.juridica?.cnpj)})`,
    perform: async () => {
      setPessoa(pessoa);
      await Promise.all([
        setPessoaCookie(pessoa.id),
        revalidatePessoaTag('pessoa-selecionada'),
      ]);
    },
  })) ?? [];

  const allPessoasAction = {
    id: `pessoa-todas`,
    name: 'Todas as Pessoas',
    section: 'Pessoas',
    keywords: 'todas geral',
    subtitle: 'Exibir dashboard com todas as pessoas',
    perform: async () => {
      setPessoa(null);
      await setPessoaCookie(null);
    },
  };

  useRegisterActions(
    [ ...navActions, allPessoasAction, ...pessoaActions ].filter((action) => action?.name && action?.id),
    [navigateTo, pessoasResponse?.data, setPessoa]
  );

  return null;
}

export default function KBar({ children }: KBarProps) {
  return (
    <KBarProvider>
      <MyActions />
      <KBarComponent>
        {children}
      </KBarComponent>
    </KBarProvider>
  );
}

const KBarComponent = ({ children }: { children: React.ReactNode }) => {
  useThemeSwitching();

  return (
    <>
      <KBarPortal>
        <KBarPositioner className='scrollbar-hide fixed inset-0 z-99999 bg-black/80 p-0! backdrop-blur-xs'>
          <KBarAnimator className='bg-background transition-all text-foreground relative mt-64! w-full max-w-[600px] -translate-y-12! overflow-hidden rounded-lg border shadow-lg'>
            <div className='bg-background'>
              <div className='border-x-0 border-b-2'>
                <KBarSearch
                  defaultPlaceholder='Digite um comando ou pesquise...'                  
                  className='bg-background w-full border-none px-6 py-4 text-lg outline-hidden focus:ring-0 focus:ring-offset-0 focus:outline-hidden'
                />
              </div>
              <RenderResults />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
};
function debounce(arg0: () => void, arg1: number) {
  throw new Error('Function not implemented.');
}

