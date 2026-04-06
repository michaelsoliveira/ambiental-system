import { ScrollArea } from '@radix-ui/react-scroll-area'
import { flexRender,Row, Table } from '@tanstack/react-table'
import { ChevronDown, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { TableCell, TableRow } from '../table'

interface DataTableRowProps<T> {
  table?: Table<T>
  row: Row<T>
  colSpan: number
  subComponent?: React.ReactNode
}

export function DataTableRow<T>({ table, row, colSpan, subComponent }: DataTableRowProps<T>) {
  const shouldRenderSubComponent = row.getIsExpanded() && subComponent !== null && typeof subComponent !== typeof undefined;

  return (
    <>
      <TableRow 
        className="border-b cursor-pointer hover:bg-gray-100 transition"
        onClick={() => table?.getRow(row.id).toggleExpanded()}        
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id} className="px-3 py-2">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>

      {shouldRenderSubComponent && (
        <TableRow>
          <TableCell colSpan={colSpan} className="px-4 py-3 border-b">
            <div className="rounded-md border">
              {subComponent}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
