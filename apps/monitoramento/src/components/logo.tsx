// src/components/Logo.tsx
'use client';

import Image from 'next/image';

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/images/logo_2.png" // só o ícone, sem textos
        alt="Logo Icon"
        width={200}
        height={200}
        className='object-cover'
        priority
      />
      {/* <div className="leading-[1rem] text-green-700 text-sm">
        <div className="font-bold">Ambiental</div>
        <div className="text-[0.7rem]">Consultoria & Serviços</div>
      </div> */}
    </div>
  );
};

export default Logo;
