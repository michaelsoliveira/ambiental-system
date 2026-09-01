'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useOcStageCreate } from '@/features/omnichannel/hooks/use-oc-api';
import type { OcPipelineStage, TipoStage } from '@/features/omnichannel/types';
import { stageBackground } from './oc-pipeline-utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId: string;
  stages: OcPipelineStage[];
};

const CORES = ['zinc', 'blue', 'amber', 'green', 'red'] as const;

export function OcPipelineStagesDialog({ open, onOpenChange, pipelineId, stages }: Props) {
  const criar = useOcStageCreate();
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoStage>('normal');
  const [cor, setCor] = useState<string>('zinc');

  const handleAdd = () => {
    if (!nome.trim()) return;
    criar.mutate(
      {
        pipelineId,
        nome: nome.trim(),
        tipo,
        cor,
        ordem: stages.length,
      },
      {
        onSuccess: () => {
          setNome('');
          setTipo('normal');
          setCor('zinc');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar stages</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {stages.map((s) => (
            <div
              key={s.id}
              className={`flex items-center justify-between rounded-md border px-3 py-2 ${stageBackground(s)}`}
            >
              <div className="flex items-center gap-2">
                {s.tipo === 'ganho' && <span aria-hidden>🏆</span>}
                {s.tipo === 'perdido' && <span aria-hidden>✗</span>}
                <span className="text-sm font-medium">{s.nome}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {s.tipo}
              </Badge>
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium">Nova stage</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Negociação"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="ganho">Ganho</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Select value={cor} onValueChange={setCor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CORES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleAdd} disabled={!nome.trim() || criar.isPending}>
            Adicionar stage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
