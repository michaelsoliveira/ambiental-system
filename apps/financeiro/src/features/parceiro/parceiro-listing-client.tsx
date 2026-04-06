'use client'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Building2, LayoutGrid, List } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ParceiroListRecord } from '@/http/parceiro/get-parceiros'
import { formatCnpj, formatCpf } from '@/lib/utils'

import {
  ParceiroDeleteAlert,
  ParceiroEditDialog,
  ParceiroRowActions,
} from './parceiro-listing-dialogs'

dayjs.extend(relativeTime)

function getParceiroNome(p: ParceiroListRecord) {
  return (
    p.pessoa.fisica?.nome ||
    p.pessoa.juridica?.nome_fantasia ||
    'Nome não informado'
  )
}

function getParceiroDocumento(p: ParceiroListRecord) {
  const raw = p.pessoa.fisica?.cpf || p.pessoa.juridica?.cnpj || null
  if (!raw) return '—'
  return p.pessoa.tipo === 'F' ? formatCpf(raw) : formatCnpj(raw)
}

type ViewMode = 'grid' | 'list'

export function ParceiroListingClient({
  parceiros,
  canUpdate,
  canDelete,
}: {
  parceiros: ParceiroListRecord[]
  canUpdate: boolean
  canDelete: boolean
}) {
  const { slug: orgSlug } = useParams<{ slug: string }>()
  const [view, setView] = useState<ViewMode>('grid')
  const [editing, setEditing] = useState<ParceiroListRecord | null>(null)
  const [deleting, setDeleting] = useState<ParceiroListRecord | null>(null)

  if (parceiros.length === 0) {
    return (
      <p className="rounded-lg border py-12 text-center text-sm text-muted-foreground">
        Nenhum parceiro cadastrado.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <ParceiroEditDialog
        parceiro={editing}
        onClose={() => setEditing(null)}
        orgSlug={orgSlug!}
      />
      <ParceiroDeleteAlert
        parceiro={deleting}
        onClose={() => setDeleting(null)}
        orgSlug={orgSlug!}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto text-sm text-muted-foreground">Visualização</span>
        <div className="inline-flex rounded-lg border bg-muted/30 p-1">
          <Button
            type="button"
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-2"
            onClick={() => setView('grid')}
            aria-pressed={view === 'grid'}
          >
            <LayoutGrid className="size-4" />
            Grade
          </Button>
          <Button
            type="button"
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-2"
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
          >
            <List className="size-4" />
            Lista
          </Button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {parceiros.map((parceiro) => {
            const pessoaNome = getParceiroNome(parceiro)

            return (
              <Card key={parceiro.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="w-[250px] max-w-full truncate text-xl font-medium">
                      {pessoaNome}
                    </CardTitle>
                    <Badge variant={parceiro.ativo ? 'default' : 'secondary'}>
                      {parceiro.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <CardDescription className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 shrink-0" />
                      <span className="font-medium">{parceiro.tipo_parceiro}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getParceiroDocumento(parceiro)}
                    </div>
                    {parceiro.observacoes && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed">
                        {parceiro.observacoes}
                      </p>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardFooter className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    Criado {dayjs(parceiro.created_at).fromNow()}
                  </span>
                  <ParceiroRowActions
                    parceiro={parceiro}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                  />
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead className="max-w-[200px]">Observações</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parceiros.map((parceiro) => (
              <TableRow key={parceiro.id}>
                <TableCell className="font-medium">{getParceiroNome(parceiro)}</TableCell>
                <TableCell>{parceiro.tipo_parceiro}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {getParceiroDocumento(parceiro)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {parceiro.observacoes ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={parceiro.ativo ? 'default' : 'secondary'}>
                    {parceiro.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {dayjs(parceiro.created_at).format('DD/MM/YYYY')}
                </TableCell>
                <TableCell className="text-right">
                  <ParceiroRowActions
                    parceiro={parceiro}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
