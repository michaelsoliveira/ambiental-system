'use client';

import { useState } from 'react';
import { Plus, Zap, Trash2, Power, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useOcAutomacoesQuery,
  useOcAutomacaoDelete,
  useOcAutomacaoPatch,
} from '@/features/omnichannel/hooks/use-oc-api';
import { OcAutomacaoModal } from '@/features/omnichannel/components/automacoes/oc-automacao-modal';
import type { OcAutomacao } from '@/features/omnichannel/types';

const TRIGGERS: Record<string, string> = {
  tag_adicionada: 'Tag adicionada',
  tag_removida: 'Tag removida',
  mensagem_recebida: 'Mensagem recebida',
  status_mudou: 'Status mudou',
  conversa_atribuida: 'Conversa atribuída',
};

const ACTION_LABELS: Record<string, string> = {
  adicionar_tag: 'Adicionar tag',
  remover_tag: 'Remover tag',
  mudar_status: 'Mudar status',
  enviar_mensagem: 'Enviar mensagem',
  adicionar_pipeline: 'Pipeline',
  atribuir_usuario: 'Atribuir usuário',
  mover_stage: 'Mover estágio',
};

export default function AutomacoesPage() {
  const { data: automacoes = [], isLoading } = useOcAutomacoesQuery();
  const patch = useOcAutomacaoPatch();
  const deletar = useOcAutomacaoDelete();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OcAutomacao | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (automacao: OcAutomacao) => {
    setEditing(automacao);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Automações</h1>
          <p className="text-sm text-muted-foreground">
            Quando algo acontece → executa uma sequência de ações
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nova automação
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : automacoes.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground">
          <Zap className="h-8 w-8 opacity-20" />
          <p className="text-sm">Nenhuma automação configurada</p>
          <Button variant="outline" size="sm" onClick={openCreate}>
            Criar primeira automação
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {automacoes.map((a: OcAutomacao) => (
            <Card
              key={a.id}
              className={`cursor-pointer transition-colors hover:border-primary/40 ${a.ativa ? '' : 'opacity-60'}`}
              onClick={() => openEdit(a)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">{a.nome}</CardTitle>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Editar"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(a);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title={a.ativa ? 'Desativar' : 'Ativar'}
                      onClick={(e) => {
                        e.stopPropagation();
                        patch.mutate({ id: a.id, ativa: !a.ativa });
                      }}
                    >
                      <Power className={`h-3.5 w-3.5 ${a.ativa ? 'text-green-600' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletar.mutate(a.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <Badge variant={a.ativa ? 'default' : 'secondary'} className="w-fit text-[10px]">
                  {a.ativa ? 'Ativa' : 'Inativa'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>Trigger: {TRIGGERS[a.trigger_tipo] ?? a.trigger_tipo}</p>
                <p>Limite: {a.limite_rpm}/min por conversa</p>
                {(a.acoes?.length ?? 0) > 0 && (
                  <p>
                    Ações:{' '}
                    {(a.acoes ?? [])
                      .map((ac) => ACTION_LABELS[String(ac.tipo)] ?? String(ac.tipo))
                      .join(' → ')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <OcAutomacaoModal open={modalOpen} onClose={closeModal} automacao={editing} />
    </div>
  );
}
