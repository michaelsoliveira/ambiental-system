import { AnimatePresence,motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { NavItem } from "@/types";

import { Icons } from "../icons";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";

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
          className={cn(
            "transition-all duration-200",
            item.items?.some((sub) => sub.url === pathname)
              ? "bg-emerald-500/25 text-emerald-100 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-emerald-400 before:rounded-r-sm shadow-sm"
              : "text-emerald-50/85 hover:bg-emerald-500/10 hover:text-emerald-100",
          )}
        >
          {item.icon && <Icon />}
          <span className="flex-1 text-left">{item.title}</span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-emerald-100/90" />
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
                  className={cn('relative transition-all duration-200 block text-emerald-50/85 px-3 py-2 rounded-md text-sm hover:bg-emerald-500/10 hover:text-emerald-100',
                    pathname === subItem.url && "bg-emerald-500/20 text-emerald-100 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-emerald-400 before:rounded-l-sm shadow-sm"
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
