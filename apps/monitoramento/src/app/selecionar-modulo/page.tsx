'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { BriefcaseMedical, Leaf, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

const modules = [
    {
        permission: 'modulo:monitoramento',
        title: 'Condicionantes Ambientais',
        description: 'Acompanhe e gerencie obrigações ambientais com facilidade.',
        icon: <Leaf className="w-10 h-10 text-green-600 mb-4" />,
        href: '/dashboard',
    },
    {
        permission: 'modulo:medicina',
        title: 'Medicina do Trabalho',
        description: 'Gerencie ASOs, PCMSO, exames e integração com eSocial.',
        icon: <BriefcaseMedical className="w-10 h-10 text-blue-600 mb-4" />,
        href: '/medicina-seguranca',
    },
    {
        permission: "modulo:manejo",
        title: "Manejo Florestal Sustentável",
        description: "Gerencie atividades e planos de manejo florestal sustentável.",
        href: "/manejo-florestal",
        icon: <Leaf className="w-10 h-10 text-green-600 mb-4" />,
  },
]

export default function SelecionarModuloPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') return <p className="text-center p-4">Carregando...</p>

  if (!session) {
    router.push('/api/auth/signin')
    return null
  }

  const userPermissions = session?.user?.permissions ?? []

  const filteredModules = modules.filter((mod) =>
    userPermissions.some((permission: { id: string, name: string }) => permission.name.includes(mod.permission))
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted px-4">
      <div className="max-w-3xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Selecione o módulo</h1>
          <p className="text-muted-foreground">Escolha qual módulo deseja acessar.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredModules.map((modulo) => (
            <Card
              key={modulo.permission}
              onClick={() => router.push(modulo.href)}
              className="hover:shadow-lg cursor-pointer transition-all"
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                {modulo.icon}
                <h2 className="text-lg font-semibold">{modulo.title}</h2>
                <p className="text-sm text-muted-foreground">{modulo.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredModules.length === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Você não possui acesso a nenhum módulo no momento.
          </p>
        )}

        <Separator />

        <div className="text-center">
          <Button variant="ghost" 
            onClick={() => {
                void signOut({ callbackUrl: '/' });
            }}
            className="text-red-500">
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>
        </div>
      </div>
    </div>
  )
}
