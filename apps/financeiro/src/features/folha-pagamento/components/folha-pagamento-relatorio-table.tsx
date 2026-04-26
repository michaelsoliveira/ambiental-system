'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/export-utils'

const tipoFolhaLabels: Record<string, string> = {
  FOLHA_MENSAL: 'Folha de pagamento',
  FERIAS: 'Férias',
  DECIMO_TERCEIRO: '13º Salário',
  RESCISAO: 'Rescisão',
}

const naturezaLabels: Record<string, string> = {
  PROVENTO: 'Provento',
  DESCONTO: 'Desconto',
  ENCARGO: 'Encargo',
}

function funcionarioLabel(funcionario: any) {
  return (
    funcionario?.pessoa?.fisica?.nome ??
    funcionario?.pessoa?.juridica?.nome_fantasia ??
    funcionario?.matricula ??
    '---'
  )
}

export function FolhaPagamentoRelatorioTable({ data }: { data: any }) {
  if (!data) return null

  if (!data.folhas.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nenhum resultado encontrado</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Proventos</p>
            <p className="text-lg font-semibold">{formatCurrency(data.totals.total_proventos)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Descontos</p>
            <p className="text-lg font-semibold">{formatCurrency(data.totals.total_descontos)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Encargos</p>
            <p className="text-lg font-semibold">{formatCurrency(data.totals.total_encargos)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Líquido</p>
            <p className="text-lg font-semibold">{formatCurrency(data.totals.total_liquido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Itens</p>
            <p className="text-lg font-semibold">{data.totals.total_itens}</p>
          </CardContent>
        </Card>
      </div>

      {data.folhas.map((folha: any) => (
        <Card key={folha.id}>
          <CardHeader>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-base">
                  {folha.competencia} · {tipoFolhaLabels[folha.tipo] ?? folha.tipo}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Proventos {formatCurrency(folha.totais_filtrados.total_proventos)} · Descontos{' '}
                  {formatCurrency(folha.totais_filtrados.total_descontos)} · Encargos{' '}
                  {formatCurrency(folha.totais_filtrados.total_encargos)} · Líquido{' '}
                  {formatCurrency(folha.totais_filtrados.total_liquido)}
                </p>
              </div>
              <Badge variant="outline">{folha.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Rubrica</TableHead>
                    <TableHead>Natureza</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {folha.itens.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{funcionarioLabel(item.funcionario)}</TableCell>
                      <TableCell>{item.rubrica?.nome ?? item.tipo}</TableCell>
                      <TableCell>{naturezaLabels[item.natureza] ?? item.natureza}</TableCell>
                      <TableCell>{item.descricao}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.valor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
