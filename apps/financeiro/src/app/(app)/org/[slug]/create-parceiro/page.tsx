import { redirect } from 'next/navigation'

import { ability } from '@/auth/auth'
import { ParceiroForm } from '@/features/parceiro/parceiro-form'

export default async function CreateParceiro() {
  const permissions = await ability()

  if (permissions?.cannot('create', 'Parceiro')) {
    redirect('/')
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Novo Parceiro</h1>
      <ParceiroForm />
    </div>
  )
}