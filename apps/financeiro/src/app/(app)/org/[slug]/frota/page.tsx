import { List,Truck } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heading } from '@/components/ui/heading'
import { Separator } from '@/components/ui/separator'

export default async function FrotaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <div className="space-y-6 p-6">
      <Heading
        title="Frota"
        description="Cadastre veículos e registre abastecimentos, manutenções e viagens. Cada operação financeira vira lançamento — o dinheiro continua centralizado em Financeiro."
      />
      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5" />
              Veículos
            </CardTitle>
            <CardDescription>
              Placas, quilometragem e histórico por veículo (abastecimento,
              manutenção, viagens).
            </CardDescription>
            <Button className="mt-4 w-fit" asChild>
              <Link href={`/org/${slug}/frota/veiculos`}>
                <List className="mr-2 h-4 w-4" />
                Abrir lista de veículos
              </Link>
            </Button>
          </CardHeader>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Lançamentos</CardTitle>
            <CardDescription>
              Consulte despesas e receitas geradas pela frota em Lançamentos
              (filtro por veículo disponível na API).
            </CardDescription>
            <Button variant="outline" className="mt-4 w-fit" asChild>
              <Link href={`/org/${slug}/lancamento`}>Ir para lançamentos</Link>
            </Button>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
