'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, PlusIcon } from 'lucide-react'
import { columns } from './condicionante-tables/columns'
import { EditLicencaCondicionanteDialog, EditLicencaCondicionanteFormData } from './edit-licenca-condicionante-dialog'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useCreateLicencaCondicionante, useDeleteLicencaCondicionante, useLicencaCondicionantes, useReturnCondicionante, useUpdateLicencaCondicionante } from '@/hooks/use-licenca-condicionantes'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { LicencaCondicionanteDataTableSearch } from './condicionante-tables/licenca-condicionante-data-table-search'
import { useLicencaCondicionanteTableFilters } from './condicionante-tables/use-licenca-condicionante-table-filters'
import { useCondicionantes } from '@/hooks/use-condicionantes'
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter'
import { CompleteCondicionanteDialog } from './complete-condicionante-dialog'
import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { LicencaCondicionanteDataTable } from './condicionante-tables/licenca-condicionante-data-table'
import { toDateString } from '@/lib/utils'
import { CondicionanteFrequenciaType, VencimentoCondicionante } from 'types'
import LicencaCondicionanteTableAction from './condicionante-tables/licenca-condicionante-table-action'
import { useLicencaFindById } from '@/hooks/use-licencas'
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton'

export interface CondicionanteListingItem {
    id: string;
    licencaId: string;
    condicionanteId: string;
    descricao: string;
    dataAtribuicao: string;
    diasRestantes: number;
    dataCumprimento?: string | null;
    dataVencimento?: string | null;
    status: 'pendente' | 'concluida' | 'atrasada' | 'em_andamento';
    responsavel: string;
    diasAntecedencia?: number | null;
    observacao?: string;
    documentos?: any;
    vencimentos?: VencimentoCondicionante[];
    meses?: number[];
    onEdit: () => void;
    onDelete: () => void;
}

