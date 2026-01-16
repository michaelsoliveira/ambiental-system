'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Suspense, useCallback, useEffect, useRef } from 'react'
import { Copy, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LancamentoForm } from './form/lancamento-form'

interface EditLancamentoDialogProps {
  trigger?: React.ReactNode
  initialData?: any
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string;
  categorias: any
  contas: any
  centrosCusto: any
  parceiros: any
}

export function EditLancamentoDialog({ 
  trigger, 
  initialData, 
  open,
  onOpenChange,
  className,
  categorias,
  contas,
  centrosCusto,
  parceiros
}: EditLancamentoDialogProps) {

  // Keep a stable internal ref and optionally mirror to external ref
  const internalRef = useRef<HTMLDivElement>(null)

  const setScrollNode = useCallback((node: HTMLDivElement | null) => {
    // @ts-ignore
    internalRef.current = node
    if (open && node) {
      node.scrollTop = 0
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const el = internalRef.current
    if (!el) return
    const id = requestAnimationFrame(() => {
      el.scrollTop = 0
    })
    return () => cancelAnimationFrame(id)
  }, [open])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent 
          className={cn(
          className,
          "z-50 max-h-[90vh] flex flex-col p-0 overflow-hidden"
        )}
      >
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-3">
          <DialogHeader>
            <div className='flex flex-row justify-between w-full'>
              <div>
                <DialogTitle className='mb-1'>
                  {
                    initialData?.id 
                    ? 
                    initialData.categorias
                      .sort((a: any, b: any) => {
                        if (a.categoria_id !== 1 && b.categoria === 1) return 1;
                        if (a.categoria_id === 1 && b.categoria !== 1) return -1;
                        return 0;
                      })
                      .map((categoria: any) => (
                        <span 
                          key={categoria.id} 
                          className='text-wrap'
                        >
                          {categoria.tipo}
                        </span>
                      ))
              
                    : 'Novo Lançamento'
                  }
                </DialogTitle>
                <DialogDescription className='text-sm text-muted-foreground flex items-center'>
                  {initialData && (
                    <>
                      { initialData?.descricao ? 
                      <>
                        {initialData?.descricao}
                        <span 
                          onClick={() => navigator.clipboard.writeText(initialData?.descricao ?? '')} 
                          className='inline cursor-pointer hover:text-blue-600 mx-2'
                        >
                          <Copy className='h-4 w-4' />
                        </span>
                      </>
                      : 'Sem descrição cadastrada' }
                    </>
                  )}
                  

                </DialogDescription>
              </div>
              <div>
                <X className='h-6 w-6 cursor-pointer text-gray-500 hover:text-gray-700' onClick={() => onOpenChange && onOpenChange(false)} />
              </div>
            </div>
          </DialogHeader>
        </div>
        <div ref={setScrollNode} className="overflow-y-auto px-6 py-3">
          <Suspense fallback={
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          }>
          <LancamentoForm
            initialData={initialData}
            onClose={() => onOpenChange?.(false)}
            categorias={categorias}
            centrosCusto={centrosCusto}
            contas={contas}
            parceiros={parceiros}
          />
          </Suspense>
        </div>
        <div className="sticky bottom-0 z-10 bg-background border-t px-6 py-3">
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange && onOpenChange(false)}>Cancelar</Button>
            <Button form="form-lancamento" type="submit">Salvar</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}