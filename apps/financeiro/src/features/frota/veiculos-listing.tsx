'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useVeiculos } from '@/hooks/use-frota'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, ChevronRight } from 'lucide-react'
export function VeiculosListing() {
  const { slug } = useParams<{ slug: string }>()
  const [search, setSearch] = useState('')
  const { data, isLoading, error } = useVeiculos(slug!, {
    search: search || undefined,
    limit: 50,
    page: 1,
  })

  const veiculos = data?.veiculos ?? []

  const rows = useMemo(() => veiculos, [veiculos])

  if (isLoading) return <p className="text-muted-foreground">Carregando veículos…</p>
  if (error)
    return (
      <p className="text-destructive">
        Não foi possível carregar a frota. Verifique permissões e API.
      </p>
    )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por placa, modelo ou marca…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Placa</TableHead>
            <TableHead>Veículo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Km</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Nenhum veículo cadastrado.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono font-semibold">{v.placa}</TableCell>
                <TableCell>
                  {v.marca} {v.modelo}
                  {v.ano ? ` · ${v.ano}` : ''}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {v.tipo ?? '—'}
                </TableCell>
                <TableCell className="text-right">
                  {v.km_atual != null ? v.km_atual.toLocaleString('pt-BR') : '—'}
                </TableCell>
                <TableCell>
                  {v.ativo ? (
                    <Badge variant="secondary">Ativo</Badge>
                  ) : (
                    <Badge variant="outline">Inativo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/org/${slug}/frota/veiculos/${v.id}`}>
                      Abrir
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
