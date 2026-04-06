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
  const [search, setSearch] = useState<string>()
  const [pessoaId, setPessoaId] = useState<string>()
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

  const { data: responseUsers = [], isLoading: isLoadingUser } = usePessoas(org, { search })
  const { data: pessoas = [], pagination }: any = responseUsers ?? { 
    pessoas: [], 
    pagination: { count: 0 } 
  };
  
  const usersOptions = useMemo(() => {
    if (!pessoas || !Array.isArray(pessoas)) return []
    
    return pessoas
      // .filter(pessoa => pessoa && pessoa.fisica && pessoa.fisica.nome)
      .map((pessoa: any) => ({ 
        label: pessoa.tipo === 'F' ? pessoa.fisica.nome : pessoa.juridica.nome_fantasia, 
        value: pessoa.id 
      }))
  }, [pessoas])


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
        <Label htmlFor="tipo_parceiro">Código</Label>
        <Select name="tipo_parceiro" defaultValue="CLIENTE">
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
            {errors.codigo[0]}
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
          emptyText={pessoas.length === 0 ? "Nenhuma pessoa encontrada" : "" }
          searchPlaceholder="Digite para buscar pessoas..."
          onSearchChange={setSearch}
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
        <Label htmlFor="ativo">Status</Label>
        <Select name="ativo" defaultValue="true">
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