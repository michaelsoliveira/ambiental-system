'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthContext } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { Edit, Trash, Copy, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface CellActionProps {
  data: any;
  onEdit?: (data: any) => void;
}

export const CellAction: React.FC<CellActionProps> = ({ data, onEdit }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { client } = useAuthContext();
  const queryClient = useQueryClient();
  
  const onConfirm = async () => {
    try {
      setLoading(true)
      await client.delete(`/lancamento/${data.id}`).then((res: any) => {
        const { error, message } = res.data;
        if (!error) {
          toast.success(message)
          router.refresh();
        } else {
          toast.error(message)
        }
      })
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["lancamentos"] })
    }
  };

  const handleDuplicate = async () => {
    try {
      await client.post(`organizations/${data.organization_id}/lancamentos/${data.id}/duplicate`).then((res: any) => {
        const { error, message } = res.data;
        if (!error) {
          toast.success(message)
          router.refresh();
          queryClient.invalidateQueries({ queryKey: ["lancamentos"] })
        } else {
          toast.error(message)
        }
      })
    } catch (error: any) {
      toast.error('Erro ao duplicar lançamento')
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(data);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      />
      
      <TooltipProvider>
        <div 
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-full"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-full"
                onClick={handleDuplicate}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Duplicar</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-full"
                onClick={() => {/* Download de documento */}}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer rounded-full"
                onClick={() => setOpen(true)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Excluir</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </>
  );
};