'use client';

import { useOcBasePath } from '../lib/oc-routes';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
  Activity,
  Archive,
  CircleDot,
  GitBranch,
  Inbox,
  Layers,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Settings,
  Shield,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useOcInboxDelete,
  useOcInboxesQuery,
  useOcPipelinesQuery,
} from '@/features/omnichannel/hooks/use-oc-api';
import { useOcStore } from '@/stores/use-oc-store';
import type { OcInbox } from '@/features/omnichannel/types';
import { toast } from 'sonner';
import {
  OcNavGroupSection,
  OcNovaInboxButton,
  type OcNavGroup,
  type OcNavLink,
} from './oc-sidebar-tree';
import { OcInboxCreateDialog } from './inbox/oc-inbox-create-dialog';
import { INBOX_COLOR_MAP, INBOX_ICON_MAP } from './inbox/oc-inbox-constants';

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function inboxMatch(
  pathname: string,
  search: string,
  opts: { view?: string; inboxId?: string; defaultGeral?: boolean },
) {
  if (!pathname.includes('/omnichannel/inbox')) return false;
  const params = new URLSearchParams(search);
  if (opts.inboxId) return params.get('inbox') === opts.inboxId;
  if (opts.view) return params.get('view') === opts.view && !params.get('inbox');
  if (opts.defaultGeral) {
    return !params.get('view') && !params.get('inbox');
  }
  return false;
}

