import { Heading } from '@/components/ui/heading'
import { Separator } from '@/components/ui/separator'
import { PatrimonioPage } from '@/features/patrimonio/patrimonio-page'

export default function Page() {
  return (
    <div className="space-y-6 p-6">
      <Heading
        title="Patrimônio"
        description="Acompanhe ativos, passivos e a posição patrimonial da empresa"
      />
      <Separator />
      <PatrimonioPage />
    </div>
  )
}
