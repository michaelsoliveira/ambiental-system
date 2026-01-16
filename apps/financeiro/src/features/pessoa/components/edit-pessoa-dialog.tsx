'use client';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PessoaForm } from './pessoa-form';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface EditPessoaDialogProps {
  pessoa?: any;
  open: boolean;
  setOpen: (open: boolean) => void;
  trigger?: React.ReactNode;
  className?: string;
}

export function EditPessoaDialog({
  pessoa,
  open,
  setOpen,
  trigger,
  className
}: EditPessoaDialogProps) {
  const { slug } = useParams<{ slug: string }>();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>
            {pessoa ? 'Editar Pessoa' : 'Nova Pessoa'}
          </DialogTitle>
        </DialogHeader>
        
        <PessoaForm
          slug={slug}
          initialData={pessoa}
          onClose={() => setOpen(false)}
        />
        <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button form="form-pessoa" type="submit">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}