// components/condicionante/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { UserType } from "types";
import { CellAction } from "./cell-action";
import { UserPayload } from "@/hooks/use-users";

export const columns: ColumnDef<UserType>[] = [
  {
    accessorKey: "username",
    header: "Nome",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.original.email || "-",
  },
  {
    accessorKey: "roles",
    header: "Papéis",
    cell: ({ row }) => {
      const roles = row.original.roles;
      if (!roles || roles.length === 0) return "-";
      return (
        <div className="flex flex-wrap gap-1">
          {roles.map((role: { id: string; name: string }) => (
            <Badge key={role.id} variant="outline">
              {role.name}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    header: 'Ações',
    id: 'actions',
    cell: ({ row }) => <div className='flex items-center'><CellAction data={row.original} /></div>
  }
];
