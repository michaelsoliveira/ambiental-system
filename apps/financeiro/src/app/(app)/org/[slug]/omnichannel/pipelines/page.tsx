'use client';

import { useOcBasePath, ocHref } from '@/features/omnichannel/lib/oc-routes';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GitBranch, Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useOcPipelineCreate,
  useOcPipelineDelete,
  useOcPipelinesQuery,
} from '@/features/omnichannel/hooks/use-oc-api';
import {
  getPinnedPipelineIds,
  togglePinnedPipeline,
} from '@/features/omnichannel/components/pipeline/oc-pipeline-utils';
import { cn } from '@/lib/utils';

export default function PipelinesPage() {
  const { slug } = useOcBasePath();

  const { data: pipelines = [], isLoading } = useOcPipelinesQuery();
  const criar = useOcPipelineCreate();
  const deletar = useOcPipelineDelete();
  const [novo, setNovo] = useState('');
  const [criando, setCriando] = useState(false);
  const [pinned, setPinned] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setPinned(getPinnedPipelineIds());
  }, []);

  const handleCriar = () => {
    if (!novo.trim()) return;
    criar.mutate(
      { nome: novo.trim() },
      {
        onSuccess: () => {
          setNovo('');
          setCriando(false);
        },
      },
    );
  };

  const handlePin = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPinned(togglePinnedPipeline(id));
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deletar.mutate(deleteId, {
      onSuccess: () => {
        setPinned((prev) => prev.filter((x) => x !== deleteId));
        setDeleteId(null);
      },
    });
  };

  const sorted = [...pipelines].sort((a, b) => {
    const ap = pinned.includes(a.id) ? 0 : 1;
    const bp = pinned.includes(b.id) ? 0 : 1;
    return ap - bp;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold">Pipelines</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Kanban customizado por org. Cada pipeline tem stages próprias e cards independentes — podem ou não estar
            vinculados a uma conversa.
          </p>
        </div>
        <Button onClick={() => setCriando(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo pipeline
        </Button>
      </div>

      {criando && (
        <div className="flex flex-wrap gap-2 rounded-lg border p-3">
          <Input
            className="max-w-sm flex-1"
            placeholder="Nome do pipeline (ex: Vendas Mentoria)"
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCriar()}
            autoFocus
          />
          <Button size="sm" onClick={handleCriar} disabled={!novo.trim() || criar.isPending}>
            Criar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCriando(false)}>
            Cancelar
          </Button>
        </div>
      )}

      {isLoading && (
        <p className="text-sm text-muted-foreground">Carregando pipelines…</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((p) => (
          <div
            key={p.id}
            className="group relative rounded-lg border bg-card transition-colors hover:bg-accent/50"
          >
            <Link
              href={`/org/${slug}/omnichannel/pipelines/${p.id}`}
              className="block p-4 pr-20"
            >
              <p className="font-medium">{p.nome}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {p.stages_count ?? 0} stages · {p.cards_count ?? 0} cards
              </p>
            </Link>
            <div className="absolute right-3 top-3 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => handlePin(e, p.id)}
                aria-label={pinned.includes(p.id) ? 'Desfavoritar' : 'Favoritar'}
              >
                <Star
                  className={cn(
                    'h-4 w-4',
                    pinned.includes(p.id) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground',
                  )}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeleteId(p.id);
                }}
                aria-label="Excluir pipeline"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && pipelines.length === 0 && !criando && (
        <p className="text-sm text-muted-foreground">
          Nenhum pipeline ainda. Clique em &quot;Novo pipeline&quot; para começar.
        </p>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pipeline?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os stages e cards deste pipeline serão removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deletar.isPending}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
