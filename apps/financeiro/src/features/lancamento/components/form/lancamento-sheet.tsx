'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LancamentoForm } from './lancamento-form'
import { cn } from '@/lib/utils'
import { Copy, Maximize2, Minimize2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface LancamentoSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: any
    categorias: any
    contas: any
    centrosCusto: any
    parceiros: any
    className?: string
}

export function LancamentoSheet({ 
    open, 
    onOpenChange, 
    initialData,
    categorias,
    contas,
    centrosCusto,
    parceiros,
    className
}: LancamentoSheetProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
    if (open) {
        setTimeout(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0
        }
        }, 100)
    }
    }, [open])

    useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = 0
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [isExpanded])

    const toggleView = () => {
        setIsExpanded(!isExpanded)
    }

    const handleClose = () => {
        onOpenChange(false)
        setTimeout(() => setIsExpanded(false), 200)
    }

    const HeaderContent = () => {
      const descricao = initialData?.descricao || 'Novo lançamento'
      const numero = initialData?.numero || ''
      
      return (
        <>
        <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <h3 className='text-wrap font-semibold'>{descricao}</h3>
              {numero && (
                <p className='text-sm text-muted-foreground'>#{numero}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
            <TooltipProvider>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={toggleView}
                    >
                    {isExpanded ? (
                        <Minimize2 className="h-4 w-4" />
                    ) : (
                        <Maximize2 className="h-4 w-4" />
                    )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isExpanded ? 'Minimizar' : 'Expandir'}</p>
                </TooltipContent>
                </Tooltip>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={handleClose}
                    >
                    <X className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Fechar</p>
                </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            </div>
        </div>
        {initialData && initialData?.numero_parcelas && (
            <span className='flex flex-row text-sm text-muted-foreground gap-1'>
            <span>Parcelas: {initialData.numero_parcelas}</span>
            </span>
        )}
        </> 
  )
}

const FooterContent = () => (
    <div className="flex flex-row justify-end gap-2">
      <Button variant="outline" onClick={handleClose}>Cancelar</Button>
      <Button form="form-lancamento" type="submit">Salvar</Button>
    </div>
  )

  const FormContent = () => (
    <LancamentoForm
        initialData={initialData}
        onClose={handleClose}
        categorias={categorias}
        contas={contas}
        centrosCusto={centrosCusto}
        parceiros={parceiros}
    />
  )

  if (isExpanded) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className={cn("max-w-4xl h-[90vh] flex flex-col p-0", className)}>
          <DialogHeader className='sticky top-0 z-10 bg-background border-b px-6 py-4'>
            <DialogTitle>
              <HeaderContent />
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulário de lançamento
            </DialogDescription>
          </DialogHeader>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-2">
            <FormContent />
          </div>
          <DialogFooter className="sticky bottom-0 z-10 bg-background border-t px-6 py-3">
            <FooterContent />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent 
        side="right"  
        className={cn(
          className,
          "z-50 flex flex-col p-0 w-full sm:max-w-lg"
        )}
      >
        <SheetHeader className='sticky top-0 z-10 bg-background border-b px-6 py-3'>
          <SheetTitle>
            <HeaderContent />
          </SheetTitle>
          <SheetDescription className="sr-only">
            Formulário de lançamento
          </SheetDescription>
        </SheetHeader>
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-2">
          <FormContent />
        </div>
        <SheetFooter className="sticky bottom-0 z-10 bg-background border-t px-6 py-3">
          <FooterContent />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}