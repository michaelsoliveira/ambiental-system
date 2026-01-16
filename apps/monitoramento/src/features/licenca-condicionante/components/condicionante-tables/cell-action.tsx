'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, CircleCheckBig, Undo2, ClipboardListIcon } from 'lucide-react';
import { useState } from 'react';
import { CondicionanteListingItem } from '../licenca-condicionante-listing';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CompleteCondicionanteDialog } from '../complete-condicionante-dialog';
import { DocumentListDialog } from '../document-list-dialog';
import { useListDocumentosLicenca } from '@/hooks/use-documentos';
import { useLicencaCondicionanteById } from '@/hooks/use-licenca-condicionantes';

interface CellActionProps {
  data: CondicionanteListingItem;
  index: number;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={data.onDelete}
        description="Está ação é irreversível, então realize com cuidado"
        loading={loading}
      />
      
      <div className="flex gap-2 justify-end">        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" onClick={data.onEdit}>
                <Pencil className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar Condicionante</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" onClick={() => setOpen(true)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir Condicionante</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
};
