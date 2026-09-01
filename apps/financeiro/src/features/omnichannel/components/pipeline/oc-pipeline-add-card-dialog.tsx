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
import { useOcCardCreate, useOcConversasQuery } from '@/features/omnichannel/hooks/use-oc-api';
import type { OcPipelineStage } from '@/features/omnichannel/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId: string;
  stage: OcPipelineStage;
};

export function OcPipelineAddCardDialog({ open, onOpenChange, pipelineId, stage }: Props) {
  const { data: conversas = [] } = useOcConversasQuery();
  const criar = useOcCardCreate();
  const [modo, setModo] = useState<'conversa' | 'manual'>('conversa');
  const [conversaId, setConversaId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');

  const reset = () => {
    setModo('conversa');
    setConversaId('');
    setTitulo('');
    setValor('');
  };

  const handleSubmit = () => {
    const valorNum = valor ? Number(valor.replace(',', '.')) : undefined;
    criar.mutate(
      {
        pipelineId,
        stage_id: stage.id,
        conversa_id: modo === 'conversa' && conversaId ? conversaId : undefined,
        titulo: modo === 'manual' ? titulo.trim() || undefined : undefined,
        valor_estimado: valorNum,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  const canSubmit =
    modo === 'conversa' ? !!conversaId : !!titulo.trim();

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar card — {stage.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={modo === 'conversa' ? 'default' : 'outline'}
              onClick={() => setModo('conversa')}
            >
              Vincular conversa
            </Button>
            <Button
              type="button"
              size="sm"
              variant={modo === 'manual' ? 'default' : 'outline'}
              onClick={() => setModo('manual')}
            >
              Card manual
            </Button>
          </div>

          {modo === 'conversa' ? (
            <div className="space-y-2">
              <Label>Conversa</Label>
              <Select value={conversaId} onValueChange={setConversaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conversa" />
                </SelectTrigger>
                <SelectContent>
                  {conversas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.contato?.nome || c.contato?.telefone || c.id.slice(0, 8)} — {c.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                placeholder="Nome do lead ou oportunidade"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Valor estimado (opcional)</Label>
            <Input
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || criar.isPending}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
