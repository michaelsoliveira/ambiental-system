'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAnoController } from '@/hooks/use-ano-controller';
import { useAnoStore } from '@/stores/useAnoStore';

export function AnoAtivoModal({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { anoAtivo } = useAnoStore();
  const { atualizarAnoAtivo, resetAnoAtivo } = useAnoController()

  const handleChange = async (novoAno: string) => {
    await atualizarAnoAtivo(novoAno)
  }
  const [anoTemp, setAnoTemp] = useState(anoAtivo ?? '');

  const handleSalvar = () => {
    if (anoTemp.trim() !== '') {
      handleChange(anoTemp.trim());
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    resetAnoAtivo();
    setAnoTemp('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Ano Ativo</DialogTitle>
        </DialogHeader>
        <span>Ano ativo: {anoAtivo}</span>
        <div className="space-y-4">
          <Input
            type="text"
            value={anoTemp}
            onChange={(e) => setAnoTemp(e.target.value)}
            placeholder="Digite o ano (ex: 2025)"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleReset}>
              Restaurar padrão
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
