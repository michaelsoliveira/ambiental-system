// middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt'

// Mapeamento de rotas para permissões
const routePermissionsMap: Record<string, string> = {
  '/monitoramento': 'modulo:monitoramento',
  '/dashboard': 'modulo:monitoramento',
  '/manejo-florestal': 'modulo:manejo',
  '/medicina-seguranca': 'modulo:medicina',
}

const protectedPrefixes = Object.keys(routePermissionsMap)

export async function middleware(request: NextRequest) {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const pathname = request.nextUrl.pathname;


  // Verifica se a rota está entre as protegidas
  const matchedPrefix = protectedPrefixes.find(prefix =>
    pathname.startsWith(prefix)
  )

  if (!matchedPrefix) {
    return NextResponse.next()
  }

  if (!session || !session?.user?.permissions) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const userPermissions: string[] = session?.user?.permissions.map((permiss: { id: string, name: string }) => permiss.name)

  // Verifica se o usuário tem a permissão exigida
  const requiredPermission = routePermissionsMap[matchedPrefix]

  if (!userPermissions.includes(requiredPermission)) {
    return NextResponse.redirect(new URL('/403', request.url))
  }

  if (isLoggedIn && (pathname === '/' || pathname === '/auth' || pathname === '/auth/login')) {
    return NextResponse.redirect(new URL('/selecionar-modulo', request.url));
  }

  if (!isLoggedIn && (pathname.startsWith('/dashboard') || pathname.startsWith('/manejo-florestal') || pathname.startsWith('/medicina-seguranca') || pathname.startsWith('/monitoramento'))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/', 
    '/auth/:path*', 
    '/dashboard/:path*',
    '/monitoramento/:path*',
    '/manejo-florestal/:path*',
    '/medicina-seguranca/:path*',
  ],
};
