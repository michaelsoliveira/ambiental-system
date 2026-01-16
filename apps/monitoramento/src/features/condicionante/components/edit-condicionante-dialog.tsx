import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CondicionanteType } from "types";
import { CondicionanteForm } from "./condicionante-form";
import { Button } from "@/components/ui/button";

type Props = {
  condicionante?: CondicionanteType;
  trigger?: React.ReactNode;
  className?: string;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

export const EditCondicionanteDialog = ({ trigger, condicionante, className, open: controlledOpen, setOpen: setControlledOpen }: Props) => {
  const [open, setOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && setControlledOpen !== undefined;
  
  const actualOpen = isControlled ? controlledOpen : open;
  const actualSetOpen = isControlled ? setControlledOpen : setOpen;

  return (
    <Dialog open={actualOpen} onOpenChange={actualSetOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={cn(className, 'z-50')}>
        <DialogHeader>
          <DialogTitle>{condicionante?.id ? 'Editar' : 'Cadastrar'} Condicionante</DialogTitle>
          <DialogDescription>
            {condicionante?.id ? 'Atualize' : 'Cadastre'} os dados da condicionante nos campos abaixo.
          </DialogDescription>
        </DialogHeader>
        <CondicionanteForm onClose={() => actualSetOpen(false)} defaultValues={condicionante} />
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => actualSetOpen(false)}>Cancelar</Button>
          <Button form="form-condicionante" type="submit">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
