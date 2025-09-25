'use client'

import { Role } from '@saas/auth'
import { SelectSearch, OptionType } from '@/components/select-search'
import { updateMemberAction } from './member-actions'

interface UpdateMemberRoleSelectProps {
  memberId: string
  roles: Array<{id: string, name: string}>
  disabled?: boolean
  roleOptions?: OptionType[]
}

export function UpdateMemberRoleSelect({
  memberId,
  roles,
  disabled,
  roleOptions
}: UpdateMemberRoleSelectProps) {

  async function handleChange(selected: OptionType[] | null) {
    const newRoles = (selected ?? []).map((opt) => opt.value as Role)
    await updateMemberAction(memberId, newRoles)
  }

  return (
    <SelectSearch
      instanceId={`member-role-select-${memberId}`}
      isMulti
      placeholder="Select roles"
      defaultOptions={roleOptions}
      options={async () => roleOptions}
      value={roles.map((r) => ({
        label: r.name,
        value: r.id,
      }))}
      onChange={(value) => handleChange(value)}
      isDisabled={disabled}
      selectStyle="min-w-[180px]"
    />
  )
}
