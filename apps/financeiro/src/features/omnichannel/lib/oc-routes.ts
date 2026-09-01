'use client'

import { useParams } from 'next/navigation'

/** Base path do omnichannel no App Router do financeiro. */
export function ocBasePath(slug: string) {
  return `/org/${slug}/omnichannel`
}

export function ocHref(slug: string, path = '') {
  const base = ocBasePath(slug)
  if (!path) return base
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`
}

/** Hook — slug vem de /org/[slug]/omnichannel/... */
export function useOcBasePath() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  return {
    slug,
    base: slug ? ocBasePath(slug) : '/omnichannel',
    href: (path = '') => (slug ? ocHref(slug, path) : path),
  }
}
