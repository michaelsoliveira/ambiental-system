'use server'

import { cookies } from 'next/headers'

export async function setPessoaCookie(pessoaId: string | null) {
  const cookieStore = await cookies();
  if (pessoaId) {
    cookieStore.set('pessoaId', pessoaId, {
      path: '/',
      maxAge: 60 * 60 * 24, // 1 dia
    });
  } else {
    cookieStore.delete('pessoaId');
  }
}
