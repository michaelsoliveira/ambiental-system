import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent
  } from "@/components/ui/dropdown-menu";
  import { motion } from "framer-motion";
  import Link from "next/link";

import { Icons } from "../icons";
import { NavItem } from "types";
import { SidebarMenuButton, SidebarMenuItem } from "./sidebar";

  
  export function SidebarItemWithPopup({ item, pathname }: {
    item: NavItem;
    pathname: string;
  }) {
    const Icon = item.icon ? Icons[item.icon] : Icons.logo;
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton tooltip={item.title} isActive={pathname === item.url}>
                {item.icon && <Icon />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
  
          <DropdownMenuContent
            asChild
            side="right"
            align="start"
            sideOffset={4}
            className="p-0 border-none bg-transparent"
          >
            <motion.ul
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white dark:bg-zinc-950 shadow-lg rounded-md p-2 w-48 space-y-1"
            >
              {item.items?.map((subItem) => (
                <li key={subItem.title}>
                  <Link
                    href={subItem.url}
                    className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors hover:bg-muted ${
                      pathname === subItem.url ? "bg-muted font-medium" : ""
                    }`}
                  >
                    {subItem.title}
                  </Link>
                </li>
              ))}
            </motion.ul>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }
  