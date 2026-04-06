"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils"; // caso use shadcn utils

export function SidebarMenuItem({ item }: { item: any }) {
  const pathname = usePathname();

  return (
    <Link
      href={item.url}
      data-active={pathname === item.url}
      className={cn(
        "peer/menu-button flex w-full items-center gap-2 overflow-hidden p-2 transition-all duration-200 rounded-md",
        pathname === item.url
          ? "bg-[var(--sidebar-accent)]/30 text-[var(--sidebar-primary)] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[var(--sidebar-primary)] before:rounded-r-sm shadow-sm"
          : "hover:bg-[var(--sidebar-accent)]/20 text-[var(--muted-foreground)]"
      )}
    >
      {item.icon && <item.icon className="w-4 h-4" />}
      <span>{item.title}</span>
    </Link>
  );
}
SidebarMenuItem.displayName = "SidebarMenuItem";

// Exemplo de uso no AppSidebar
// import { SidebarMenuItem } from './sidebar-menu-item';
// ...
// <SidebarMenuItem item={item} />
// ...
