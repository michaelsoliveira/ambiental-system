import { notFound } from 'next/navigation';

import { fetchAPI } from '@/lib/utils';

import { PessoaForm } from './pessoa-form';

type TPessoaViewPageProps = {
  pessoaId: string;
};

export default async function DiretorViewPage({
  pessoaId
}: TPessoaViewPageProps) {
  let pessoa = undefined;
  let pageTitle = 'Cadastrar Pessoa';

  if (pessoaId !== 'new') {
    const data = await fetchAPI(`/pessoa/${pessoaId}`)
    pessoa = data;
    
    if (!pessoa) {
      notFound();
    }
    pageTitle = `Editar Pessoa`;
  }

  return <PessoaForm initialData={pessoa} />;
}
