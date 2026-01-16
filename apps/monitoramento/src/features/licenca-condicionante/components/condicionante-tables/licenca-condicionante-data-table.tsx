"use client";

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  PaginationState,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronLeftIcon, ChevronRight, ChevronRightIcon } from "lucide-react";
import { useEffect, useState } from "react";
import React from "react";
import { VencimentoCondicionante } from "types";
import { parseAsInteger, useQueryState } from "nuqs";
import { DoubleArrowLeftIcon, DoubleArrowRightIcon } from "@radix-ui/react-icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTableRow } from "@/components/ui/table/data-table-row";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { VencimentoSubTable } from "./vencimento-sub-table";

interface LicencaTableProps {
  columns: any;
  data: any[];
  totalItems: number;
  pageSizeOptions?: number[];
}

export function LicencaCondicionanteDataTable({
  columns,
  data = [],
  totalItems,
  pageSizeOptions = [10, 20, 30, 40, 50]
}: LicencaTableProps) {
    const [currentPage, setCurrentPage] = useQueryState(
        'page',
        parseAsInteger.withOptions({ shallow: false }).withDefault(1)
    );
    const [pageSize, setPageSize] = useQueryState(
    'limit',
    parseAsInteger
        .withOptions({ shallow: false, history: 'push' })
        .withDefault(10)
    );

    const paginationState = {
    pageIndex: currentPage - 1, // zero-based index for React Table
    pageSize: pageSize
    };

    const isMobile = useIsMobile();

    const pageCount = Math.ceil(totalItems / pageSize);
    
    const handlePaginationChange = (
        updaterOrValue:
          | PaginationState
          | ((old: PaginationState) => PaginationState)
    ) => {
        const pagination =
          typeof updaterOrValue === 'function'
            ? updaterOrValue(paginationState)
            : updaterOrValue;
    
        setCurrentPage(pagination.pageIndex + 1); // converting zero-based index to one-based
        setPageSize(pagination.pageSize);
    }

    const [expandedRows, setExpandedRows] = useState<any>();

    const table = useReactTable<any>({
      data,
      columns,
      pageCount,
      state: {
          pagination: paginationState,
          expanded: expandedRows
      },
      onPaginationChange: handlePaginationChange,
      getCoreRowModel: getCoreRowModel(),
      onExpandedChange: setExpandedRows,
      getSubRows: (row) => row.vencimentos as any,
      getPaginationRowModel: getPaginationRowModel(),
      manualPagination: true,
      manualFiltering: true
    });

  return (
  <>
  <ScrollArea className='flex-1'>
    <div className='flex flex-1 flex-col space-y-4'>
      <div className={cn('relative flex flex-1 min-h-[calc(100vh-180px)] md:min-h-[calc(100vh-315px)]')}>
        <div className='absolute inset-0 h-full flex rounded-md border'>
          
          <Table className="w-full table-auto border-collapse">
            <TableHeader className="bg-gray-100">
              {table.getHeaderGroups()?.map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-left px-3 py-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length > 0 ? (
                  table.getRowModel().rows?.map((row) => (
                    <DataTableRow
                      table={table}
                      key={row.id}
                      row={row}
                      colSpan={columns && columns?.length + 1}
                      subComponent={
                        row.getIsExpanded() && Array.isArray(row.original.vencimentos) && row.original.vencimentos?.length > 0 && (
                          <VencimentoSubTable
                            vencimentos={row.original?.vencimentos ?? []}
                          />
                        )
                      }
                    />
                  ))
                ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns?.length}
                    className='h-24 text-center'
                  >
                    Nenhum Resultado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
    
    <div className='flex items-center justify-end gap-2 space-x-2 py-2 flex-row mx-4'>
      <div className='flex w-full items-center justify-between'>
        <div className='flex-1 text-sm text-muted-foreground'>
          {totalItems > 0 ? (
            <>
              { !isMobile && 'Mostrando de ' }
              {paginationState.pageIndex * paginationState.pageSize + 1}{!isMobile ? ' à ' : ' - '}
              {Math.min(
                (paginationState.pageIndex + 1) * paginationState.pageSize,
                totalItems
              )}{!isMobile ? ' de ' : ' / '}{totalItems} { !isMobile && ' total' }
            </>
          ) : (
            'Nenhum registro encontrado'
          )}
        </div>
        <div className='flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8'>
          <div className='flex items-center space-x-2'>
            <p className='whitespace-nowrap text-sm font-medium'>
              por Página
            </p>
            <Select
              value={`${paginationState.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className='h-8 w-[70px]'>
                <SelectValue placeholder={paginationState.pageSize} />
              </SelectTrigger>
              <SelectContent side='top'>
                {pageSizeOptions?.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className='flex w-full items-center justify-between gap-2 sm:justify-end'>
        <div className='flex items-center justify-center text-sm font-medium'>
          {totalItems > 0 ? (
            <>
              Página {paginationState.pageIndex + 1} de {table.getPageCount()}
            </>
          ) : (
            'No pages'
          )}
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            aria-label='Go to first page'
            variant='outline'
            className='hidden h-8 w-8 p-0 lg:flex'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <DoubleArrowLeftIcon className='h-4 w-4' aria-hidden='true' />
          </Button>
          <Button
            aria-label='Go to previous page'
            variant='outline'
            className='h-8 w-8 p-0'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon className='h-4 w-4' aria-hidden='true' />
          </Button>
          <Button
            aria-label='Go to next page'
            variant='outline'
            className='h-8 w-8 p-0'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRightIcon className='h-4 w-4' aria-hidden='true' />
          </Button>
          <Button
            aria-label='Go to last page'
            variant='outline'
            className='hidden h-8 w-8 p-0 lg:flex'
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <DoubleArrowRightIcon className='h-4 w-4' aria-hidden='true' />
          </Button>
        </div>
      </div>
    </div>
      <ScrollBar orientation='horizontal' />
    </ScrollArea>
  </>
  );
}
