'use client';

import { useState } from 'react';
import { Plus, Zap, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOcSkillsQuery, useOcSkillDelete } from '@/features/omnichannel/hooks/use-oc-api';
import { OcSkillModal } from '@/features/omnichannel/components/skills/oc-skill-modal';
import type { OcSkill } from '@/features/omnichannel/types';

export default function SkillsPage() {
  const { data: skills = [] } = useOcSkillsQuery();
  const deletar = useOcSkillDelete();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OcSkill | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (skill: OcSkill) => {
    setEditing(skill);
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
          <h1 className="text-xl font-semibold">Skills</h1>
          <p className="text-sm text-muted-foreground">
            Funções que o LLM chama — cada uma vinculada a uma Tool
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nova skill
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {skills.map((s: OcSkill) => (
          <Card
            key={s.id}
            className={`cursor-pointer transition-colors hover:border-primary/40 ${s.ativo ? '' : 'opacity-60'}`}
            onClick={() => openEdit(s)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <Zap className="h-4 w-4 shrink-0 text-primary" />
                  <CardTitle className="font-mono text-sm">{s.nome}</CardTitle>
                  {s.categoria && (
                    <Badge variant="secondary" className="text-xs uppercase">
                      {s.categoria}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    v{s.versao}
                  </Badge>
                  {!s.ativo && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      inativa
                    </Badge>
                  )}
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(s);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletar.mutate(s.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-muted-foreground">
              <p className="line-clamp-2">{s.descricao_llm}</p>
              {s.invocation_config?.handler && (
                <p className="font-mono text-[10px]">
                  internal → {String(s.invocation_config.handler)}
                </p>
              )}
              {s.invocation_config?.path && (
                <p className="font-mono text-[10px]">
                  {s.invocation_config.method ?? 'POST'} {s.invocation_config.path}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <OcSkillModal open={modalOpen} onClose={closeModal} skill={editing} />
    </div>
  );
}
