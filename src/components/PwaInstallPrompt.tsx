'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'bnfix_pwa_dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isIos(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

function wasDismissedRecently(): boolean {
  const dismissed = localStorage.getItem(DISMISS_KEY);
  return Boolean(dismissed && Date.now() - Number(dismissed) < DISMISS_DURATION_MS);
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIos, setShowIos] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (wasDismissedRecently()) return;

    // iOS: show custom guide since beforeinstallprompt doesn't exist
    if (isIos()) {
      setTimeout(() => setShowIos(true), 3000);
      return;
    }

    // Android/Chrome: listen for the native install prompt
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setTimeout(() => setShowAndroid(true), 3000);
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
        setShowAndroid(false);
        setDeferredPrompt(null);
      }
    } catch {
      // User cancelled or error
    } finally {
      setInstalling(false);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowAndroid(false);
    setShowIos(false);
    setDeferredPrompt(null);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  // Nothing to show
  if (!showAndroid && !showIos) return null;

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

      {/* Android: native install button */}
      {showAndroid && (
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
      )}

      {/* iOS: step-by-step guide */}
      {showIos && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-[var(--surface-muted)] p-3">
            <ol className="space-y-2.5 text-xs leading-5 text-[var(--ink)]">
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[10px] font-bold text-white">1</span>
                <span>
                  Toque no ícone{' '}
                  <Share className="inline-block h-3.5 w-3.5 text-[var(--brand)]" aria-label="Compartilhar" />{' '}
                  <strong>Compartilhar</strong> na barra do Safari
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[10px] font-bold text-white">2</span>
                <span>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[10px] font-bold text-white">3</span>
                <span>Confirme tocando em <strong>"Adicionar"</strong></span>
              </li>
            </ol>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)]"
          >
            Entendi
          </button>
        </div>
      )}
    </div>
  );
}
