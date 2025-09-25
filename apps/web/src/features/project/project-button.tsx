'use client'

import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

type ProjectButtonProps = {    
    projectSlug: string
}

export const ProjectButton = ( { projectSlug }: ProjectButtonProps ) => {
    const { slug: orgSlug } = useParams<{
      slug: string
    }>()

    return (
        <Link href={`/org/${orgSlug}/project/${projectSlug}`}
            className='border rounded-lg text-xs px-4 py-2 flex flex-row items-center'
        >
            <span className="line-clamp-1">Ver</span> <ArrowRight className="ml-2 size-3" />
        </Link>
    )
}