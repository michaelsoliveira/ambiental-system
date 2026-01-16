'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { HardHat, Home } from 'lucide-react'

export default function EmConstrucao() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-muted">
      <div className="max-w-md">
        <Alert className="bg-yellow-100 border-yellow-300 text-yellow-900 mb-6">
          <HardHat className="h-6 w-6" />
          <AlertTitle>Página em construção</AlertTitle>
          <AlertDescription>
            Estamos trabalhando para trazer essa funcionalidade em breve.
          </AlertDescription>
        </Alert>

        <Image
          src="/images/em-construcao.svg"
          alt="Página em construção"
          width={400}
          height={300}
          className="mx-auto mb-6"
        />

        <Button variant="outline" size="lg" onClick={() => window.location.href = '/'}>
          <Home className="mr-2 h-5 w-5" />
          Voltar para a Home
        </Button>
      </div>
    </div>
  )
}
