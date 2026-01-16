'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export default function AccessDenied() {
  const router = useRouter();

  return (
    <div className='absolute top-1/2 left-1/2 mb-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center'>
      <span className='from-foreground bg-linear-to-b to-transparent bg-clip-text text-[10rem] leading-none font-extrabold text-transparent'>
        403
      </span>
      <h2 className='font-heading my-2 text-2xl font-bold'>
        Acesso Negado
      </h2>
      <p>
        Você não tem permissão para acessar este módulo
      </p>
      <div className='mt-8 flex justify-center gap-2'>
        <Button onClick={() => router.back()} variant='default' size='lg'>
          Voltar
        </Button>
      </div>
    </div>
  );
}
