import { notFound } from 'next/navigation';

import { api } from '@/http/api-client';

import { PessoaForm } from './pessoa-form';

type TPessoaViewPageProps = {
  slug: string;
  pessoaId: string;
};

export default async function DiretorViewPage({
  slug,
  pessoaId,
}: TPessoaViewPageProps) {
  let pessoa: unknown = undefined;

  if (pessoaId !== 'new') {
    try {
      const res = await api.get(
        `organizations/${slug}/pessoas/${pessoaId}`,
      );
      pessoa = await res.json();
    } catch {
      notFound();
    }

    if (!pessoa) {
      notFound();
    }
  }

  return <PessoaForm slug={slug} initialData={pessoa} />;
}
