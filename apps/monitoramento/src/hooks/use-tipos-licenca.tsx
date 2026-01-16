// hooks/useTiposLicenca.ts
import { useAuthContext } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";

export const useTiposLicenca = (params: any) => {
    const { client } = useAuthContext()
  return useQuery({
    queryKey: ["tipos-licenca", params],
    queryFn: async () => {
      const response = await client.get("/tipo-licenca/list-all", {
        params
      });
      return response.data;
    },
  });
};
