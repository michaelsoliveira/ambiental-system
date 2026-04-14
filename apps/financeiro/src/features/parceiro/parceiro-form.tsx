'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { SelectSearchable } from '@/components/select-searchable'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useFormState } from '@/hooks/use-form-state'
import { usePessoas } from '@/hooks/use-pessoas'
import { queryClient } from '@/lib/react-query'

import { createParceiroAction } from './parceiro-action'

export function ParceiroForm() {
  const [search, setSearch] = useState<string>('')
  const [page, setPage] = useState(1)
  const [allPessoas, setAllPessoas] = useState<any[]>([])
  const [pessoaId, setPessoaId] = useState<string>()
  const [tipoParceiro, setTipoParceiro] = useState<'CLIENTE' | 'FORNECEDOR' | 'AMBOS'>('CLIENTE')
  const [ativo, setAtivo] = useState<'true' | 'false'>('true')
  const { slug: org } = useParams<{ slug: string }>()

  const [{ errors, message, success }, handleSubmit, isPending] = useFormState(
    createParceiroAction,
    () => {
      queryClient.invalidateQueries({
        queryKey: [org, 'parceiros'],
      })
      toast.success(message ?? 'Parceiro cadastrado com sucesso!')
    },
  )

  const { data: responseUsers = [], isLoading: isLoadingUser } = usePessoas(org, {
    search,
    page,
    limit: 50,
  })
  const { data: pessoas = [], pagination }: any = responseUsers ?? {
    pessoas: [], 
    pagination: { count: 0 } 
  };

  useEffect(() => {
    if (!Array.isArray(pessoas)) return

    setAllPessoas((prev) => {
      if (page === 1) {
        const prevIds = prev.map((item) => item.id).join(',')
        const nextIds = pessoas.map((item: any) => item.id).join(',')
        if (prevIds === nextIds) return prev
        return pessoas
      }
      const seen = new Set(prev.map((item) => item.id))
      const next = pessoas.filter((item: any) => !seen.has(item.id))
      if (next.length === 0) return prev
      return [...prev, ...next]
    })
  }, [pessoas, page])
  
  const usersOptions = useMemo(() => {
    if (!allPessoas || !Array.isArray(allPessoas)) return []
    
    return allPessoas
      .map((pessoa: any) => ({ 
        label: pessoa.tipo === 'F' ? pessoa.fisica.nome : pessoa.juridica.nome_fantasia, 
        value: pessoa.id 
      }))
  }, [allPessoas])


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success === false && message && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Erro ao salvar parceiro!</AlertTitle>
          <AlertDescription>
            <p>{message}</p>
          </AlertDescription>
        </Alert>
      )}

      {success === true && message && (
        <Alert variant="success">
          <AlertTriangle className="size-4" />
          <AlertTitle>Sucesso!</AlertTitle>
          <AlertDescription>
            <p>{message}</p>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <input type="hidden" name="tipo_parceiro" value={tipoParceiro} />
        <Label htmlFor="tipo_parceiro">Código</Label>
        <Select value={tipoParceiro} onValueChange={(value) => setTipoParceiro(value as any)}>
          <SelectTrigger className='w-full'>
            <SelectValue placeholder="Selecione o Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CLIENTE">Cliente</SelectItem>
            <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
            <SelectItem value="AMBOS">Ambos</SelectItem>
          </SelectContent>
        </Select>

        {errors?.tipo_parceiro && (
          <p className="text-xs font-medium text-red-500 dark:text-red-400">
            {errors.tipo_parceiro[0]}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <input type="hidden" name='pessoa_id' value={pessoaId ?? ''} />
        <Label htmlFor="pessoa_id">Pessoa</Label>
        <SelectSearchable
          options={usersOptions} 
          value={pessoaId}
          onValueChange={setPessoaId}
          placeholder="Nome do parceiro"
          emptyText={allPessoas.length === 0 ? "Nenhuma pessoa encontrada" : "" }
          searchPlaceholder="Digite para buscar pessoas..."
          onSearchChange={(value) => {
            setSearch(value)
            setPage(1)
            setAllPessoas([])
          }}
          hasMore={pagination?.has_next}
          isLoadingMore={isLoadingUser && page > 1}
          onLoadMore={() => {
            if (pagination?.has_next && !isLoadingUser) {
              setPage((old) => old + 1)
            }
          }}
        />
        
        {errors?.pessoa_id && (
          <p className="text-xs font-medium text-red-500 dark:text-red-400">
            {errors.pessoa_id[0]}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea 
          name="observacoes" 
          id="observacoes"
          placeholder="Informações adicionais sobre o parceiro"
        />

        {errors?.observacoes && (
          <p className="text-xs font-medium text-red-500 dark:text-red-400">
            {errors.observacoes[0]}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <input type="hidden" name="ativo" value={ativo} />
        <Label htmlFor="ativo">Status</Label>
        <Select value={ativo} onValueChange={(value) => setAtivo(value as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Ativo</SelectItem>
            <SelectItem value="false">Inativo</SelectItem>
          </SelectContent>
        </Select>

        {errors?.ativo && (
          <p className="text-xs font-medium text-red-500 dark:text-red-400">
            {errors.ativo[0]}
          </p>
        )}
      </div>

      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          'Salvar parceiro'
        )}
      </Button>
    </form>
  )
}