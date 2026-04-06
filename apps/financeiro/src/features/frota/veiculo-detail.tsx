'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  useVeiculo,
  usePostAbastecimento,
  usePostManutencao,
  usePostViagem,
  usePutAbastecimento,
  useDeleteAbastecimento,
  usePutManutencao,
  useDeleteManutencao,
  usePutViagem,
  useDeleteViagem,
  useDeleteVeiculo,
  useUpdateVeiculo,
} from '@/hooks/use-frota'
import { useCategorias } from '@/hooks/use-categoria'
import { useContas } from '@/hooks/use-conta'
import { useCentrosCusto } from '@/hooks/use-centro-custo'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Fuel, Wrench, Route, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency, formatDateShort } from '@/lib/format'
import { Textarea } from '@/components/ui/textarea'

function money(v: unknown) {
  if (v == null) return '—'
  const n = typeof v === 'string' ? parseFloat(v) : Number(v)
  if (Number.isNaN(n)) return '—'
  return formatCurrency(n)
}

/** Lançamento é a fonte de verdade financeira; o registro operacional pode ficar com snapshot antigo. */
function valorFinanceiroFrota(op: {
  valor: unknown
  lancamento?: { valor: unknown } | null
}) {
  return op.lancamento?.valor ?? op.valor
}

