'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasSession } from '../services/bnfixApi';

/**
 * Renderizado na landing pública (`/`). Se houver uma sessão ativa no navegador,
 * leva o usuário direto para a área logada (`/entrar`), que resolve a tela
 * correta conforme o perfil. Assim, quem já entrou não volta a ver o marketing.
 */
export function AuthenticatedRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (hasSession()) {
      router.replace('/entrar');
    }
  }, [router]);

  return null;
}
