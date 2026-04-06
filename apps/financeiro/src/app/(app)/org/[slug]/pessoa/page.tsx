import { ability } from "@/auth/auth";
import { Unauthorized } from "@/components/unauthorized";
import { PessoaIndexPage } from "@/features/pessoa/components/pessoa-index-page";

export default async function PessoaPage() {
  const permissions = await ability();

  if (!permissions?.can('get', 'Pessoa')) {
    return <Unauthorized />;
  }

  return <PessoaIndexPage />;
}