function isoToDatetimeLocal(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type Tab = 'abastecimentos' | 'manutencoes' | 'viagens' | 'dados'

export function VeiculoDetail() {
  const { slug, id } = useParams<{ slug: string; id: string }>()
  const router = useRouter()
  const { data: v, isLoading, error } = useVeiculo(slug!, id!)
  const [tab, setTab] = useState<Tab>('abastecimentos')

  // API: limit máx. 100 em categorias / contas / centros-custo
  const { data: catDesp } = useCategorias(slug!, {
    tipo: 'DESPESA',
    limit: 100,
  })
  const { data: catRec } = useCategorias(slug!, {
    tipo: 'RECEITA',
    limit: 100,
  })
  const { data: contasData } = useContas(slug!, { limit: 100, ativo: true })
  const { data: ccData } = useCentrosCusto(slug!, { limit: 100, ativo: true })

  const categoriasDesp = catDesp?.categorias ?? []
  const categoriasRec = catRec?.categorias ?? []
  const contas = contasData?.contas ?? []
  const centros = ccData?.centros ?? []

  const del = useDeleteVeiculo(slug!)
  const [confirmDel, setConfirmDel] = useState(false)

  const mutAbs = usePostAbastecimento(slug!, id!)
  const mutMan = usePostManutencao(slug!, id!)
  const mutVia = usePostViagem(slug!, id!)
  const mutPutAbs = usePutAbastecimento(slug!, id!)
  const mutDelAbs = useDeleteAbastecimento(slug!, id!)
  const mutPutMan = usePutManutencao(slug!, id!)
  const mutDelMan = useDeleteManutencao(slug!, id!)
  const mutPutVia = usePutViagem(slug!, id!)
  const mutDelVia = useDeleteViagem(slug!, id!)
  const mutUp = useUpdateVeiculo(slug!, id!)

  const [dlgAbs, setDlgAbs] = useState(false)
  const [dlgMan, setDlgMan] = useState(false)
  const [dlgVia, setDlgVia] = useState(false)
  const [dlgDados, setDlgDados] = useState(false)
  const [absEditId, setAbsEditId] = useState<string | null>(null)
  const [manEditId, setManEditId] = useState<string | null>(null)
  const [viaEditId, setViaEditId] = useState<string | null>(null)
  const [confirmItemDel, setConfirmItemDel] = useState<
    { kind: 'ab' | 'man' | 'via'; id: string } | null
  >(null)

  // form abastecimento
  const [absData, setAbsData] = useState({
    data: new Date().toISOString().slice(0, 16),
    litros: '',
    valor: '',
    km: '',
    categoriaId: '',
    contaBancariaId: '',
    centroCustoId: '',
    pago: false,
  })

  const [manData, setManData] = useState({
    tipo: '',
    descricao: '',
    data: new Date().toISOString().slice(0, 16),
    valor: '',
    categoriaId: '',
    contaBancariaId: '',
    centroCustoId: '',
    pago: false,
  })

  const [viaData, setViaData] = useState({
    origem: '',
    destino: '',
    dataInicio: new Date().toISOString().slice(0, 16),
    dataFim: '',
    kmRodado: '',
    valorReceita: '',
    categoriaId: '',
    contaBancariaId: '',
    centroCustoId: '',
    pago: false,
  })

  const [editData, setEditData] = useState({
    placa: '',
    marca: '',
    modelo: '',
    ano: '',
    tipo: '',
    km_atual: '',
    ativo: true,
  })

  if (isLoading) return <p className="p-6 text-muted-foreground">Carregando…</p>
  if (error || !v)
    return (
      <p className="p-6 text-destructive">
        Veículo não encontrado ou sem permissão.
      </p>
    )

  const openEdit = () => {
    setEditData({
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      ano: v.ano?.toString() ?? '',
      tipo: v.tipo ?? '',
      km_atual: v.km_atual?.toString() ?? '',
      ativo: v.ativo,
    })
    setDlgDados(true)
  }

  const defaultAbsForm = () => ({
    data: new Date().toISOString().slice(0, 16),
    litros: '',
    valor: '',
    km: '',
    categoriaId: '',
    contaBancariaId: '',
    centroCustoId: '',
    pago: false,
  })

  const openNewAbs = () => {
    setAbsEditId(null)
    setAbsData(defaultAbsForm())
    setDlgAbs(true)
  }

  const openEditAbs = (a: (typeof v)['abastecimentos'][number]) => {
    const val = valorFinanceiroFrota(a)
    const n = Number(val)
    setAbsData({
      data: isoToDatetimeLocal(String(a.data)),
      litros: String(a.litros),
      valor: Number.isFinite(n) ? String(n) : '',
      km: a.km != null ? String(a.km) : '',
      categoriaId: a.lancamento?.categoria_id ?? '',
      contaBancariaId: a.lancamento?.conta_bancaria_id ?? '',
      centroCustoId: a.lancamento?.centro_custo_id ?? '',
      pago: a.lancamento?.pago ?? false,
    })
    setAbsEditId(a.id)
    setDlgAbs(true)
  }

  const openNewMan = () => {
    setManEditId(null)
    setManData({
      tipo: '',
      descricao: '',
      data: new Date().toISOString().slice(0, 16),
      valor: '',
      categoriaId: '',
      contaBancariaId: '',
      centroCustoId: '',
      pago: false,
    })
    setDlgMan(true)
  }

  const openEditMan = (m: (typeof v)['manutencoes'][number]) => {
    const val = valorFinanceiroFrota(m)
    const n = Number(val)
    setManData({
      tipo: m.tipo,
      descricao: m.descricao ?? '',
      data: isoToDatetimeLocal(String(m.data)),
      valor: Number.isFinite(n) ? String(n) : '',
      categoriaId: m.lancamento?.categoria_id ?? '',
      contaBancariaId: m.lancamento?.conta_bancaria_id ?? '',
      centroCustoId: m.lancamento?.centro_custo_id ?? '',
      pago: m.lancamento?.pago ?? false,
    })
    setManEditId(m.id)
    setDlgMan(true)
  }

  const openNewVia = () => {
    setViaEditId(null)
    setViaData({
      origem: '',
      destino: '',
      dataInicio: new Date().toISOString().slice(0, 16),
      dataFim: '',
      kmRodado: '',
      valorReceita: '',
      categoriaId: '',
      contaBancariaId: '',
      centroCustoId: '',
      pago: false,
    })
    setDlgVia(true)
  }

  const openEditVia = (x: (typeof v)['viagens'][number]) => {
    const val = valorFinanceiroFrota(x)
    const n = Number(val)
    setViaData({
      origem: x.origem,
      destino: x.destino,
      dataInicio: isoToDatetimeLocal(x.data_inicio),
      dataFim: x.data_fim ? isoToDatetimeLocal(x.data_fim) : '',
      kmRodado: x.km_rodado != null ? String(x.km_rodado) : '',
      valorReceita: Number.isFinite(n) && n > 0 ? String(n) : '',
      categoriaId: x.lancamento?.categoria_id ?? '',
      contaBancariaId: x.lancamento?.conta_bancaria_id ?? '',
      centroCustoId: x.lancamento?.centro_custo_id ?? '',
      pago: x.lancamento?.pago ?? false,
    })
    setViaEditId(x.id)
    setDlgVia(true)
  }

  const submitAbs = () => {
    const payload = {
      data: new Date(absData.data).toISOString(),
      litros: parseFloat(absData.litros),
      valor: parseFloat(absData.valor),
      km: absData.km ? parseFloat(absData.km) : null,
      categoriaId: absData.categoriaId,
      contaBancariaId: absData.contaBancariaId,
      centroCustoId: absData.centroCustoId || null,
      pago: absData.pago,
    }
    if (absEditId) {
      mutPutAbs.mutate(
        { abastecimentoId: absEditId, data: payload },
        {
          onSuccess: () => {
            setDlgAbs(false)
            setAbsEditId(null)
          },
        }
      )
    } else {
      mutAbs.mutate(payload, { onSuccess: () => setDlgAbs(false) })
    }
  }

  const submitMan = () => {
    const payload = {
      tipo: manData.tipo,
      descricao: manData.descricao || null,
      data: new Date(manData.data).toISOString(),
      valor: parseFloat(manData.valor),
      categoriaId: manData.categoriaId,
      contaBancariaId: manData.contaBancariaId,
      centroCustoId: manData.centroCustoId || null,
      pago: manData.pago,
    }
    if (manEditId) {
      mutPutMan.mutate(
        { manutencaoId: manEditId, data: payload },
        {
          onSuccess: () => {
            setDlgMan(false)
            setManEditId(null)
          },
        }
      )
    } else {
      mutMan.mutate(payload, { onSuccess: () => setDlgMan(false) })
    }
  }

  const submitVia = () => {
    const payload = {
      origem: viaData.origem,
      destino: viaData.destino,
      dataInicio: new Date(viaData.dataInicio).toISOString(),
      dataFim: viaData.dataFim ? new Date(viaData.dataFim).toISOString() : null,
      kmRodado: viaData.kmRodado ? parseFloat(viaData.kmRodado) : null,
      valorReceita: viaData.valorReceita
        ? parseFloat(viaData.valorReceita)
        : null,
      categoriaId: viaData.categoriaId || null,
      contaBancariaId: viaData.contaBancariaId || null,
      centroCustoId: viaData.centroCustoId || null,
      pago: viaData.pago,
    }
    if (viaEditId) {
      mutPutVia.mutate(
        { viagemId: viaEditId, data: payload },
        {
          onSuccess: () => {
            setDlgVia(false)
            setViaEditId(null)
          },
        }
      )
    } else {
      mutVia.mutate(payload, { onSuccess: () => setDlgVia(false) })
    }
  }

  const saveDados = () => {
    mutUp.mutate(
      {
        placa: editData.placa,
        marca: editData.marca,
        modelo: editData.modelo,
        ano: editData.ano ? parseInt(editData.ano, 10) : null,
        tipo: editData.tipo || null,
        km_atual: editData.km_atual ? parseFloat(editData.km_atual) : null,
        ativo: editData.ativo,
      },
      { onSuccess: () => setDlgDados(false) }
    )
  }

  const tabBtn = (t: Tab, label: string, icon: React.ReactNode) => (
    <Button
      type="button"
      variant={tab === t ? 'secondary' : 'ghost'}
      className="justify-start gap-2"
      onClick={() => setTab(t)}
    >
      {icon}
      {label}
    </Button>
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link href={`/org/${slug}/frota/veiculos`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Frota
            </Link>
          </Button>
          <Heading
            title={`${v.placa} · ${v.marca} ${v.modelo}`}
            description="Operações geram lançamentos no financeiro automaticamente."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar cadastro
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmDel(true)}
          >
            Excluir
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {v.ativo ? (
          <Badge>Ativo</Badge>
        ) : (
          <Badge variant="outline">Inativo</Badge>
        )}
        {v.tipo && <Badge variant="secondary">{v.tipo}</Badge>}
        {v.km_atual != null && (
          <span className="text-sm text-muted-foreground">
            Km: {v.km_atual.toLocaleString('pt-BR')}
          </span>
        )}
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <div className="flex flex-col gap-1">
          {tabBtn('abastecimentos', 'Abastecimentos', <Fuel className="h-4 w-4" />)}
          {tabBtn('manutencoes', 'Manutenções', <Wrench className="h-4 w-4" />)}
          {tabBtn('viagens', 'Viagens', <Route className="h-4 w-4" />)}
          {tabBtn('dados', 'Resumo', <Pencil className="h-4 w-4" />)}
        </div>

        <div className="min-w-0 space-y-4">
          {tab === 'abastecimentos' && (
            <>
              <div className="flex justify-end">
                <Button onClick={openNewAbs}>Novo abastecimento</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Litros</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Lançamento</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {v.abastecimentos?.length ? (
                    v.abastecimentos.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{formatDateShort(a.data)}</TableCell>
                        <TableCell>{a.litros}</TableCell>
                        <TableCell className="text-right">
                          {money(valorFinanceiroFrota(a))}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {a.lancamento?.numero ?? '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className="flex justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditAbs(a)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() =>
                                setConfirmItemDel({ kind: 'ab', id: a.id })
                              }
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        Nenhum registro.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}

          {tab === 'manutencoes' && (
            <>
              <div className="flex justify-end">
                <Button onClick={openNewMan}>Nova manutenção</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Lançamento</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {v.manutencoes?.length ? (
                    v.manutencoes.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{formatDateShort(m.data)}</TableCell>
                        <TableCell>{m.tipo}</TableCell>
                        <TableCell className="text-right">
                          {money(valorFinanceiroFrota(m))}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {m.lancamento?.numero ?? '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className="flex justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditMan(m)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() =>
                                setConfirmItemDel({ kind: 'man', id: m.id })
                              }
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        Nenhum registro.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}

          {tab === 'viagens' && (
            <>
              <div className="flex justify-end">
                <Button onClick={openNewVia}>Nova viagem</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Lançamento</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {v.viagens?.length ? (
                    v.viagens.map((x) => (
                      <TableRow key={x.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDateShort(x.data_inicio)}
                          {x.data_fim
                            ? ` → ${formatDateShort(x.data_fim)}`
                            : ''}
                        </TableCell>
                        <TableCell>
                          {x.origem} → {x.destino}
                        </TableCell>
                        <TableCell className="text-right">
                          {money(valorFinanceiroFrota(x))}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {x.lancamento?.numero ?? '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className="flex justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditVia(x)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() =>
                                setConfirmItemDel({ kind: 'via', id: x.id })
                              }
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        Nenhum registro.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}

          {tab === 'dados' && (
            <div className="rounded-lg border p-4 text-sm space-y-2">
              <p>
                <span className="text-muted-foreground">Placa:</span>{' '}
                <span className="font-mono font-semibold">{v.placa}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Marca / modelo:</span>{' '}
                {v.marca} {v.modelo}
              </p>
              {v.ano && (
                <p>
                  <span className="text-muted-foreground">Ano:</span> {v.ano}
                </p>
              )}
              <p className="pt-2 text-muted-foreground">
                Os valores financeiros ficam em{' '}
                <Link
                  href={`/org/${slug}/lancamento`}
                  className="text-primary underline"
                >
                  Lançamentos
                </Link>
                . Filtre por veículo quando o filtro estiver disponível na listagem.
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={dlgAbs}
        onOpenChange={(open) => {
          setDlgAbs(open)
          if (!open) setAbsEditId(null)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {absEditId ? 'Editar abastecimento' : 'Abastecimento'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Data e hora</Label>
              <Input
                type="datetime-local"
                value={absData.data}
                onChange={(e) =>
                  setAbsData((s) => ({ ...s, data: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Litros</Label>
                <Input
                  value={absData.litros}
                  onChange={(e) =>
                    setAbsData((s) => ({ ...s, litros: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  value={absData.valor}
                  onChange={(e) =>
                    setAbsData((s) => ({ ...s, valor: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Km (opcional)</Label>
              <Input
                value={absData.km}
                onChange={(e) =>
                  setAbsData((s) => ({ ...s, km: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Categoria (despesa)</Label>
              <Select
                value={absData.categoriaId}
                onValueChange={(categoriaId) =>
                  setAbsData((s) => ({ ...s, categoriaId }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasDesp.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.codigo} — {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conta bancária</Label>
              <Select
                value={absData.contaBancariaId}
                onValueChange={(contaBancariaId) =>
                  setAbsData((s) => ({ ...s, contaBancariaId }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {contas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Centro de custo (opcional)</Label>
              <Select
                value={absData.centroCustoId || '_none'}
                onValueChange={(centroCustoId) =>
                  setAbsData((s) => ({
                    ...s,
                    centroCustoId: centroCustoId === '_none' ? '' : centroCustoId,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {centros.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.codigo} — {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={absData.pago}
                onCheckedChange={(pago) =>
                  setAbsData((s) => ({ ...s, pago }))
                }
              />
              <Label>Já pago</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgAbs(false)}>
              Cancelar
            </Button>
            <Button
              onClick={submitAbs}
              disabled={
                mutAbs.isPending ||
                mutPutAbs.isPending ||
                !absData.categoriaId ||
                !absData.contaBancariaId
              }
            >
              {absEditId ? 'Salvar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dlgMan}
        onOpenChange={(open) => {
          setDlgMan(open)
          if (!open) setManEditId(null)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {manEditId ? 'Editar manutenção' : 'Manutenção'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Tipo</Label>
              <Input
                value={manData.tipo}
                onChange={(e) =>
                  setManData((s) => ({ ...s, tipo: e.target.value }))
                }
                placeholder="Ex.: Troca de óleo"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={manData.descricao}
                onChange={(e) =>
                  setManData((s) => ({ ...s, descricao: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Data</Label>
              <Input
                type="datetime-local"
                value={manData.data}
                onChange={(e) =>
                  setManData((s) => ({ ...s, data: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                value={manData.valor}
                onChange={(e) =>
                  setManData((s) => ({ ...s, valor: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Categoria (despesa)</Label>
              <Select
                value={manData.categoriaId}
                onValueChange={(categoriaId) =>
                  setManData((s) => ({ ...s, categoriaId }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasDesp.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.codigo} — {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conta bancária</Label>
              <Select
                value={manData.contaBancariaId}
                onValueChange={(contaBancariaId) =>
                  setManData((s) => ({ ...s, contaBancariaId }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {contas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Centro de custo (opcional)</Label>
              <Select
                value={manData.centroCustoId || '_none'}
                onValueChange={(centroCustoId) =>
                  setManData((s) => ({
                    ...s,
                    centroCustoId: centroCustoId === '_none' ? '' : centroCustoId,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {centros.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.codigo} — {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={manData.pago}
                onCheckedChange={(pago) =>
                  setManData((s) => ({ ...s, pago }))
                }
              />
              <Label>Já pago</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgMan(false)}>
              Cancelar
            </Button>
            <Button
              onClick={submitMan}
              disabled={
                mutMan.isPending ||
                mutPutMan.isPending ||
                !manData.categoriaId ||
                !manData.contaBancariaId
              }
            >
              {manEditId ? 'Salvar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dlgVia}
        onOpenChange={(open) => {
          setDlgVia(open)
          if (!open) setViaEditId(null)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {viaEditId ? 'Editar viagem' : 'Viagem / frete'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Origem</Label>
                <Input
                  value={viaData.origem}
                  onChange={(e) =>
                    setViaData((s) => ({ ...s, origem: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Destino</Label>
                <Input
                  value={viaData.destino}
                  onChange={(e) =>
                    setViaData((s) => ({ ...s, destino: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Início</Label>
                <Input
                  type="datetime-local"
                  value={viaData.dataInicio}
                  onChange={(e) =>
                    setViaData((s) => ({ ...s, dataInicio: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Fim (opcional)</Label>
                <Input
                  type="datetime-local"
                  value={viaData.dataFim}
                  onChange={(e) =>
                    setViaData((s) => ({ ...s, dataFim: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Km rodado</Label>
              <Input
                value={viaData.kmRodado}
                onChange={(e) =>
                  setViaData((s) => ({ ...s, kmRodado: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Valor da receita (opcional)</Label>
              <Input
                value={viaData.valorReceita}
                onChange={(e) =>
                  setViaData((s) => ({ ...s, valorReceita: e.target.value }))
                }
                placeholder="Se preenchido, gera lançamento de receita"
              />
            </div>
            <div>
              <Label>Categoria (receita) — se houver valor</Label>
              <Select
                value={viaData.categoriaId || '_none'}
                onValueChange={(categoriaId) =>
                  setViaData((s) => ({
                    ...s,
                    categoriaId: categoriaId === '_none' ? '' : categoriaId,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {categoriasRec.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.codigo} — {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conta bancária — se houver valor</Label>
              <Select
                value={viaData.contaBancariaId || '_none'}
                onValueChange={(contaBancariaId) =>
                  setViaData((s) => ({
                    ...s,
                    contaBancariaId:
                      contaBancariaId === '_none' ? '' : contaBancariaId,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {contas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Centro de custo (opcional)</Label>
              <Select
                value={viaData.centroCustoId || '_none'}
                onValueChange={(centroCustoId) =>
                  setViaData((s) => ({
                    ...s,
                    centroCustoId:
                      centroCustoId === '_none' ? '' : centroCustoId,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {centros.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.codigo} — {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={viaData.pago}
                onCheckedChange={(pago) =>
                  setViaData((s) => ({ ...s, pago }))
                }
              />
              <Label>Receita já recebida</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgVia(false)}>
              Cancelar
            </Button>
            <Button
              onClick={submitVia}
              disabled={mutVia.isPending || mutPutVia.isPending}
            >
              {viaEditId ? 'Salvar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dlgDados} onOpenChange={setDlgDados}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar veículo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Placa</Label>
              <Input
                value={editData.placa}
                onChange={(e) =>
                  setEditData((s) => ({ ...s, placa: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Input
                value={editData.tipo}
                onChange={(e) =>
                  setEditData((s) => ({ ...s, tipo: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Marca</Label>
              <Input
                value={editData.marca}
                onChange={(e) =>
                  setEditData((s) => ({ ...s, marca: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Modelo</Label>
              <Input
                value={editData.modelo}
                onChange={(e) =>
                  setEditData((s) => ({ ...s, modelo: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Ano</Label>
              <Input
                value={editData.ano}
                onChange={(e) =>
                  setEditData((s) => ({ ...s, ano: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Km atual</Label>
              <Input
                value={editData.km_atual}
                onChange={(e) =>
                  setEditData((s) => ({ ...s, km_atual: e.target.value }))
                }
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch
                checked={editData.ativo}
                onCheckedChange={(ativo) =>
                  setEditData((s) => ({ ...s, ativo }))
                }
              />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgDados(false)}>
              Cancelar
            </Button>
            <Button onClick={saveDados} disabled={mutUp.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirmItemDel}
        onOpenChange={(open) => !open && setConfirmItemDel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              O lançamento financeiro vinculado também será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={
                mutDelAbs.isPending ||
                mutDelMan.isPending ||
                mutDelVia.isPending
              }
              onClick={() => {
                if (!confirmItemDel) return
                const { kind, id } = confirmItemDel
                if (kind === 'ab') {
                  mutDelAbs.mutate(id, {
                    onSuccess: () => setConfirmItemDel(null),
                  })
                } else if (kind === 'man') {
                  mutDelMan.mutate(id, {
                    onSuccess: () => setConfirmItemDel(null),
                  })
                } else {
                  mutDelVia.mutate(id, {
                    onSuccess: () => setConfirmItemDel(null),
                  })
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir veículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o cadastro e os registros operacionais vinculados.
              Lançamentos financeiros permanecem no sistema (sem vínculo ao
              veículo).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                del.mutate(id!, {
                  onSuccess: () =>
                    router.push(`/org/${slug}/frota/veiculos`),
                })
              }
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
