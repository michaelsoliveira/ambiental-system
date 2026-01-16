'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type ParceiroButtonProps = {
  parceiroId: string
}

export const ParceiroButton = ({ parceiroId }: ParceiroButtonProps) => {
  const { slug: orgSlug } = useParams<{
    slug: string
  }>()

  return (
    <Link
      href={`/org/${orgSlug}/parceiro/${parceiroId}`}
      className="border rounded-lg text-xs px-4 py-2 flex flex-row items-center hover:bg-accent transition-colors"
    >
      <span className="line-clamp-1">Ver detalhes</span>
      <ArrowRight className="ml-2 size-3" />
    </Link>
  )
}