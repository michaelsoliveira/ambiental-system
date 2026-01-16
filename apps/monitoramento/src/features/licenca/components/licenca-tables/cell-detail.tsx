import { Modal } from "@/components/ui/modal";
import { useState } from "react";
import { LicencaDetails } from "../licenca-details";
import { EyeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const CellDetail: React.FC<{ row: any }> = ({ row }) => {
    const [open, setOpen] = useState<boolean>(false);
    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                    variant='ghost' 
                    onClick={() => setOpen(true)} 
                    className='flex items-center justify-center cursor-pointer'
                    >
                    <EyeIcon className="w-4 h-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Detalhes da Licença</TooltipContent>
            </Tooltip>
            <Modal
                isOpen={open}
                onClose={() => setOpen(false)}
                title="Detalhes da Licença"
                description='Visualizar os detalhes da licença'
                className='max-w-5xl'
            >
                <LicencaDetails licenca={row} onClose={() => setOpen(false)} />
            </Modal>
        </>
    );
}