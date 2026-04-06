'use client'

import { HTTPError } from 'ky'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { deleteParceiro } from '@/http/parceiro/delete-parceiro'
import type { ParceiroListRecord } from '@/http/parceiro/get-parceiros'
import {
  type TipoParceiro,
  updateParceiro,
} from '@/http/parceiro/update-parceiro'

function getParceiroNome(p: ParceiroListRecord) {
  return (
    p.pessoa.fisica?.nome ||
    p.pessoa.juridica?.nome_fantasia ||
    'Nome não informado'
  )
}

function parseTipo(t: string): TipoParceiro {
  if (t === 'CLIENTE' || t === 'FORNECEDOR' || t === 'AMBOS') return t
  return 'CLIENTE'
}

export function ParceiroEditDialog({
  parceiro,
  onClose,
  orgSlug,
}: {
  parceiro: ParceiroListRecord | null
  onClose: () => void
  orgSlug: string
}) {
  const router = useRouter()
  const open = !!parceiro
  const [tipo, setTipo] = useState<TipoParceiro>('CLIENTE')
  const [observacoes, setObservacoes] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (parceiro) {
      setTipo(parseTipo(parceiro.tipo_parceiro))
      setObservacoes(parceiro.observacoes ?? '')
      setAtivo(parceiro.ativo)
    }
  }, [parceiro])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!parceiro) return
    setPending(true)
    try {
      await updateParceiro({
        org: orgSlug,
        parceiroId: parceiro.id,
        tipo_parceiro: tipo,
        observacoes: observacoes.trim() === '' ? null : observacoes.trim(),
        ativo,
      })
      toast.success('Parceiro atualizado.')
      onClose()
      router.refresh()
    } catch (err) {
      if (err instanceof HTTPError) {
        try {
          const body = await err.response.json()
          toast.error(typeof body?.message === 'string' ? body.message : 'Erro ao atualizar.')
        } catch {
          toast.error('Erro ao atualizar.')
        }
      } else {
        toast.error('Erro ao atualizar.')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar parceiro</DialogTitle>
        </DialogHeader>
        {parceiro && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Nome</Label>
              <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                {getParceiroNome(parceiro)}
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="tipo_parceiro">Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoParceiro)}>
                <SelectTrigger id="tipo_parceiro" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLIENTE">Cliente</SelectItem>
                  <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
                  <SelectItem value="AMBOS">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Informações adicionais"
                rows={3}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="ativo">Status</Label>
              <Select
                value={ativo ? 'true' : 'false'}
                onValueChange={(v) => setAtivo(v === 'true')}
              >
                <SelectTrigger id="ativo" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function ParceiroDeleteAlert({
  parceiro,
  onClose,
  orgSlug,
}: {
  parceiro: ParceiroListRecord | null
  onClose: () => void
  orgSlug: string
}) {
  const router = useRouter()
  const open = !!parceiro
  const [pending, setPending] = useState(false)

  const handleDelete = async () => {
    if (!parceiro) return
    setPending(true)
    try {
      await deleteParceiro(orgSlug, parceiro.id)
      toast.success('Parceiro excluído.')
      onClose()
      router.refresh()
    } catch (err) {
      if (err instanceof HTTPError) {
        try {
          const body = await err.response.json()
          toast.error(typeof body?.message === 'string' ? body.message : 'Erro ao excluir.')
        } catch {
          toast.error('Erro ao excluir.')
        }
      } else {
        toast.error('Erro ao excluir.')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir parceiro?</AlertDialogTitle>
          <AlertDialogDescription>
            {parceiro
              ? `Esta ação remove o vínculo de parceiro com "${getParceiroNome(parceiro)}". A pessoa cadastrada não é apagada.`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => void handleDelete()}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : 'Excluir'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

type ParceiroRowActionsProps = {
  parceiro: ParceiroListRecord
  canUpdate: boolean
  canDelete: boolean
  onEdit: (p: ParceiroListRecord) => void
  onDelete: (p: ParceiroListRecord) => void
}

export function ParceiroRowActions({
  parceiro,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: ParceiroRowActionsProps) {
  if (!canUpdate && !canDelete) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <div className="flex justify-end gap-1">
      {canUpdate && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Editar"
          onClick={() => onEdit(parceiro)}
        >
          <Pencil className="size-4" />
        </Button>
      )}
      {canDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          title="Excluir"
          onClick={() => onDelete(parceiro)}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  )
}
