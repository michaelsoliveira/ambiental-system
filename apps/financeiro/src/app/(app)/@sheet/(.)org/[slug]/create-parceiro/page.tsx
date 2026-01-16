import { InterceptedSheetContent } from '@/components/intercepted-sheet-content'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ParceiroForm } from '@/features/parceiro/parceiro-form'

export default function CreateParceiro() {
  return (
    <Sheet defaultOpen>
      <InterceptedSheetContent>
        <SheetHeader>
          <SheetTitle>Novo Parceiro</SheetTitle>
        </SheetHeader>

        <div className="py-4">
          <ParceiroForm />
        </div>
      </InterceptedSheetContent>
    </Sheet>
  )
}