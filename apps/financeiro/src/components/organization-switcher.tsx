import { ChevronsUpDown, PlusCircle } from 'lucide-react'
import Link from 'next/link'

import { getCurrentOrg, isAuthenticated } from '@/auth/auth'
import { getOrganizations } from '@/http/get-organizations'

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export async function OrganizationSwitcher() {
  const currentOrg = await getCurrentOrg()
  const authenticated = await isAuthenticated()

  let organizations: { id: string; name: string; slug: string; avatarUrl: string | null }[] = []
  
  if (authenticated) {
    try {
      const result = await getOrganizations()
      organizations = result.organizations || []
    } catch (error) {
      console.error('[OrganizationSwitcher] ❌ Erro ao carregar organizações:', error)
      // Continuar com array vazio para não quebrar a aplicação
    }
  }

  const currentOrganization = organizations.find(
    (org) => org.slug === currentOrg,
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-[250px] items-center gap-2 rounded p-1 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary">
        {currentOrganization ? (
          <>
            <Avatar className="size-4">
              {currentOrganization.avatarUrl && (
                <AvatarImage src={currentOrganization.avatarUrl} />
              )}
              <AvatarFallback />
            </Avatar>
            <span className="truncate text-left">
              {currentOrganization.name}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">Selecione uma organização</span>
        )}
        <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        // alignOffset={-16}
        // sideOffset={12}
        className="w-[250px]"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Organizações</DropdownMenuLabel>
          {organizations.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              Nenhuma organização encontrada
            </div>
          ) : (
            organizations.map((organization) => {
              return (
                <DropdownMenuItem key={organization.id} asChild>
                  <Link href={`/org/${organization.slug}`}>
                    <Avatar className="mr-2 size-4">
                      {organization.avatarUrl && (
                        <AvatarImage src={organization.avatarUrl} />
                      )}
                      <AvatarFallback />
                    </Avatar>
                    <span className="line-clamp-1">{organization.name}</span>
                  </Link>
                </DropdownMenuItem>
              )
            })
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/create-organization">
            <PlusCircle className="mr-2 size-4" />
            Nova organização
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}