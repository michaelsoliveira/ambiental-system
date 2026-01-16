import { fetchAPI } from "@/lib/utils";
import { PessoaType } from "types";

export async function getPessoaById(id: string) {
    const data = await fetchAPI(`/pessoa/find-one/${id}`, {}, ['pessoa-selecionada'])
    const pessoa: PessoaType = data;

    return pessoa ?? null
}