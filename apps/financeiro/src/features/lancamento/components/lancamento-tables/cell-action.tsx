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
import { Edit, Trash, Copy } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
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
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { client } = useAuthContext();
  const queryClient = useQueryClient();
  
  const onConfirm = async () => {
    if (!slug) {
      toast.error('Organização não encontrada')
      return
    }
    try {
      setLoading(true)
      await client.delete(
        `/organizations/${slug}/financeiro/lancamentos/${data.id}`,
      )
      toast.success('Lançamento excluído com sucesso!')
      router.refresh()
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? error?.message ?? 'Erro ao excluir lançamento'
      toast.error(message)
    } finally {
      setLoading(false);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["lancamentos"] })
    }
  };

  const handleDuplicate = async () => {
    if (!slug) {
      toast.error('Organização não encontrada')
      return
    }
    try {
      await client.post(
        `/organizations/${slug}/financeiro/lancamentos/${data.id}/duplicate`,
      )
      toast.success('Lançamento duplicado com sucesso!')
      router.refresh();
      queryClient.invalidateQueries({ queryKey: ["lancamentos"] })
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? 'Erro ao duplicar lançamento'
      toast.error(message)
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
              <Button variant="ghost" className="h-8 w-8 p-0" onClick={handleEdit}>
                <span className="sr-only">Editar lançamento</span>
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" onClick={handleDuplicate}>
                <span className="sr-only">Duplicar lançamento</span>
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicar</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-600"
                onClick={() => setOpen(true)}
                disabled={loading}
              >
                <span className="sr-only">Excluir lançamento</span>
                <Trash className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </>
  );
};