import type { Metadata, Viewport } from 'next';
import '../index.css';
import { ServiceWorkerRegistration } from '../components/ServiceWorkerRegistration';
import { PwaInstallPrompt } from '../components/PwaInstallPrompt';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'BNFix | Benefícios que fazem sentido',
    template: '%s | BNFix',
  },
  description: 'Gestão simples de colaboradores, benefícios e parcerias para empresas.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BNFix',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'BNFix | Benefícios que fazem sentido',
    description: 'Gestão simples de colaboradores, benefícios e parcerias para empresas.',
    type: 'website',
    locale: 'pt_BR',
    images: [{ url: '/og.png', width: 1732, height: 908, alt: 'BNFix — Benefícios que fazem sentido' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BNFix | Benefícios que fazem sentido',
    description: 'Gestão simples de colaboradores, benefícios e parcerias para empresas.',
    images: ['/og.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#194b3a' },
    { media: '(prefers-color-scheme: dark)', color: '#111713' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BNFix" />
      </head>
      <body>
        {children}
        <PwaInstallPrompt />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
