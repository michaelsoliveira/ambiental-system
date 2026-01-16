import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { CondicionanteType, LicencaType, UserType } from 'types';
import { fetchAPI } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { UserFormFooter } from './tipo-licenca-form-footer';
import { TipoLicencaForm } from './tipo-licenca-form';

type CondicionanteViewPageProps = {
  tipoLicencaId: string;
};

export default async function TipoLicencaViewPage({
  tipoLicencaId
}: CondicionanteViewPageProps) {
  
  let tipoLicenca;
  let pageTitle = 'Cadastrar Tipo da Licença';
  const session = await auth();

  if (session && tipoLicencaId !== 'new') {
    const data = await fetchAPI(`/tipo-licenca/find-one/${tipoLicencaId}`)
    tipoLicenca = data;
    
    if (!tipoLicenca) {
      notFound();
    }
    pageTitle = `Editar Tipo Licença`;
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
          <TipoLicencaForm defaultValues={tipoLicenca} />
          <UserFormFooter />
        </CardContent>
      </Card>
    </>);
}