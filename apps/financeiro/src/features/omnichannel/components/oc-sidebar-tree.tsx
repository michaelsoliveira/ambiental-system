'use client';

import Link from 'next/link';
import { useEffect, useState, type ComponentType, type ReactNode, type SVGProps } from 'react';
import { ChevronDown, Pencil, Plus, Trash2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

type NavIcon = LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;

export type OcNavLink = {
  href: string;
  label: string;
  icon?: NavIcon;
  accentClass?: string;
  match?: (pathname: string, search: string) => boolean;
  onNavigate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export type OcNavGroup = {
  id: string;
  label: string;
  icon: NavIcon;
  items: OcNavLink[];
  defaultOpen?: boolean;
  footer?: ReactNode;
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavTreeItem({
  item,
  pathname,
  search,
  isLast,
}: {
  item: OcNavLink;
  pathname: string;
  search: string;
  isLast?: boolean;
}) {
  const active = item.match
    ? item.match(pathname, search)
    : isActive(pathname, item.href);
  const Icon = item.icon;

  const hasActions = Boolean(item.onEdit || item.onDelete);

  return (
    <li className={cn('group relative', !isLast && 'pb-0.5')}>
      <span
        className="pointer-events-none absolute -left-3 top-[15px] h-px w-3 bg-border/70"
        aria-hidden
      />
      <div
        className={cn(
          'flex w-full items-center justify-between rounded-md py-1.5 pl-2 pr-1 text-sm transition-colors',
          active
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )}
      >
        <Link
          href={item.href}
          onClick={item.onNavigate}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          {item.accentClass ? (
            <span className={cn('h-2 w-2 shrink-0 rounded-full', item.accentClass)} />
          ) : (
            Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
          )}
          <span className="truncate">{item.label}</span>
        </Link>
        {hasActions && (
          <div
            className={cn(
              'flex shrink-0 items-center gap-0.5 pl-1',
              active ? 'opacity-100' : 'opacity-0 transition-opacity group-hover:opacity-100',
            )}
          >
            {item.onEdit && (
              <button
                type="button"
                title="Editar inbox"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  item.onEdit?.();
                }}
                className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            {item.onDelete && (
              <button
                type="button"
                title="Excluir inbox"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  item.onDelete?.();
                }}
                className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function OcNavTree({
  items,
  pathname,
  search,
  footer,
}: {
  items: OcNavLink[];
  pathname: string;
  search: string;
  footer?: ReactNode;
}) {
  return (
    <div className="relative ml-3 border-l border-border/70 pl-3">
      <ul className="space-y-0.5">
        {items.map((item, idx) => (
          <NavTreeItem
            key={`${item.href}-${item.label}`}
            item={item}
            pathname={pathname}
            search={search}
            isLast={idx === items.length - 1 && !footer}
          />
        ))}
      </ul>
      {footer && (
        <div className="relative mt-0.5">
          <span
            className="pointer-events-none absolute -left-3 top-[15px] h-px w-3 bg-border/70"
            aria-hidden
          />
          {footer}
        </div>
      )}
    </div>
  );
}

export function OcNavGroupSection({
  group,
  pathname,
  search,
}: {
  group: OcNavGroup;
  pathname: string;
  search: string;
}) {
  const groupActive = group.items.some((item) =>
    item.match ? item.match(pathname, search) : isActive(pathname, item.href),
  );
  const [open, setOpen] = useState(group.defaultOpen ?? groupActive);
  const Icon = group.icon;

  useEffect(() => {
    if (groupActive) setOpen(true);
  }, [groupActive]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors',
          groupActive ? 'text-foreground' : 'text-muted-foreground hover:bg-accent/60',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 font-semibold">{group.label}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1">
        <OcNavTree
          items={group.items}
          pathname={pathname}
          search={search}
          footer={group.footer}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

export function OcNovaInboxButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <Plus className="h-3.5 w-3.5 shrink-0" />
      <span>Nova inbox</span>
    </button>
  );
}
