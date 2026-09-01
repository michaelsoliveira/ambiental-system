'use client';

import { useState } from 'react';
import { Plus, Wrench, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOcToolsQuery } from '@/features/omnichannel/hooks/use-oc-api';
import { OcToolModal } from '@/features/omnichannel/components/tools/oc-tool-modal';
import type { OcTool } from '@/features/omnichannel/types';

export default function ToolsPage() {
  const { data: tools = [] } = useOcToolsQuery();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OcTool | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (tool: OcTool) => {
    setEditing(tool);
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
          <h1 className="text-xl font-semibold">Tools</h1>
          <p className="text-sm text-muted-foreground">Conexões reutilizáveis entre skills</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nova tool
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((t: OcTool) => (
          <Card
            key={t.id}
            className="cursor-pointer transition-colors hover:border-primary/40"
            onClick={() => openEdit(t)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Wrench className="h-4 w-4 shrink-0 text-primary" />
                  <CardTitle className="truncate text-sm">{t.nome}</CardTitle>
                  <Badge variant="outline" className="shrink-0 text-xs uppercase">
                    {t.tipo.replace('_', ' ')}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(t);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            {t.descricao && (
              <CardContent className="text-xs text-muted-foreground">{t.descricao}</CardContent>
            )}
          </Card>
        ))}
      </div>

      <OcToolModal open={modalOpen} onClose={closeModal} tool={editing} />
    </div>
  );
}
