import { ColumnDef } from "@tanstack/react-table"
import { CondicionanteListingItem } from "../licenca-condicionante-listing"
import { CellAction } from "./cell-action"
import { formatData } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight } from "lucide-react"

export const columns: ColumnDef<CondicionanteListingItem>[] = [
  {
    id: "expand",
    header: "",
    cell: ({ row }) => {
      const isOpen = row.getIsExpanded();
      return (
        <Button className="hover:cursor-pointer" variant="ghost" size="icon" onClick={() => row.toggleExpanded()}>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </Button>
      );
    },
  },
    {
      accessorKey: 'condicionante.descricao',
      header: 'Condicionante'
    },
    // {
    //   accessorKey: 'responsavel',
    //   header: 'Responsável'
    // },
    {
      accessorKey: 'dataAtribuicao',
      header: 'Atribuição',
      cell: ({ row }) => new Date(row.original.dataAtribuicao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    },
    {
      accessorKey: 'diasAntecedencia',
      header: 'Dias p/ notificar',
      cell: ({ row }) =>
        row.original.diasAntecedencia ?? <span className="text-muted-foreground italic">-</span>
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <CellAction index={row.index} data={row.original} />
    }
  ]