import { auth } from '@/lib/auth';
import Providers from '@/components/layout/providers';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata, Viewport } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Inter } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';
import { ClientWrapper } from '@/components/client-wrapper';

const APP_NAME = "SMCA";
const APP_DEFAULT_TITLE = "Sistema de Monitoramento de Condicionantes Ambientais";
const APP_TITLE_TEMPLATE = "%s - Ambiental";
const APP_DESCRIPTION = "Sistema para monitoramento das condicionantes ambientais";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap'
});

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang='en' 
    className={`${inter.className}`} 
    suppressHydrationWarning>
      <meta name="apple-mobile-web-app-title" content="Licenças" />
      <body className='overflow-hidden'>
        <NextTopLoader showSpinner={false} />
        <NuqsAdapter>
            <Providers session={session}>
              <ClientWrapper />
              <AuthProvider>
                <Toaster />
                {children}
              </AuthProvider>
            </Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
