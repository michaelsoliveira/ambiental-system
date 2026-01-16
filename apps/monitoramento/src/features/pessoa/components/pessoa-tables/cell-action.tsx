'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Product } from '@/constants/data';
import { useAuthContext } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { Edit, MoreHorizontal, Trash, Calendar1 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { PessoaType } from 'types';

interface CellActionProps {
  data: PessoaType;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { client } = useAuthContext();
  const queryClient = useQueryClient();

  const onConfirm = async () => {
    try {
      setLoading(true)
      await client.delete(`/pessoa/${data.id}`).then((res: any) => {
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
      queryClient.invalidateQueries({ queryKey: ["pessoas"] })
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
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/pessoa/${data.id}`)}
          >
            <Edit className='mr-2 h-4 w-4' /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className='mr-2 h-4 w-4' /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
