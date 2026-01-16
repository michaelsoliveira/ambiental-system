import { ColumnDef } from "@tanstack/react-table";
import { TipoLicencaType } from "types";
import { CellAction } from "./cell-action";

export const columns: ColumnDef<TipoLicencaType>[] = [
  {
    accessorKey: "nome",
    header: "Nome",
  },
  {
    accessorKey: "descricao",
    header: "Descrição",
  },
  {
    header: 'Ações',
    id: 'actions',
    cell: ({ row }) => <div className='flex items-center'><CellAction data={row.original} /></div>
  }
];
