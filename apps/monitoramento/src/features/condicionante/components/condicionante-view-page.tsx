import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { CondicionanteType, LicencaType } from 'types';
import { fetchAPI } from '@/lib/utils';
import { CondicionanteForm } from './condicionante-form';
import { CondicionanteFormValues } from '../utils/form-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { CondicionanteFormFooter } from './condicionante-form-footer';

type CondicionanteViewPageProps = {
  condicionanteId: string;
};

export default async function CondicionanteViewPage({
  condicionanteId
}: CondicionanteViewPageProps) {
  
  let condicionante;
  let pageTitle = 'Cadastrar Condicionante';
  const session = await auth();

  if (session && condicionanteId !== 'new') {
    const data = await fetchAPI(`/condicionante/find-one/${condicionanteId}`)
    condicionante = data as CondicionanteType;
    
    if (!condicionante) {
      notFound();
    }
    pageTitle = `Editar Condicionante`;
  }

  return (
    <>
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
              {pageTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Separator />
          <CondicionanteForm defaultValues={condicionante} />
          <CondicionanteFormFooter />
        </CardContent>
      </Card>
    </>);
}