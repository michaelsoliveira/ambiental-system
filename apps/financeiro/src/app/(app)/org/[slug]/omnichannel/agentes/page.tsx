'use client';

import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOcAgentesQuery, useOcProvisionIaDefaults } from '@/features/omnichannel/hooks/use-oc-api';
import { OcAgentesOrganograma } from '@/features/omnichannel/components/agentes/oc-agentes-organograma';
import {
  AgenteCreateModal,
  AgenteEditModal,
} from '@/features/omnichannel/components/agentes/oc-agente-modal';
import type { OcAgente } from '@/features/omnichannel/types';

export default function AgentesPage() {
  const { data: agentes = [], isLoading } = useOcAgentesQuery();
  const provision = useOcProvisionIaDefaults();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<OcAgente | null>(null);
  const hasJarvis = agentes.some((agente: OcAgente) => agente.nome === 'Jarvis' && agente.tipo === 'orchestrator');

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">Organograma de agentes</h1>
          <p className="text-sm text-muted-foreground">
            Hierarquia matricial — quem reporta a quem, agrupado por departamento
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!hasJarvis && (
            <Button
              variant="outline"
              onClick={() => provision.mutate(false)}
              disabled={provision.isPending}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Provisionar padrão
            </Button>
          )}
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo agente
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <OcAgentesOrganograma
          agentes={agentes}
          isLoading={isLoading}
          onAgentEdit={setEditingAgent}
        />
      </div>

      <AgenteCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <AgenteEditModal
        open={!!editingAgent}
        onClose={() => setEditingAgent(null)}
        onDeleted={() => setEditingAgent(null)}
        agenteId={editingAgent?.id ?? null}
      />
    </div>
  );
}
