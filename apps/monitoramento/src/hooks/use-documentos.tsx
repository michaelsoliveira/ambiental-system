import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import useClient from "./use-client"

export function useListDocumentosLicenca(licencaCondicionanteId: string) {
    const client = useClient()
    return useQuery({
      queryKey: ['documentos-licenca', licencaCondicionanteId],
      queryFn: async () => {
        const res = await client.get(`/documento/list-all/${licencaCondicionanteId}`)
        
        return res.data
      }
    })
}

export function useDeleteDocumentoLicencaCondicionante() {
  const client = useClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await client.delete(`/documento/${id}`)
      if (res.data?.error) {
        throw new Error(res.data.message || 'Erro ao deletar o documento da licença condicionante')
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-licenca'] })
    }
  })
}