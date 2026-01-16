'use client';

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react";

export const PessoaTitle = ({ nomePessoa }: { nomePessoa?: string }) => {
    const { data: session } = useSession();
    const [pessoa, setPessoa] = useState<string>(`Seja bem vindo, ${session && session?.user.username} 👋`)
    useEffect(() => {
        if (nomePessoa) {
            setPessoa(nomePessoa);
        } else {
            setPessoa('')
        }
    }, [nomePessoa, session]);
    return (
        <>
        { pessoa && (
            <h2 className='text-2xl font-bold tracking-tight'>{pessoa}</h2>
        ) }
            
        </>    
    )
}