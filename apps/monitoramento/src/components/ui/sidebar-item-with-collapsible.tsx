import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { NavItem } from "types";
import { SidebarMenuButton, SidebarMenuItem } from "./sidebar";
import { Icons } from "../icons";
import { cn } from "@/lib/utils";

export function SidebarItemWithCollapsible({ item, pathname }: {
  item: NavItem;
  pathname: string;
}) {
  const [open, setOpen] = useState(() =>
    item.items?.some((sub) => sub.url === pathname)
  );
  const Icon = item.icon ? Icons[item.icon] : Icons.logo;

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setOpen((prev) => !prev)}
          isActive={item.items?.some((sub) => sub.url === pathname)}
        >
          {item.icon && <Icon />}
            <span className="flex-1 text-left text-sidebar">{item.title}</span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 sidebar-foreground" />
          </motion.span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-6 overflow-hidden space-y-1"
          >
            {item.items?.map((subItem) => (
              <li key={subItem.title}>
                <Link
                  href={subItem.url}
                  className={cn('block px-3 py-2 rounded-md text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground', 
                    pathname === subItem.url && "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                  )}
                >
                  {subItem.title}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </>
  );
}
