// components/condicionante/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CondicionanteType } from "types";
import { CellAction } from "./cell-action";

export const columns: ColumnDef<CondicionanteType>[] = [
  {
    accessorKey: "descricao",
    header: "Descrição",
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }) => <Badge>{row.original.tipo}</Badge>,
  },
  {
    accessorKey: "frequencia",
    header: "Frequência",
    cell: ({ row }) => row.original.frequencia || "-",
  },
  {
    accessorKey: "prazoDias",
    header: "Prazo (dias)",
    cell: ({ row }) => row.original.prazoDias ?? "-",
  },
  {
    header: 'Ações',
    id: 'actions',
    cell: ({ row }) => <div className='flex items-center'><CellAction data={row.original} /></div>
  }
];
