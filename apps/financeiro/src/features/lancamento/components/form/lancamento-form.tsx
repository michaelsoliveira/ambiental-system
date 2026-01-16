'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { DadosLancamentoTab } from './tabs/dados-lancamento-tab'
import { ParcelasTab } from './tabs/parcelas-tab'
import { useCreateLancamento, useUpdateLancamento } from '@/hooks/use-lancamentos'
import { FieldErrors, SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LancamentoFormValues, lancamentoSchema } from '../../utils/form-schema'
import { Form } from '@/components/ui/form'
import { FormErrorWarning } from './form-error-warning'
import { prepareFormData } from '@/lib/file-upload'
import { zodV4Resolver } from '@/lib/zod-v4-resolver'
import { useParams } from 'next/navigation'

interface LancamentoFormProps {
  initialData: any
  onClose?: () => void
  categorias: any
  contas: any
  centrosCusto: any,
  parceiros: any
}

export function LancamentoForm({ 
  initialData, 
  onClose,
  categorias,
  contas,
  centrosCusto,
  parceiros
}: LancamentoFormProps) {
  const form = useForm<LancamentoFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodV4Resolver(lancamentoSchema) as any,
    defaultValues: {
      id: initialData?.id ?? undefined,
      numero: initialData?.numero ?? "",
      tipo: initialData?.tipo ?? "DESPESA",
      data: initialData?.data ? new Date(initialData.data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      data_vencimento: initialData?.data_vencimento ? new Date(initialData.data_vencimento).toISOString().split('T')[0] : "",
      descricao: initialData?.descricao ?? "",
      valor: initialData?.valor?.toString() ?? "",
      categoria_id: initialData?.categoria_id ?? "",
      conta_bancaria_id: initialData?.conta_bancaria_id ?? "",
      centro_custo_id: initialData?.centro_custo_id ?? "",
      parceiro_id: initialData?.parceiro_id ?? "",
      forma_parcelamento: initialData?.forma_parcelamento ?? "UNICA",
      numero_parcelas: initialData?.numero_parcelas?.toString() ?? "1",
      pago: initialData?.pago ?? false,
      status_lancamento: initialData?.status_lancamento ?? "PENDENTE",
      observacoes: initialData?.observacoes ?? "",
      parcelas: initialData?.parcelas ?? []
    }
  })

  const { slug } = useParams<{ slug: string }>()

  const { formState: { errors, isValid, isDirty } } = form

  const getTabWithFirstError = useCallback((errors: any) => {
    const fieldToTabMap: Record<string, string> = {
      'numero': 'dados',
      'tipo': 'dados',
      'data': 'dados',
      'data_vencimento': 'dados',
      'descricao': 'dados',
      'valor': 'dados',
      'categoria_id': 'dados',
      'conta_bancaria_id': 'dados',
      'centro_custo_id': 'dados',
      'forma_parcelamento': 'dados',
      'numero_parcelas': 'dados',
      'parcelas': 'parcelas',
      'observacoes': 'dados'
    }

    const tabOrder = ['dados', 'parcelas']

    for (const tab of tabOrder) {
      for (const [field, tabName] of Object.entries(fieldToTabMap)) {
        if (tabName === tab && errors[field]) {
          return tab
        }
      }
    }

    return 'dados'
  }, [])

  const onError = useCallback((errors: FieldErrors<LancamentoFormValues>) => {
    const tabWithError = getTabWithFirstError(errors)
    setCurrentTab(tabWithError)
    setShowErrorWarning(true)
    
    const errorCount = Object.keys(errors).length
    
    toast.error(
      `${errorCount} ${errorCount === 1 ? 'erro encontrado' : 'erros encontrados'}`,
      {
        description: `Verifique os campos na aba "${getTabLabel(tabWithError)}"`,
        duration: 5000
      }
    )
  }, [getTabWithFirstError])

  const { mutate: createLancamentoMutate, isPending } = useCreateLancamento(slug)
  const { mutate: updateLancamentoMutate, isPending: isPendingUpdate } = useUpdateLancamento(slug)
  
  const [currentTab, setCurrentTab] = useState('dados')
  const [showErrorWarning, setShowErrorWarning] = useState(false)
  const [loading, setLoading] = useState(false)

  const getTabLabel = (tabId: string): string => {
    const labels: Record<string, string> = {
      'dados': 'Dados',
      'parcelas': 'Parcelas'
    }
    return labels[tabId] || tabId
  }

  useEffect(() => {
    if (Object.keys(errors).length > 0 && showErrorWarning) {
      setTimeout(() => {
        const firstErrorField = Object.keys(errors)[0]
        const element = document.querySelector(`[name="${firstErrorField}"]`) || 
                       document.querySelector(`[data-field="${firstErrorField}"]`)
        
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          
          setTimeout(() => {
            (element as HTMLElement).focus?.()
          }, 400)
        }
      }, 100)
    }
  }, [errors, showErrorWarning, currentTab])

  const onSubmit: SubmitHandler<LancamentoFormValues> = async (data) => {
    try {
      if (!isValid || Object.keys(errors).length > 0) {
        const tabWithError = getTabWithFirstError(errors)
        setCurrentTab(tabWithError)
        setShowErrorWarning(true)
        
        const errorCount = Object.keys(errors).length
        toast.error(`Encontrado${errorCount > 1 ? 's' : ''} ${errorCount} ${errorCount === 1 ? 'erro' : 'erros'}. Verifique a aba "${getTabLabel(tabWithError)}".`)
        
        return
      }
      
      const formData: FormData = prepareFormData(data, 'data')
      
      if (initialData?.id) {
        updateLancamentoMutate({ lancamentoId: initialData.id, formData }) 
      } else {
        createLancamentoMutate({ formData })
      }

    } catch (error) {
      console.error('Erro ao salvar lançamento:', error)
      toast.error('Erro ao salvar lançamento.')
    } finally {
      if (isValid && Object.keys(errors).length === 0) {
        onClose?.()
      }
    }
  }

  const handleTabChange = (tabId: string) => {
    if (Object.keys(errors).length > 0 && isDirty) {
      setShowErrorWarning(true)
    }

    setCurrentTab(tabId)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="px-2">
      {(Object.keys(errors).length > 0 && showErrorWarning) && (
        <div className="relative">
          <FormErrorWarning errors={errors} />
          <button
            onClick={() => setShowErrorWarning(false)}
            className="absolute top-2 right-2 text-red-400 hover:text-red-600"
            aria-label="Fechar aviso"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="border-b border-accent-foreground/30">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            { id: 'dados', label: 'Dados', disabled: false },
            { id: 'parcelas', label: 'Parcelas', disabled: false }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-2 px-1 border-b-3 border-primary font-medium text-sm transition-colors ${
                currentTab === tab.id
                  ? 'border-primary text-primary'
                  : tab.disabled
                  ? 'border-transparent text-accent-foreground cursor-not-allowed opacity-50'
                  : 'border-transparent text-muted-foreground hover:text-primary/75 hover:border-primary/50'
              }`}
              disabled={tab.disabled}
            >
              {tab.label}
              {tab.disabled && <span className="ml-1 text-xs">🔒</span>}
            </button>
          ))}
        </nav>
      </div>

      <div className="rounded-lg mt-2 shadow p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4" id='form-lancamento'>
            {currentTab === 'dados' && (
              <DadosLancamentoTab 
                categorias={categorias}
                contas={contas}
                centrosCusto={centrosCusto}
                parceiros={parceiros}
              />
            )}

            {currentTab === 'parcelas' && (
              <ParcelasTab />
            )}
          </form>
        </Form>
      </div>
    </div>
  )
}