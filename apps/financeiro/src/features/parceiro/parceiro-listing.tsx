import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Building2 } from 'lucide-react'
import { formatCnpj, formatCpf } from '@/lib/utils'
import { getCurrentOrg } from '@/auth/auth'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getParceiros } from '@/http/parceiro/get-parceiros'
import { ParceiroButton } from './parceiro-button'

dayjs.extend(relativeTime)

export async function ParceiroListing() {
  const currentOrg = await getCurrentOrg()
  const { parceiros } = await getParceiros(currentOrg!)

  return (
    <div className="grid grid-cols-3 gap-4">
      {parceiros.map((parceiro) => {
        const pessoaNome = parceiro.pessoa.fisica?.nome || 
                          parceiro.pessoa.juridica?.nome_fantasia || 
                          'Nome não informado'
        
        const pessoaDocumento = parceiro.pessoa.fisica?.cpf || 
                               parceiro.pessoa.juridica?.cnpj || 
                               '-'

        return (
          <Card key={parceiro.id} className="flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-medium w-[250px] truncate">
                  {pessoaNome}
                </CardTitle>
                <Badge variant={parceiro.ativo ? 'default' : 'secondary'}>
                  {parceiro.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              
              <CardDescription className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4" />
                  <span className="font-medium">{parceiro.tipo_parceiro}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {pessoaDocumento && parceiro.pessoa.tipo === 'F' ? formatCpf(pessoaDocumento) : formatCnpj(pessoaDocumento) }
                </div>
                {parceiro.observacoes && (
                  <p className="line-clamp-2 text-xs leading-relaxed mt-2">
                    {parceiro.observacoes}
                  </p>
                )}
              </CardDescription>
            </CardHeader>

            <CardFooter className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Criado {dayjs(parceiro.created_at).fromNow()}
              </span>
              <ParceiroButton parceiroId={parceiro.id} />
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}