export function LicencaCondicionanteListing() {
    const [editData, setEditData] = useState<EditLicencaCondicionanteFormData & { id: string } | null>(null)
    const [selectedVencimento, setSelectedVencimento] = useState<VencimentoCondicionante | null>(null);
    const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
    const { mutate: deleteCondicionante, isSuccess } = useDeleteLicencaCondicionante()
    const { mutate: returnCondicionante } = useReturnCondicionante()
    const router = useRouter()
    const queryClient = useQueryClient()
    const params = useParams()
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
    const { condicionante, dataInicio, dataFim, status, page } = useLicencaCondicionanteTableFilters()
    const { licencaId } = params as { licencaId: string }
    const searchParams = useSearchParams(); 
    
    const { data: dataLC, isLoading } = useLicencaCondicionantes(licencaId, {
        page,
        limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 10,
        condicionante, 
        status,
        dataInicio,
        dataFim
    })
    const { data, total: totalItems  } = dataLC ?? { data: [], total: 0 }
    const { data: dataC } = useCondicionantes({ orderBy: 'descricao' })
    const { data: condicionantes = [] } = dataC ?? { condicionantes: [], total: 0 }
    const { data: licenca } = useLicencaFindById(licencaId)

    const createMutation = useCreateLicencaCondicionante(licencaId)

    const onSave = async (data: any) => {
        try {
            await createMutation.mutateAsync(data)
            .then((res: any) => {
              if (!res.error) {
                setIsDialogOpen(false)
              }
              toast(res.message)
            })
        } catch (error: any) {
          toast(error.message)
        }
      }
    
    
    const handleEdit = (item: CondicionanteListingItem) => {
        const condicionante = condicionantes.find((cond: any) => cond.id === item.condicionanteId)
        const isUnica = condicionante?.frequencia === 'unica';
        if (isUnica) {
            setEditData({
                id: item.id,
                condicionanteId: item.condicionanteId ?? "",
                dataAtribuicao: toDateString(item.dataAtribuicao),                
                hasUnicaCondicionante: true,
                diasAntecedencia: item.diasAntecedencia ?? 0,
                meses: item.meses ?? [],
                dataVencimento: toDateString(item.dataVencimento)
            });
        } else {
            setEditData({
                id: item.id,
                condicionanteId: item.condicionanteId ?? "",
                dataAtribuicao: toDateString(item.dataAtribuicao),
                hasUnicaCondicionante: false,
                diasAntecedencia: item.diasAntecedencia ?? 0,
                meses: item.meses ?? []
            });
        }
        setIsDialogOpen(true)
    }

    const handleComplete = (vencimento: VencimentoCondicionante) => {
        setSelectedVencimento(vencimento);
        setOpenCompleteDialog(true);
    }

    const updateMutation = useUpdateLicencaCondicionante()

    const handleDelete = async (data: CondicionanteListingItem) => {
        deleteCondicionante({ id: data.id }, {
            onSuccess: () => {
                toast.success('Condicionante excluída com sucesso')
            },
            onError: (error: any) => {
                toast.error(error.message || 'Erro ao excluir condicionante')
            }
        })
    }
    
    const handleReturn = async (data: VencimentoCondicionante) => {
        returnCondicionante({ id: data.id }, {
            onSuccess: async () => {
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['licenca-condicionantes'] }), 
                    queryClient.invalidateQueries({ queryKey: ['dashboard-totals'] })
                  ])
                toast.success('Condicionante reaberta com sucesso')
            },
            onError: (error: any) => {
                toast.error(error.message || 'Erro ao atualizar condicionante')
            }
        })
    }

    const enhancedData = data?.map((item: any) => ({
          ...item,
          onEdit: () => handleEdit(item),
          onDelete: () => handleDelete(item),
          vencimentos: item.vencimentos?.map((v: any) => ({
            ...v,
            parent: {
                onComplete: (data: VencimentoCondicionante) => handleComplete(data),
                onReturn: (data: VencimentoCondicionante) => handleReturn(data),
            }
          }))
        }))

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="rounded-full"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-semibold">Condicionantes da Licença Nº {licenca?.numeroLicenca} - {licenca?.empresa?.pessoa?.juridica?.nome_fantasia}</h1>
                <Button
                    onClick={() => {
                        setEditData({
                            id: "",
                            hasUnicaCondicionante: false,
                            condicionanteId: "",
                            dataAtribuicao: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }),
                            diasAntecedencia: 0,
                        })
                        setIsDialogOpen(true)
                    }}
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Adicionar
                </Button>
            </div>
            <LicencaCondicionanteTableAction />
            {
            isLoading 
                ? (
                    <DataTableSkeleton />
                ) : (    
                    <LicencaCondicionanteDataTable columns={columns} data={enhancedData ?? []} totalItems={totalItems ?? 0} />
                )
                
            }
            { selectedVencimento && (
                <CompleteCondicionanteDialog 
                    isOpen={openCompleteDialog}
                    onClose={() => setOpenCompleteDialog(false)}
                    data={selectedVencimento}
                />
            ) }
            <EditLicencaCondicionanteDialog
                open={isDialogOpen}
                initialData={editData ?? undefined}
                onClose={() => setIsDialogOpen(false)}
                onSubmit={async (formData) => {
                    if (editData?.id) {
                        const payloadBase = {
                            ...formData,
                            id: editData.id,
                            licencaId: licenca?.id,
                            dataAtribuicao: formData.dataAtribuicao,
                            meses: formData.meses
                        };
                    
                        const payload = formData.hasUnicaCondicionante
                            ? {
                                ...payloadBase,
                                dataVencimento: formData.dataVencimento
                            }
                            : payloadBase;
                    
                        await updateMutation.mutateAsync(payload)
                            .then((res: any) => {
                                if (!res.error) {
                                    setIsDialogOpen(false);
                                }
                                toast(res.message);
                            });
                    } else {
                        onSave?.(formData);
                    }
                }}
                condicionantesDisponiveis={condicionantes}
            />
            
        </div>
    )
}
