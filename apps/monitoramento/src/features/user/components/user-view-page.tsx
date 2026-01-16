import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { CondicionanteType, LicencaType, UserType } from 'types';
import { fetchAPI } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { UserFormFooter } from './user-form-footer';
import { UserForm } from './user-form';

type CondicionanteViewPageProps = {
  userId: string;
};

export default async function UserViewPage({
  userId
}: CondicionanteViewPageProps) {
  
  let user;
  let pageTitle = 'Cadastrar user';
  const session = await auth();

  if (session && userId !== 'new') {
    const data = await fetchAPI(`/user/find-one/${userId}`)
    user = data;
    
    if (!user) {
      notFound();
    }
    pageTitle = `Editar user`;
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
          <UserForm defaultValues={user} />
          <UserFormFooter />
        </CardContent>
      </Card>
    </>);
}