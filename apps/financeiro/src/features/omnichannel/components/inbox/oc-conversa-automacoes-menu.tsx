'use client';

import { useOcBasePath } from '../../lib/oc-routes';

import Link from 'next/link';
import { Loader2, Settings, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useOcAutomacoesQuery,
  useOcExecutarAutomacao,
} from '../../hooks/use-oc-api';

const TRIGGER_LABELS: Record<string, string> = {
  tag_adicionada: 'Tag adicionada',
  tag_removida: 'Tag removida',
  mensagem_recebida: 'Mensagem recebida',
  status_mudou: 'Status mudou',
  conversa_atribuida: 'Conversa atribuída',
};

type Props = {
  conversaId: string;
};

export function OcConversaAutomacoesMenu({ conversaId }: Props) {
  const { slug } = useOcBasePath();

  const { data: automacoes = [], isLoading } = useOcAutomacoesQuery();
  const executar = useOcExecutarAutomacao();
  const ativas = automacoes.filter((a: any) => a.ativa);

  const handleRun = (automacaoId: string, nome: string) => {
    executar.mutate(
      { conversaId, automacaoId },
      {
        onSuccess: (res: any) => {
          if (res.ok) {
            toast.success(`Automação "${nome}" executada`);
          } else {
            const erros = res.resultados
              .filter((r: any) => r.erro)
              .map((r: any) => String(r.erro))
              .join('; ');
            toast.error(erros || `Falha ao executar "${nome}"`);
          }
        },
      },
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Automações"
          disabled={executar.isPending}
        >
          {executar.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Zap className="h-3.5 w-3.5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Executar automação</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem disabled>Carregando…</DropdownMenuItem>
        ) : ativas.length === 0 ? (
          <DropdownMenuItem disabled>Nenhuma automação ativa</DropdownMenuItem>
        ) : (
          ativas.map((a: any) => (
            <DropdownMenuItem
              key={a.id}
              disabled={executar.isPending}
              onClick={() => handleRun(a.id, a.nome)}
              className="flex flex-col items-start gap-0.5"
            >
              <span className="font-medium">{a.nome}</span>
              <span className="text-[11px] text-muted-foreground">
                {TRIGGER_LABELS[a.trigger_tipo] ?? a.trigger_tipo}
                {a.acoes?.length ? ` · ${a.acoes.length} ação(ões)` : ''}
              </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={`/org/${slug}/omnichannel/automacoes`}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <Settings className="h-3.5 w-3.5" />
            Gerenciar automações
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
