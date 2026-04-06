'use client';

import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Ban, CheckCheck, Clock3, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthContext } from '@/context/AuthContext';

type LancamentoStatus = 'PENDENTE' | 'CONFIRMADO' | 'PAGO' | 'ATRASADO' | 'CANCELADO';

const STATUS_ORDER: LancamentoStatus[] = [
  'PENDENTE',
  'CONFIRMADO',
  'PAGO',
  'ATRASADO',
  'CANCELADO',
];

const STATUS_LABEL: Record<LancamentoStatus, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  PAGO: 'Pago',
  ATRASADO: 'Atrasado',
  CANCELADO: 'Cancelado',
};

const STATUS_ICON: Record<LancamentoStatus, any> = {
  PENDENTE: Clock3,
  CONFIRMADO: CheckCheck,
  PAGO: CheckCheck,
  ATRASADO: AlertTriangle,
  CANCELADO: Ban,
};

const STATUS_COLOR: Record<LancamentoStatus, string> = {
  PENDENTE: 'text-yellow-600',
  CONFIRMADO: 'text-blue-600',
  PAGO: 'text-green-600',
  ATRASADO: 'text-red-600',
  CANCELADO: 'text-gray-500',
};

interface StatusQuickActionProps {
  data: any;
}

export function StatusQuickAction({ data }: StatusQuickActionProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { client } = useAuthContext();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const currentStatus = (data.status_lancamento || 'PENDENTE') as LancamentoStatus;
  const Icon = STATUS_ICON[currentStatus] || Clock3;
  const colorClass = STATUS_COLOR[currentStatus] || 'text-muted-foreground';

  const handleQuickStatusUpdate = async (targetStatus: LancamentoStatus) => {
    if (targetStatus === currentStatus) return;
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      const formData = new FormData();
      formData.append('data', JSON.stringify({ status_lancamento: targetStatus }));

      await client
        .put(`organizations/${slug}/financeiro/lancamentos/${data.id}`, formData)
        .then((res: any) => {
          const { error, message } = res.data;
          if (!error) {
            toast.success(message || `Status alterado para ${STATUS_LABEL[targetStatus]}`);
            router.refresh();
          } else {
            toast.error(message || 'Não foi possível alterar o status');
          }
        });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao atualizar status do lançamento');
    } finally {
      setIsUpdating(false);
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
    }
  };

  return (
    <TooltipProvider>
      <DropdownMenu modal={false}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`h-7 w-7 p-0 ${colorClass}`}
                disabled={isUpdating}
                onClick={(event) => event.stopPropagation()}
              >
                <span className="sr-only">{`Status ${STATUS_LABEL[currentStatus]}`}</span>
                {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>{`Status: ${STATUS_LABEL[currentStatus]}`}</TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="start" onClick={(event) => event.stopPropagation()}>
          {STATUS_ORDER.map((status) => {
            const StatusIcon = STATUS_ICON[status];
            const isCurrent = status === currentStatus;

            return (
              <DropdownMenuItem
                key={status}
                onSelect={(event) => {
                  event.preventDefault();
                  handleQuickStatusUpdate(status);
                }}
                className={isCurrent ? 'bg-muted' : ''}
              >
                <StatusIcon className={`mr-2 h-4 w-4 ${STATUS_COLOR[status]}`} />
                {STATUS_LABEL[status]}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
