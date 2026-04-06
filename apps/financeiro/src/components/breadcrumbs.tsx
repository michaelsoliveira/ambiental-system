import Link from 'next/link';

import { OrganizationSwitcher } from '@/components/organization-switcher';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';

import { BreadcrumbsClient } from './breadcrumbs-client';

export async function Breadcrumbs() {
  return (
    <BreadcrumbsClient organizationSwitcher={<OrganizationSwitcher />} />
  );
}