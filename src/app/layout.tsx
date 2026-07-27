import type { Metadata, Viewport } from 'next';
import '../index.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'BNFix | Benefícios que fazem sentido',
    template: '%s | BNFix',
  },
  description: 'Gestão simples de colaboradores, benefícios e parcerias para empresas.',
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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f5f2ea',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
