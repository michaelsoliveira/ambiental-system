import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createEmpresa } from '@/http/empresa/create-empresa'
import { deleteEmpresa } from '@/http/empresa/delete-empresa'
import { getEmpresa, getEmpresas } from '@/http/empresa/get-empresas'
import { updateEmpresa } from '@/http/empresa/update-empresa'
import { queryClient } from '@/lib/react-query'

export function useEmpresas(org: string, params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['empresas', org, params],
    queryFn: () => getEmpresas(org, params),
    enabled: !!org,
  })
}

export function useEmpresa(org: string, id: string, enabled = true) {
  return useQuery({
    queryKey: ['empresa', org, id],
    queryFn: () => getEmpresa(org, id),
    enabled: !!org && !!id && enabled,
  })
}

export function useCreateEmpresa(org: string) {
  return useMutation({
    mutationFn: (data: { pessoa_id: string }) => createEmpresa(org, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas', org] })
      toast.success('Empresa criada com sucesso.')
    },
  })
}

export function useUpdateEmpresa(org: string) {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { pessoa_id?: string } }) =>
      updateEmpresa(org, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas', org] })
      toast.success('Empresa atualizada com sucesso.')
    },
  })
}

export function useDeleteEmpresa(org: string) {
  return useMutation({
    mutationFn: (id: string) => deleteEmpresa(org, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas', org] })
      toast.success('Empresa removida com sucesso.')
    },
  })
}
