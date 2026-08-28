'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'bnfix_pwa_dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if ((navigator as any).standalone === true) return;

    // Don't show if recently dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < DISMISS_DURATION_MS) return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      // Small delay so it doesn't flash on page load
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setVisible(false);
        setDeferredPrompt(null);
      }
    } catch {
      // User cancelled or error
    } finally {
      setInstalling(false);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDeferredPrompt(null);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  if (!visible) return null;

  return (
    <div
      role="banner"
      aria-label="Instalar aplicativo"
      className="fixed bottom-4 left-3 right-3 z-[90] mx-auto max-w-md animate-[slideUp_0.4s_ease-out] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_20px_60px_rgba(0,0,0,.18)] sm:bottom-6 sm:left-6 sm:right-auto sm:p-5"
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
          <Download className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--ink)]">
            Instalar BNFix
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Acesse mais rápido direto da tela inicial do seu celular.
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-1 rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)]"
        >
          Agora não
        </button>
        <button
          type="button"
          onClick={handleInstall}
          disabled={installing}
          className="flex-[1.5] rounded-xl bg-[var(--action)] px-4 py-2.5 text-sm font-semibold text-[var(--action-ink)] hover:bg-[var(--action-hover)] disabled:opacity-60"
        >
          {installing ? 'Instalando...' : 'Instalar'}
        </button>
      </div>
    </div>
  );
}
