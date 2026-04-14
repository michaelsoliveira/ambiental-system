'use client'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { DoubleArrowLeftIcon, DoubleArrowRightIcon } from '@radix-ui/react-icons'
import { Building2, ChevronLeftIcon, ChevronRightIcon, LayoutGrid, List } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  parceiros: ParceiroListRecord[]
  canUpdate: boolean
  canDelete: boolean
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}) {
  const { slug: orgSlug } = useParams<{ slug: string }>()
  const [view, setView] = useState<ViewMode>('grid')
  const [editing, setEditing] = useState<ParceiroListRecord | null>(null)
  const [deleting, setDeleting] = useState<ParceiroListRecord | null>(null)
  const safePage = Math.max(1, Math.min(page, totalPages || 1))
  const start = (safePage - 1) * pageSize
  const end = start + parceiros.length

  if (totalItems === 0) {
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

      <div className="flex flex-col items-center justify-end gap-2 space-x-2 py-2 sm:flex-row">
        <div className="flex w-full items-center justify-between">
          <div className="flex-1 text-sm text-muted-foreground">
            Mostrando de {totalItems > 0 ? start + 1 : 0} a {Math.min(end, totalItems)} de {totalItems}
          </div>
          <div className="flex items-center space-x-2">
            <p className="whitespace-nowrap text-sm font-medium">por Página</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                onPageSizeChange(Number(value))
                onPageChange(1)
              }}
            >
              <SelectTrigger className="h-8 w-[90px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[50, 100, 200, 500, 1000].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:justify-end">
          <div className="flex items-center justify-center text-sm font-medium">
            Página {safePage} de {totalPages || 1}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              aria-label="Go to first page"
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => onPageChange(1)}
              disabled={safePage <= 1}
            >
              <DoubleArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to previous page"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
            >
              <ChevronLeftIcon className='h-4 w-4' aria-hidden='true' />
            </Button>
            <Button
              aria-label="Go to next page"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(Math.min(totalPages || 1, safePage + 1))}
              disabled={safePage >= (totalPages || 1)}
            >
              <ChevronRightIcon className='h-4 w-4' aria-hidden='true' />
            </Button>
            <Button
              aria-label="Go to last page"
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => onPageChange(totalPages || 1)}
              disabled={safePage >= (totalPages || 1)}
            >
              <DoubleArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
