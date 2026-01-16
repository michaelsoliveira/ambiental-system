'use client'

import { Heading } from "@/components/ui/heading"
import { useAuthContext } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { ExportButtonCsvLicenca } from "./export-button-csv-licenca";
import ExportLicencaPdfButton from "./pdf/export-licenca-pdf-button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const LicencaHeaderPage = () => {
    const [data, setData] = useState([]);
    const { client } = useAuthContext()
    
    useEffect(() => {
        const loadLicencas = async () => {
            const response = await client.get('/licenca/list-all')
            const { data, error } = response.data
            
            setData(data)
        }

        loadLicencas()
    }, [client])

    return (
        <div className='flex items-start justify-between'>
          <Heading
            title='Licenças'
            description='Gerenciar as Licenças do Sistema'
          />
          <div className='flex flex-row items-center space-x-2'>
            { data && (<ExportButtonCsvLicenca data={data} />) }
            <ExportLicencaPdfButton />
            <Link
              href='/dashboard/licenca/new'
              className={cn(buttonVariants(), 'text-xs md:text-sm')}
            >
              <Plus className='mr-2 h-4 w-4' /> Adicionar
            </Link>
          </div>
        </div>
    )
}