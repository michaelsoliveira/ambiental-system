import PageContainer from '@/components/layout/page-container';
import DashboardTotals from '@/features/overview/components/dashboard-totals';
import { PessoaTitle } from '@/features/overview/components/pessoa-title';
import { auth } from '@/lib/auth';
import { getPessoaById } from '@/services/pessoa';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function OverViewLayout({
  condicionantes,
  pie_stats,
  line_stats,
  area_stats
}: {
  condicionantes: React.ReactNode;
  pie_stats: React.ReactNode;
  line_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
      return redirect('/auth/signin');
  }

  const cookieStore = await cookies();
  const pessoaId = cookieStore.get('pessoaId')?.value;
  const pessoa = pessoaId ? await getPessoaById(pessoaId) : null;
  
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
            <PessoaTitle nomePessoa={pessoa?.juridica ? pessoa?.juridica?.nomeFantasia : pessoa?.fisica?.nome} />
        </div>
        <DashboardTotals />
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>
            {line_stats}
          </div>
          <div className='col-span-4 md:col-span-3'>
            {/* sales arallel routes */}
            {condicionantes}
          </div>
          <div className='col-span-4'>
            {/* {area_stats} */}
          </div>
          <div className='col-span-4 md:col-span-3'>
            {/* {pie_stats} */}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
