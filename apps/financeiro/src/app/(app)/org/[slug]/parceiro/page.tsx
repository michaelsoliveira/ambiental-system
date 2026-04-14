import { Plus } from 'lucide-react'
import Link from 'next/link'

import { ability, getCurrentOrg } from '@/auth/auth'
import { Button } from '@/components/ui/button'
import { ParceiroListing } from '@/features/parceiro/parceiro-listing'

export default async function Projects() {
  const currentOrg = await getCurrentOrg()
  const permissions = await ability()

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Parceiros</h1>

        {permissions?.can('create', 'Parceiro') && (
          <Button className='rounded-full shadow-md' size="sm" asChild>
            <Link href={`/org/${currentOrg}/create-parceiro`}>
              <Plus className="mr-2 size-4" />
              Novo Parceiro
            </Link>
          </Button>
        )}
      </div>

      {permissions?.can('get', 'Parceiro') ? (
        <ParceiroListing
          orgSlug={currentOrg!}
          canUpdate={permissions?.can('update', 'Parceiro') ?? false}
          canDelete={permissions?.can('delete', 'Parceiro') ?? false}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          You are not allowed to see organization parceiros.
        </p>
      )}
    </div>
  )
}