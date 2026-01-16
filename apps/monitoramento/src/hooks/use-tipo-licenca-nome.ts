// hooks/use-tipo-licenca-nome.ts
import { useAuthContext } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";

export function useTipoLicencaNome(tipoLicencaId: string | undefined) {
    const { client } = useAuthContext()
  return useQuery({
    queryKey: ["tipo-licenca-nome", tipoLicencaId],
    queryFn: async () => {
      if (!tipoLicencaId) return null;
      const { data } = await client.get(`/tipo-licenca/find-one/${tipoLicencaId}`);
      return data.nome;
    },
    enabled: !!tipoLicencaId,
    staleTime: 1000 * 60 * 5,
  });
}
