import { ArrowRight,Building2, Plus } from 'lucide-react'
import Link from 'next/link'

import { Header } from '@/components/header'
import { OrganizationSwitcher } from '@/components/organization-switcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default async function HomePage({ 
  searchParams 
}: { 
  searchParams: { fromLogin?: string } 
}) {
  const params = await searchParams
  const fromLogin = params?.fromLogin === 'true';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      {/* <div className="space-y-4 py-4">
        <Header />
      </div> */}
      
      <main className="mx-auto w-full max-w-[1200px] px-4">
        <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
          <div className="w-full max-w-2xl text-center">
            {/* Ícone Principal */}
            <div className="mb-8 flex justify-center">
              <div className="rounded-2xl bg-primary/10 p-6 ring-1 ring-primary/20">
                <Building2 className="h-16 w-16 text-primary" />
              </div>
            </div>

            {/* Título e Descrição */}
            <h1 className="mb-4 text-4xl font-bold tracking-tight">
              {fromLogin ? 'Seja bem-vindo!' : 'Seja bem-vindo de volta!'}
            </h1>
            <p className="mb-12 text-lg text-muted-foreground">
              Selecione uma organização para continuar ou crie uma nova para começar
            </p>

            {/* Card de Seleção */}
            <Card className="border-2 shadow-lg">
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Seletor de Organização */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      Suas Organizações
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <OrganizationSwitcher />
                      </div>
                      <Link 
                        href="/create-organization"
                        // size="icon"
                        // variant="outline"
                        className="block items-center justify-center shrink-0 border rounded-lg p-2"
                        title="Criar nova organização"
                      >
                        <Plus className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        ou
                      </span>
                    </div>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button 
                      variant="outline" 
                      className="h-auto flex-col gap-2 py-4"
                    >
                      <Building2 className="h-5 w-5" />
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          Nova Organização
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Crie do zero
                        </div>
                      </div>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-auto flex-col gap-2 py-4"
                    >
                      <ArrowRight className="h-5 w-5" />
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          Aceitar Convite
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Junte-se a um time
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Texto de Ajuda */}
            <p className="mt-6 text-sm text-muted-foreground">
              Precisa de ajuda? Entre em contato com o{' '}
              <a href="#" className="font-medium text-primary hover:underline">
                suporte
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}