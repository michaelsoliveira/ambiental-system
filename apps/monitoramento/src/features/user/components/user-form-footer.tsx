'use client'

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export const UserFormFooter = () => {
    const router = useRouter()
    return (
        <div className='flex flex-row w-full items-center justify-between col-span-2'>
            <Button 
                onClick={(e) => {e.preventDefault(); router.back();}}
                className="mt-4 w-48"
                variant='outline'
            >Voltar</Button>
            <Button 
                form='form-user'
                type='submit'
                className="mt-4 w-48"
            >Salvar</Button>
        </div>
    )
}