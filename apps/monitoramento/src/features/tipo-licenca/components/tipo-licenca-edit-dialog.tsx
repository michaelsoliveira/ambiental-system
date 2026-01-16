import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { TipoLicencaType, UserType } from "types";
import { Button } from "@/components/ui/button";
import { TipoLicencaForm } from "./tipo-licenca-form";
import { useRoles } from "@/hooks/use-roles";

type Props = {
  tipoLicenca?: TipoLicencaType;
  trigger?: React.ReactNode;
  className?: string;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

export const TipoLicencaEditDialog = ({ trigger, tipoLicenca, className, open: controlledOpen, setOpen: setControlledOpen }: Props) => {
  const [open, setOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && setControlledOpen !== undefined;
  
  const actualOpen = isControlled ? controlledOpen : open;
  const actualSetOpen = isControlled ? setControlledOpen : setOpen;

  return (
    <Dialog open={actualOpen} onOpenChange={actualSetOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={cn(className, 'z-50')}>
        <DialogHeader>
          <DialogTitle>{tipoLicenca?.id ? 'Editar' : 'Cadastrar'} Tipo Licença</DialogTitle>
          <DialogDescription>
            {tipoLicenca?.id ? 'Atualize' : 'Cadastre'} os dados do tipo da licença nos campos abaixo.
          </DialogDescription>
        </DialogHeader>
        <TipoLicencaForm 
          onClose={() => actualSetOpen(false)} 
          defaultValues={tipoLicenca}
        />
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => actualSetOpen(false)}>Cancelar</Button>
          <Button form="form-tipo-licenca" type="submit">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
