import { ability } from "@/auth/auth";
import { PessoaIndexPage } from "@/features/pessoa/components/pessoa-index-page";
import { Unauthorized } from "@/components/unauthorized";

export default async function PessoaPage() {
  const permissions = await ability();

  if (!permissions?.can('get', 'Pessoa')) {
    return <Unauthorized />;
  }

  return <PessoaIndexPage />;
}