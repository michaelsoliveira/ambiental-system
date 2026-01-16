'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, CircleCheckBig, Undo2, ClipboardListIcon } from 'lucide-react';
import { useState } from 'react';
import { CondicionanteListingItem } from '../licenca-condicionante-listing';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DocumentListDialog } from '../document-list-dialog';
import { useListDocumentosLicenca } from '@/hooks/use-documentos';
import { useDeleteVencimentoCondicionante } from '@/hooks/use-vencimento-condicionante';
import { toast } from 'sonner';
import { VencimentoCondicionante } from 'types';

interface CellActionProps {
  data: VencimentoCondicionante;
  index: number;
}

export const CellSubAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const { mutate: deleteVencimentoCondicionante, isSuccess } = useDeleteVencimentoCondicionante()
  const { data: documentosAnexados } = useListDocumentosLicenca(data.id)
  
  const [openDocumentList, setOpenDocumentList] = useState(false);

  const handleDelete = async (data: VencimentoCondicionante) => {
    deleteVencimentoCondicionante({ vencimentoId: data.id }, {
          onSuccess: () => {
              toast.success('O item da condicionante foi excluída com sucesso')
              setOpen(false)
          },
          onError: (error: any) => {
              toast.error(error.message || 'Erro ao excluir item da condicionante')
          }
      })
  }

  async function handleReturnCondicionante() {
    try {
      setLoading(true);
      data.parent.onReturn(data);
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false);
      setOpenReturnDialog(false);
    }
  }

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        // onConfirm={data.onDelete}
        onConfirm={() => handleDelete(data)}
        description="Está ação é irreversível, então realize com cuidado"
        loading={loading}
      />
      <AlertModal
        isOpen={openReturnDialog}
        onClose={() => setOpenReturnDialog(false)}
        onConfirm={handleReturnCondicionante}
        loading={loading}
        title="Você tem certeza que deseja retornar a condicionante?"
        description="O status será alterado para Pendente ou Atrasada automaticamente."
        confirmText="Retornar"
      />
      { documentosAnexados && (
        <>
          <DocumentListDialog
            documents={documentosAnexados}
            open={openDocumentList}
            onClose={() => setOpenDocumentList(false)}
          />
          
        </>
      ) }
      
      <div className="flex gap-2 justify-end">        
        <TooltipProvider>
          { data.status === 'concluida' ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={() => setOpenReturnDialog(true)}>
                    <Undo2 className="w-4 h-4 text-orange-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Retornar Condicionante</TooltipContent>
              </Tooltip>
              <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={() => setOpenDocumentList(true)}>
                  <ClipboardListIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Visualizar Documentos</TooltipContent>
            </Tooltip>
            </>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={() => data.parent.onComplete(data)}>
                    <CircleCheckBig className="w-4 h-4 text-green-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Concluir Condicionante</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={() => setOpen(true)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Excluir Vencimento</TooltipContent>
              </Tooltip>
            </>
          )}
        </TooltipProvider>
      </div>
    </>
  );
};
