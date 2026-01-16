'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';

interface BreadcrumbsClientProps {
  organizationSwitcher: ReactNode;
}

export function BreadcrumbsClient({ organizationSwitcher }: BreadcrumbsClientProps) {
  const breadcrumbs: any = useBreadcrumbs();

  return (
    <div className="flex items-center gap-2">
      {breadcrumbs.map((crumb: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          {crumb?.isOrganizationSwitcher ? (
            organizationSwitcher
          ) : (
            <Link
              href={crumb.link}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {crumb.title}
            </Link>
          )}
          {index < breadcrumbs.length - 1 && (
            <span className="text-muted-foreground">/</span>
          )}
        </div>
      ))}
    </div>
  );
}