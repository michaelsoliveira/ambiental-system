'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useClient from './use-client'

export interface UserPayload {
  email: string;
  username?: string;
  password?: string;
}

export function useUsers(params: any) {
  const client = useClient()
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const res = await client.get('/users/list-all', { params })
      return res.data
    }
  })
}

export function useCreateUser() {
  const client = useClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UserPayload) => {
      const res = await client.get(`/users/create`, { data })
      
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })
}

export function useUpdateUser() {
  const client = useClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: UserPayload & { id: string }) => {
      const res = await client.put(
        `/users/update/${id}`, { data }
      )

      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })
}

export function useDeleteCondicionante() {
  const client = useClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.delete(`/users/${id}`)
      if (res.data?.error) {
        throw new Error(res.data.message || 'Erro ao excluir usuário')
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })
}
