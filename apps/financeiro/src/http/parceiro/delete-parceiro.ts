import { api } from "../api-client";

export async function deleteParceiro(org: string, parceiroId: string) {
    await api.delete(`organizations/${org}/financeiro/parceiros/${parceiroId}`)
}