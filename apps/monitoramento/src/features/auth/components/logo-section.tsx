'use client';

import Image from 'next/image';

export default function LogoSection() {
  return (
    <div className='relative flex h-full w-full items-center justify-center'>
      <div className="text-center">
        <div className='flex flex-1 items-center justify-center w-full'>
          <Image src="/images/only-logo-2.svg" alt="Logo" width={100} height={100} />
        </div>
        <h1 className="text-4xl font-bold"><span className='text-[#44ABB6]'>Ambiental</span><span className='text-[#FFD059]'>System</span></h1>
        <p className="text-2xl mt-16 text-white">Conectando Sustentabilidade e Segurança</p>
        <p className="mt-16 italic text-sm text-white/50">
          “Sistema de Monitoramento para Condicionantes Ambientais”
        </p>
        
      </div>
      <div className='absolute bottom-10 left-5'>
        <p className="text-xs text-white/50">copyright - Michael Oliveira</p>
      </div>
    </div>
  );
}
