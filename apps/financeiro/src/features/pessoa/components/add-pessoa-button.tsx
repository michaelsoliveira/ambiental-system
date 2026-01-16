// components/add-pessoa-button.tsx
"use client";

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

type Props = {
  className?: string;
}

export default function AddPessoaButton({ className }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClick = () => {
    const params = new URLSearchParams(searchParams);
    params.set('pessoa-modal', 'true');
    // Remove pessoaId se existir (para modo de criação)
    params.delete('pessoaId');
    router.push(`?${params.toString()}`);
  };

  return (
    <Button
      onClick={handleClick}
      className={cn('text-xs md:text-sm', className)}
    >
      <Plus className='mr-2 h-4 w-4' /> Adicionar
    </Button>
  );
}