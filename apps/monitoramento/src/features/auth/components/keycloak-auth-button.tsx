'use client';

import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { isOidcAuthMode } from '@/lib/auth-mode';

export default function KeycloakSignInButton() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  if (!isOidcAuthMode()) {
    return null
  }

  return (
    <Button
      className='w-full hover:cursor-pointer'
      type='button'
      onClick={() =>
        signIn('keycloak', { callbackUrl: callbackUrl ?? '/dashboard' })
      }
    >
      Entrar com SSO
    </Button>
  );
}
