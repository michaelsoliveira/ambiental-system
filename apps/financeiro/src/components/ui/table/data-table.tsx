'use client';
import {
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon
} from '@radix-ui/react-icons';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable
} from '@tanstack/react-table';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { parseAsInteger, useQueryState } from 'nuqs';

import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalItems: number;
  pageSizeOptions?: number[];
  page?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalItems,
  pageSizeOptions = [50, 100, 200, 500, 1000],
  page = 1
}: DataTableProps<TData, TValue>) {
  const [currentPage, setCurrentPage] = useQueryState(
    'page',
    parseAsInteger.withOptions({ shallow: false }).withDefault(page)
  );
  const [pageSize, setPageSize] = useQueryState(
    'limit',
    parseAsInteger
      .withOptions({ shallow: false, history: 'push' })
      .withDefault(pageSizeOptions[0])
  );

  const paginationState = {
    pageIndex: currentPage - 1,
    pageSize: pageSize
  };

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

    setCurrentPage(pagination.pageIndex + 1);
    setPageSize(pagination.pageSize);
  }

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount,
    state: {
      pagination: paginationState
    },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true
  });

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='flex flex-1 h-full w-full'>
        <div className='w-full rounded-md border overflow-x-auto'>
      {/* <div className='relative flex flex-1 min-h-[calc(30vh-50px)] md:min-h-[calc(100vh-300px)]'>
        <div className='absolute inset-0 h-full flex overflow-scroll rounded-md border md:overflow-auto'> */}
          {/* <ScrollArea className='flex-1'> */}
            <Table className='relative'>
              <TableHeader>
                {table.getHeaderGroups()?.map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows?.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className="group hover:bg-muted/50 transition-colors"
                    >
                      {row.getVisibleCells()?.map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
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
            {/* <ScrollBar orientation='horizontal' />
          </ScrollArea> */}
        </div>
      </div>

      <div className='flex flex-col items-center justify-end gap-2 space-x-2 py-2 sm:flex-row'>
        <div className='flex w-full items-center justify-between'>
          <div className='flex-1 text-sm text-muted-foreground'>
            {totalItems > 0 ? (
              <>
                Mostrando de {' '}
                {paginationState.pageIndex * paginationState.pageSize + 1} à{' '}
                {Math.min(
                  (paginationState.pageIndex + 1) * paginationState.pageSize,
                  totalItems
                )}{' '}
                de {totalItems} total
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
                <SelectTrigger className='h-8 w-[90px]'>
                  <SelectValue placeholder={paginationState.pageSize} />
                </SelectTrigger>
                <SelectContent side='top'>
                  {pageSizeOptions.map((pageSize) => (
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
    </div>
  );
}