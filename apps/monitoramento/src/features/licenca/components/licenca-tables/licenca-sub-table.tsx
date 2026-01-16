'use client'

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ClipboardList, Pencil, Trash } from "lucide-react";
import { PessoaType, LicencaType } from "types";
import { licencaColumns } from "./columns";
import { CellDetail } from "./cell-detail";
import { EditLicencaDialog } from "../edit-licenca-dialog";
import { AlertModal } from "@/components/modal/alert-modal";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LicencaSubDataTableProps {
  pessoa: Omit<PessoaType, 'licencas'>;
  licencas: LicencaType[];
}

export function LicencaSubTable({ pessoa, licencas }: LicencaSubDataTableProps) {
  const table = useReactTable({
    data: licencas,
    columns: licencaColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const [loading, setLoading] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const queryClient = useQueryClient()
  const { client } = useAuthContext()
  const [licenca, setLicenca] = useState<LicencaType>()
  const router = useRouter()

  const onConfirm = async () => {
    try {
      setLoading(true)
      await client.delete(`/licenca/${licenca?.id}`).then((res: any) => {
        const { error, message } = res.data;
        if (!error) {
          toast.success(message)
        } else {
          toast.error(message)
        }
      })
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
      await queryClient.invalidateQueries({ queryKey: ["pessoas-licencas"] })
    }
  };

  return (
    <>
      <AlertModal
        isOpen={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={onConfirm}
        loading={loading}
      />
      <EditLicencaDialog
        title="Editar Licenca"
        description="Atualize os dados da licença nos campos abaixo."
        isOpen={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        className="max-w-4xl w-full"
        licenca={licenca!}
      />
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
              <TableHead className="flex flex-row items-center justify-center">Ações</TableHead>
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
              <TableCell className="flex flex-row items-center justify-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => {
                          setOpenEditDialog(true)
                          setLicenca(row.original)
                        }}
                        size="sm"
                        variant="ghost"
                        className="cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar Licença</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setOpenDeleteDialog(true);
                          setLicenca(row.original);
                        }}
                        className="text-red-600 cursor-pointer hover:text-red-500"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Excluir Licença</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CellDetail row={{ pessoa, ...row.original }} />
                    </TooltipTrigger>
                    <TooltipContent>Detalhes da Licença</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="cursor-pointer"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          router.push(`/dashboard/licenca/${row.original.id}/condicionantes`)
                        }
                      >
                        <ClipboardList className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Condicionantes da Licença</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    
    </>
  );
}