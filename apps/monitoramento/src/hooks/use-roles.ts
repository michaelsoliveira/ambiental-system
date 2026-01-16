import { useQuery } from "@tanstack/react-query"
import useClient from "./use-client"

export function useRoles() {
    const client = useClient()
    return useQuery({
      queryKey: ['roles'],
      queryFn: async () => {
        const res = await client.get('/role/list-all')
        return res.data as { id: string, name: string }[]
      }
    })
  }