export function OcLayout({ children }: { children: React.ReactNode }) {
  const { slug } = useOcBasePath();

  const pathname = usePathname();
  const search = useSearchParams().toString();
  const router = useRouter();
  const { data: pipelines = [] } = useOcPipelinesQuery();
  const { data: customInboxes = [] } = useOcInboxesQuery();
  const setFiltros = useOcStore((s) => s.setFiltros);
  const customInboxId = useOcStore((s) => s.customInboxId);
  const sidebarOpen = useOcStore((s) => s.sidebarOpen);
  const toggleSidebar = useOcStore((s) => s.toggleSidebar);
  const [inboxModalOpen, setInboxModalOpen] = useState(false);
  const [editInbox, setEditInbox] = useState<OcInbox | null>(null);
  const deletarInbox = useOcInboxDelete();

  const resetRuntimeFiltros = () => ({
    canalFiltro: null,
    atribuicaoFiltro: 'todas' as const,
    buscaTexto: '',
    filtroNaoLidas: false,
    filtroArquivadas: false,
    filtroGrupos: false,
    tagsFiltro: [] as string[],
  });

  const goInboxGeral = () => {
    setFiltros({ customInboxId: null, ...resetRuntimeFiltros() });
    router.push(`/org/${slug}/omnichannel/inbox`);
  };

  const goInboxPendentes = () => {
    setFiltros({
      customInboxId: null,
      ...resetRuntimeFiltros(),
      filtroNaoLidas: true,
    });
    router.push(`/org/${slug}/omnichannel/inbox?view=pendentes`);
  };

  const goInboxArquivadas = () => {
    setFiltros({
      customInboxId: null,
      ...resetRuntimeFiltros(),
      filtroArquivadas: true,
    });
    router.push(`/org/${slug}/omnichannel/inbox?view=arquivadas`);
  };

  const applyCustomInbox = (inbox: OcInbox) => {
    setFiltros({
      customInboxId: inbox.id,
      ...resetRuntimeFiltros(),
    });
    router.push(`/org/${slug}/omnichannel/inbox?inbox=${inbox.id}`);
  };

  const handleDeleteInbox = (inbox: OcInbox) => {
    if (!window.confirm(`Excluir a inbox "${inbox.nome}"?`)) return;
    deletarInbox.mutate(inbox.id, {
      onSuccess: () => {
        toast.success('Inbox excluída');
        if (customInboxId === inbox.id) {
          setFiltros({
            customInboxId: null,
            ...resetRuntimeFiltros(),
          });
          router.push(`/org/${slug}/omnichannel/inbox`);
        }
      },
      onError: () => toast.error('Não foi possível excluir a inbox'),
    });
  };

  const inboxItems: OcNavLink[] = [
    {
      href: `/org/${slug}/omnichannel/inbox`,
      label: 'Geral',
      icon: Inbox,
      match: (p, s) => inboxMatch(p, s, { defaultGeral: true }),
      onNavigate: goInboxGeral,
    },
    {
      href: `/org/${slug}/omnichannel/inbox?view=pendentes`,
      label: 'Não lidas',
      icon: Mail,
      match: (p, s) => inboxMatch(p, s, { view: 'pendentes' }),
      onNavigate: goInboxPendentes,
    },
    {
      href: `/org/${slug}/omnichannel/inbox?view=arquivadas`,
      label: 'Arquivadas',
      icon: Archive,
      match: (p, s) => inboxMatch(p, s, { view: 'arquivadas' }),
      onNavigate: goInboxArquivadas,
    },
    ...customInboxes.map((inbox) => ({
      href: `/org/${slug}/omnichannel/inbox?inbox=${inbox.id}`,
      label: inbox.nome,
      icon: INBOX_ICON_MAP[inbox.icone] ?? Inbox,
      accentClass: INBOX_COLOR_MAP[inbox.cor] ?? INBOX_COLOR_MAP.gray,
      match: (p: string, s: string) => inboxMatch(p, s, { inboxId: inbox.id }),
      onNavigate: () => applyCustomInbox(inbox),
      onEdit: () => setEditInbox(inbox),
      onDelete: () => handleDeleteInbox(inbox),
    })),
  ];

  const groups: OcNavGroup[] = [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: Inbox,
      defaultOpen: true,
      items: inboxItems,
      footer: <OcNovaInboxButton onClick={() => setInboxModalOpen(true)} />,
    },
    {
      id: 'pipelines',
      label: 'Pipelines',
      icon: GitBranch,
      defaultOpen: true,
      items: [
        {
          href: `/org/${slug}/omnichannel/pipelines`,
          label: 'Todos',
          icon: Layers,
          match: (p) => p === `/org/${slug}/omnichannel/pipelines`,
        },
        ...pipelines.map((p) => ({
          href: `/org/${slug}/omnichannel/pipelines/${p.id}`,
          label: p.nome,
          icon: CircleDot,
          match: (path: string) => path === `/org/${slug}/omnichannel/pipelines/${p.id}`,
        })),
      ],
    },
    {
      id: 'jarvis',
      label: 'Jarvis',
      icon: Sparkles,
      defaultOpen: true,
      items: [
        {
          href: `/org/${slug}/omnichannel/jarvis`,
          label: 'Visão geral',
          icon: LayoutDashboard,
          match: (p) => p === `/org/${slug}/omnichannel/jarvis`,
        },
        {
          href: `/org/${slug}/omnichannel/agentes`,
          label: 'Agentes',
          icon: Users,
          match: (p) => p === `/org/${slug}/omnichannel/agentes`,
        },
        { href: `/org/${slug}/omnichannel/skills`, label: 'Skills', icon: Zap },
        { href: `/org/${slug}/omnichannel/tools`, label: 'Tools', icon: Wrench },
        { href: `/org/${slug}/omnichannel/execucoes`, label: 'Execuções', icon: Activity },
        { href: `/org/${slug}/omnichannel/watchdog`, label: 'Watchdog', icon: Shield },
        {
          href: `/org/${slug}/omnichannel/execucoes?por=agente`,
          label: 'Por agente',
          icon: UserRound,
          match: (p, s) => p.startsWith(`/org/${slug}/omnichannel/execucoes`) && s.includes('por=agente'),
        },
      ],
    },
  ];

  const bottomLinks: OcNavLink[] = [
    {
      href: `/org/${slug}/omnichannel/automacoes`,
      label: 'Automações',
      icon: MessageSquare,
    },
    {
      href: `/org/${slug}/omnichannel/configuracoes`,
      label: 'Configurações',
      icon: Settings,
    },
  ];

  const dashboardActive = pathname === `/org/${slug}/omnichannel/dashboard`;
  const isInboxRoute = pathname.startsWith(`/org/${slug}/omnichannel/inbox`);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 overflow-hidden">
      <aside
        className={cn(
          'flex shrink-0 flex-col border-r bg-sidebar text-sm transition-[width] duration-200 ease-in-out',
          sidebarOpen ? 'w-60 overflow-hidden' : 'w-0 overflow-hidden border-r-0',
        )}
      >
        <div className="flex w-60 max-w-full items-center justify-between gap-2 border-b px-3 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate font-semibold text-foreground">Ambiental Atendimento</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground"
            onClick={toggleSidebar}
            title="Ocultar menu"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex w-60 max-w-full flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden p-2">
          <Link
            href={`/org/${slug}/omnichannel/dashboard`}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors',
              dashboardActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
            Dashboard
          </Link>

          {groups.map((group) => (
            <OcNavGroupSection key={group.id} group={group} pathname={pathname} search={search} />
          ))}

          <div className="my-1 border-t" />

          {bottomLinks.map((item) => {
            const Icon = item.icon ?? Settings;
            const active = item.match
              ? item.match(pathname, search)
              : isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="w-60 max-w-full border-t p-2">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => router.push(`/org/${slug}/omnichannel/configuracoes`)}
          >
            <Settings className="h-3.5 w-3.5" />
            Conectar canal
          </button>
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {!sidebarOpen && (
          <div className="flex w-10 shrink-0 flex-col items-center border-r bg-background py-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={toggleSidebar}
              title="Mostrar menu"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div
          className={cn(
            'flex min-h-0 min-w-0 flex-1 flex-col',
            isInboxRoute ? 'h-full overflow-hidden' : 'overflow-y-auto',
          )}
        >
          {children}
        </div>
      </main>

      <OcInboxCreateDialog
        open={inboxModalOpen || editInbox !== null}
        onOpenChange={(open) => {
          if (!open) {
            setInboxModalOpen(false);
            setEditInbox(null);
          } else {
            setInboxModalOpen(true);
          }
        }}
        inbox={editInbox}
      />
    </div>
  );
}
