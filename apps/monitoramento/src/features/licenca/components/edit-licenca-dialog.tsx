"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LicencaType } from "types"
import LicencaForm from "./licenca-form"
import { Modal } from "@/components/ui/modal"
import { useEffect, useState } from "react"

type Props = {
  title: string;
  description?: string;
  licenca: LicencaType;
  className?: string;
  isOpen?: boolean;
  onClose: () => void;
  trigger?: React.ReactNode;
}

export const EditLicencaDialog = ({   
  title,
  description,
  className,
  isOpen,
  onClose,
  trigger,
  licenca
}: Props) => {
  const onChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/75 z-40" />}
      <Dialog open={isOpen} onOpenChange={onChange} modal={false}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className={className}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        <LicencaForm
          initialData={licenca}
          pageTitle="Editar Licença"
          modal
          onSubmit={() => onClose()}
        />
        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onClose()}
          >
            Cancelar
          </Button>
          <Button form="form-licenca" type="submit">Salvar</Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}