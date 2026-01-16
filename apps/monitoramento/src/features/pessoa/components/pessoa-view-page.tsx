import { notFound } from 'next/navigation';
import PessoaForm from './form/pessoa-form';
import { PessoaType } from 'types';
import { fetchAPI } from '@/lib/utils';

type TPessoaViewPageProps = {
  pessoaId: string;
};

export default async function PessoaViewPage({
  pessoaId
}: TPessoaViewPageProps) {
  let pessoa = null;
  let pageTitle = 'Cadastrar Pessoa';
  
  if (pessoaId !== 'new') {
    const response = await fetchAPI(`/pessoa/find-one/${pessoaId}`)
    pessoa = response.data as PessoaType;
    
    if (!pessoa) {
      notFound();
    }
    pageTitle = `Editar Pessoa`;
  }

  return <PessoaForm initialData={pessoa} pageTitle={pageTitle} />;
}
