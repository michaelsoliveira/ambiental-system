import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { UserType } from "types";
import { Button } from "@/components/ui/button";
import { UserForm } from "./user-form";
import { useRoles } from "@/hooks/use-roles";

type Props = {
  user?: UserType;
  trigger?: React.ReactNode;
  className?: string;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

export const UserEditDialog = ({ trigger, user, className, open: controlledOpen, setOpen: setControlledOpen }: Props) => {
  const [open, setOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && setControlledOpen !== undefined;
  
  const actualOpen = isControlled ? controlledOpen : open;
  const actualSetOpen = isControlled ? setControlledOpen : setOpen;
  const { data: roles, isLoading } = useRoles()

  return (
    <Dialog open={actualOpen} onOpenChange={actualSetOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={cn(className, 'z-50')}>
        <DialogHeader>
          <DialogTitle>{user?.id ? 'Editar' : 'Cadastrar'} Usuário</DialogTitle>
          <DialogDescription>
            {user?.id ? 'Atualize' : 'Cadastre'} os dados do usuário nos campos abaixo.
          </DialogDescription>
        </DialogHeader>
        <UserForm 
          onClose={() => actualSetOpen(false)} 
          defaultValues={{
            ...user,
            roles: user?.roles?.map(role => role.id) ?? [],
          }}
          roles={roles} 
        />
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => actualSetOpen(false)}>Cancelar</Button>
          <Button form="form-user" type="submit">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
