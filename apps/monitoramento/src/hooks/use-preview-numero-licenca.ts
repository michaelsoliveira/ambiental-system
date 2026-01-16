// hooks/usePreviewNumeroLicenca.ts
import { useAuthContext } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";

export function usePreviewNumeroLicenca(tipoLicencaId?: string) {
  const { client } = useAuthContext()  
  return useQuery({
    queryKey: ["preview-numero-licenca", tipoLicencaId],
    queryFn: async () => {
      const response = await client.get("/licenca/preview-numero", {
        params: { tipo_licenca_id: tipoLicencaId },
      });
      return response.data;
    },
    enabled: !!tipoLicencaId
  });
}
