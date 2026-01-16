import { ability } from '@/auth/auth'
import { Invites } from '@/features/member/invites'
import { MemberListing } from '@/features/member/member-listings'

export default async function MembersPage() {
  const permissions = await ability()

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Members</h1>

      <div className="space-y-4">
        {permissions?.can('get', 'Invite') && <Invites />}
        {permissions?.can('get', 'User') && <MemberListing />}
      </div>
    </div>
  )
}