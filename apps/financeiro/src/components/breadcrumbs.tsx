import Link from 'next/link';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import { OrganizationSwitcher } from '@/components/organization-switcher';
import { BreadcrumbsClient } from './breadcrumbs-client';

export async function Breadcrumbs() {
  return (
    <BreadcrumbsClient organizationSwitcher={<OrganizationSwitcher />} />
  );
}