import { ability, getCurrentOrg } from '@/auth/auth'
import { getParceiros } from '@/http/parceiro/get-parceiros'

import { ParceiroListingClient } from './parceiro-listing-client'

export async function ParceiroListing() {
  const currentOrg = await getCurrentOrg()
  const { parceiros } = await getParceiros(currentOrg!)
  const permissions = await ability()
  const canUpdate = permissions?.can('update', 'Parceiro') ?? false
  const canDelete = permissions?.can('delete', 'Parceiro') ?? false

  return (
    <ParceiroListingClient
      parceiros={parceiros}
      canUpdate={canUpdate}
      canDelete={canDelete}
    />
  )
}
