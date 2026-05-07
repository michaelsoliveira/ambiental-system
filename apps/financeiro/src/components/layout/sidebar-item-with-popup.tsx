import { motion } from "framer-motion";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { NavItem } from "@/types";

import { Icons } from "../icons";
import { SidebarMenuButton,SidebarMenuItem } from "../ui/sidebar";

  
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
            side="right"
            align="start"
            sideOffset={4}
            className="z-50 w-56 border border-emerald-300/30 bg-slate-950/95 p-2 text-emerald-50 shadow-xl shadow-black/25"
          >
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="mb-1 border-b border-emerald-300/20 px-3 pb-2 text-xs font-medium uppercase tracking-wide text-emerald-200/80">
                {item.title}
              </div>
              <ul className="space-y-1">
              {item.items?.map((subItem) => (
                <li key={subItem.title}>
                  <Link
                    href={subItem.url}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium text-emerald-50 transition-colors hover:bg-emerald-500/20 hover:text-white",
                      pathname === subItem.url && "bg-emerald-500/30 text-white"
                    )}
                  >
                    {subItem.title}
                  </Link>
                </li>
              ))}
              </ul>
            </motion.div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }
  