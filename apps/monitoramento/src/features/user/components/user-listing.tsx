'use client'

import { DataTable as DataTableUsers } from "@/components/ui/table/data-table";
import { columns } from "./user-tables/columns";
import { useUsers } from "@/hooks/use-users";
import { useUserTableFilter } from "./user-tables/use-user-table-filters";
import { useSearchParams } from "next/navigation";

export function UserListing() {
  const {
    search,
    page,
    limit
  } = useUserTableFilter()

  const { data, isLoading } = useUsers({
    search,
    page,
    limit,
    orderBy: 'username',
    order: 'asc'
  })
  const { data: users = [], total } = data ?? { users: [], total: 0 }
  return (
    <>
      { data && (
        <>
          <DataTableUsers
              columns={columns}
              data={users}
              totalItems={total}
          />
        </>
      ) }
    </>
  );
}
