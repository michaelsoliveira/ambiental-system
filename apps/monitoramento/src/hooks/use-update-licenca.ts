'use client'
import { useAuthContext } from "@/context/AuthContext"
import { LicencaFormValues } from "@/features/licenca/utils/form-schema"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export const useUpdateLicenca = () => {
  const queryClient = useQueryClient()
  const { client } = useAuthContext()

  return useMutation({
    mutationFn: async (data: LicencaFormValues) => {
      console.log(data)
      const response = await client.put(`/licenca/update/${data.id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresas-licencas"] })
    },
  })
}
