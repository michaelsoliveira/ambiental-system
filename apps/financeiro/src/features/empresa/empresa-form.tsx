'use client'

import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { SelectSearchable } from '@/components/select-searchable'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { usePessoas } from '@/hooks/use-pessoas'
import { useCreateEmpresa, useEmpresa, useUpdateEmpresa } from '@/hooks/use-empresas'

export function EmpresaForm({ empresaId, onSuccess }: { empresaId?: string; onSuccess?: () => void }) {
  const { slug } = useParams<{ slug: string }>()
  const [search, setSearch] = useState('')
  const [pessoaId, setPessoaId] = useState<string>()

  const { data: empresaData } = useEmpresa(slug!, empresaId || '', !!empresaId)
  const { data: pessoasResp }: any = usePessoas(slug!, { search, limit: 50 })
  const createEmpresa = useCreateEmpresa(slug!)
  const updateEmpresa = useUpdateEmpresa(slug!)

  const pessoas = pessoasResp?.data ?? pessoasResp?.pessoas ?? []
  const options = useMemo(
    () =>
      (pessoas || []).map((p: any) => ({
        value: p.id,
        label: p.tipo === 'F' ? p.fisica?.nome : p.juridica?.nome_fantasia,
      })),
    [pessoas],
  )

  const currentPessoa = pessoaId ?? empresaData?.empresa?.pessoa_id

  async function handleSubmit() {
    if (!currentPessoa) return
    if (empresaId) {
      await updateEmpresa.mutateAsync({ id: empresaId, data: { pessoa_id: currentPessoa } })
    } else {
      await createEmpresa.mutateAsync({ pessoa_id: currentPessoa })
    }
    onSuccess?.()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Pessoa vinculada</Label>
        <SelectSearchable
          options={options}
          value={currentPessoa}
          onValueChange={setPessoaId}
          onSearchChange={setSearch}
          placeholder="Selecione uma pessoa"
          searchPlaceholder="Buscar pessoa..."
        />
      </div>
      <Button className="w-full" onClick={handleSubmit}>
        {empresaId ? 'Atualizar' : 'Criar'} empresa
      </Button>
    </div>
  )
}
