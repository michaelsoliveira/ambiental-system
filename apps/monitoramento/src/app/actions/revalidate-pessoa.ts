'use server'

import { revalidateTag } from 'next/cache'

export async function revalidatePessoaTag(tag: string) {
  revalidateTag(tag)
}
