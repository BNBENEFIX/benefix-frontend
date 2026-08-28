'use client';

import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Store,
  TicketCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { sharedBenefitService } from '../services/sharedBenefitService';
import type { EmployeeBenefitResponse, RedemptionToken } from '../types';

type FeedbackKind = 'success' | 'error' | 'info';

interface Feedback {
  kind: FeedbackKind;
  title: string;
  detail: string;
}

const formatDate = (value?: string) => value
  ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value))
  : 'Sem data de expiração';

const apiMessage = (error: unknown) => {
  const candidate = error as { response?: { data?: { message?: string } } };
  return candidate?.response?.data?.message ?? 'Tente novamente em instantes.';
};

const issueTokenError = (error: unknown): Feedback => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 403) {
    return {
      kind: 'error',
      title: 'Benefício indisponível',
      detail: 'Este benefício não está mais disponível para você. A parceria da sua empresa pode ter sido desativada.',
    };
  }
  if (status === 409 || status === 400) {
    return {
      kind: 'error',
      title: 'Limite de uso atingido',
      detail: apiMessage(error),
    };
  }
  return {
    kind: 'error',
    title: 'Não foi possível gerar o QR Code',
    detail: apiMessage(error),
  };
};

const feedbackClasses: Record<FeedbackKind, string> = {
  success: 'border-[#b9d7c6] bg-[#edf8f1] text-[#235c46]',
  error: 'border-[#efc2bc] bg-[#fff1ef] text-[#8f3730]',
  info: 'border-[#ead4a8] bg-[#fff8e9] text-[#815a19]',
};

export function SharedBenefitsHub() {
  const { user } = useAuth();
  const [benefits, setBenefits] = useState<EmployeeBenefitResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [qr, setQr] = useState<{ benefit: EmployeeBenefitResponse; value: RedemptionToken } | null>(null);
  const [seconds, setSeconds] = useState(0);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const myBenefits = await sharedBenefitService.getMyBenefits();
      setBenefits(myBenefits);
    } catch (error) {
      if (!silent) {
        setFeedback({
          kind: 'error',
          title: 'Não foi possível carregar seus benefícios',
          detail: apiMessage(error),
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = window.setInterval(() => load(true), 15_000);
    return () => window.clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!qr) return;
    const update = () => {
      const remaining = new Date(qr.value.expiresAt).getTime() - Date.now();
      setSeconds(Math.max(0, Math.floor(remaining / 1000)));
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [qr]);

  const showQr = async (benefit: EmployeeBenefitResponse) => {
    setBusyId(benefit.benefitId);
    setFeedback(null);
    try {
      const value = await sharedBenefitService.issueToken(benefit.benefitId);
      setQr({ benefit, value });
    } catch (error) {
      setFeedback(issueTokenError(error));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div
        role="status"
        className="flex min-h-[560px] flex-col items-center justify-center bg-[#f5f6f2] px-6 text-center"
      >
        <Loader2 className="h-9 w-9 animate-spin text-[#2f7658]" />
        <h1 className="mt-5 text-xl font-semibold text-[#18211d]">Abrindo seus benefícios</h1>
        <p className="mt-2 text-sm text-[#68746d]">Isso pode levar alguns segundos.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f2] px-3 py-5 text-[#18211d] sm:px-6 sm:py-9">
      <div className="mx-auto max-w-[1180px]">
        <header className="flex flex-col gap-4 border-b border-[#d8dfda] pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-5 sm:pb-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#2f7658]">
              Seus benefícios
            </p>
            <h1 className="mt-2 font-display text-2xl tracking-[-.03em] sm:mt-3 sm:text-3xl md:text-4xl">
              Olá, {user?.name?.split(' ')[0]}.
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-[#68746d] sm:mt-2">
              Escolha um benefício e mostre o QR Code no local de atendimento.
            </p>
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-[#cfd8d2] bg-white px-3 text-sm font-semibold text-[#536159] hover:bg-[#f0f3ef] sm:h-11 sm:px-4"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        </header>

        {feedback && (
          <div
            role={feedback.kind === 'error' ? 'alert' : 'status'}
            className={`mt-6 flex items-start gap-3 rounded-xl border p-4 ${feedbackClasses[feedback.kind]}`}
          >
            {feedback.kind === 'error'
              ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
            <div>
              <div className="text-sm font-semibold">{feedback.title}</div>
              <div className="mt-1 text-sm leading-5 opacity-85">{feedback.detail}</div>
            </div>
          </div>
        )}

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-.02em]">Disponíveis para você</h2>
              <p className="mt-1 text-sm text-[#68746d]">Toque no botão para abrir o QR Code.</p>
            </div>
            <span className="shrink-0 text-xs font-medium text-[#76827b]">
              {benefits.length} {benefits.length === 1 ? 'benefício' : 'benefícios'}
            </span>
          </div>

          {benefits.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#c8d1cb] bg-white/60 p-8 sm:p-10">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7efe9] text-[#2f7658]">
                <TicketCheck className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">Nenhum benefício liberado ainda</h3>
              <p className="mt-2 max-w-lg text-sm leading-6 text-[#68746d]">
                Os benefícios aparecem aqui automaticamente quando a sua empresa tem uma
                parceria ativa com o estabelecimento.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {benefits.map((benefit) => {
                const noUsesLeft = benefit.remainingUses <= 0;
                return (
                  <article
                    key={benefit.benefitId}
                    className="flex flex-col rounded-2xl border border-[#d5ddd8] bg-white p-4 shadow-[0_8px_30px_rgba(23,63,50,.05)] sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7efe9] text-[#2f7658]">
                        <TicketCheck className="h-5 w-5" />
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        noUsesLeft
                          ? 'bg-[#f2f3f0] text-[#68746d]'
                          : 'bg-[#edf8f1] text-[#2f7658]'
                      }`}>
                        {noUsesLeft
                          ? 'Limite atingido'
                          : `${benefit.remainingUses} de ${benefit.maxUsesPerUser} ${benefit.maxUsesPerUser === 1 ? 'uso' : 'usos'}`}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold tracking-[-.015em]">{benefit.benefitName}</h3>
                    <p className="mt-2 flex items-center gap-2 text-sm text-[#68746d]">
                      <Store className="h-4 w-4 shrink-0" />
                      {benefit.providerName}
                    </p>
                    {benefit.description && (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#68746d]">
                        {benefit.description}
                      </p>
                    )}
                    {benefit.categories.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {benefit.categories.map((category) => (
                          <span
                            key={category.id}
                            className="rounded-full border border-[#dce3de] px-2.5 py-0.5 text-xs text-[#536159]"
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {benefit.terms && (
                      <details className="group mt-3">
                        <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-[#536159]">
                          Termos de uso
                          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                        </summary>
                        <p className="mt-2 text-xs leading-5 text-[#68746d]">{benefit.terms}</p>
                      </details>
                    )}
                    <div className="mt-5 border-t border-[#edf0ed] pt-4">
                      <p className="mb-3 text-xs text-[#76827b]">
                        {benefit.validUntil
                          ? `Válido até ${formatDate(benefit.validUntil)}`
                          : 'Sem data de expiração'}
                      </p>
                      <button
                        type="button"
                        onClick={() => showQr(benefit)}
                        disabled={busyId === benefit.benefitId || noUsesLeft}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173f32] px-4 text-sm font-semibold text-white hover:bg-[#102e25] disabled:opacity-60"
                      >
                        {busyId === benefit.benefitId
                          ? <Loader2 className="h-5 w-5 animate-spin" />
                          : <QrCode className="h-5 w-5" />}
                        {busyId === benefit.benefitId
                          ? 'Gerando QR Code...'
                          : noUsesLeft
                            ? 'Limite de uso atingido'
                            : 'Mostrar QR Code'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {qr && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#0d1a14]/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-title"
            className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                  seconds > 0
                    ? 'bg-[#edf8f1] text-[#2f7658]'
                    : 'bg-[#fff1ef] text-[#9d3d35]'
                }`}>
                  {seconds > 0
                    ? <ShieldCheck className="h-4 w-4" />
                    : <AlertTriangle className="h-4 w-4" />}
                  {seconds > 0 ? 'Pronto para apresentar' : 'QR Code expirado'}
                </div>
                <h2 id="qr-title" className="mt-3 text-xl font-semibold text-[#18211d]">
                  {qr.benefit.benefitName}
                </h2>
                <p className="mt-1 text-sm text-[#68746d]">{qr.benefit.providerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setQr(null)}
                aria-label="Fechar QR Code"
                className="rounded-lg p-2 text-[#68746d] hover:bg-[#f0f2ef]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={`mx-auto mt-6 w-fit rounded-2xl border bg-white p-4 ${
              seconds > 0 ? 'border-[#dce3de]' : 'border-[#e7c3be] opacity-25'
            }`}>
              <QRCodeSVG value={qr.value.redemptionUrl} size={220} level="M" />
            </div>

            <div
              role="status"
              className={`mt-5 rounded-xl p-4 text-center ${
                seconds > 0 ? 'bg-[#f0f6f2] text-[#173f32]' : 'bg-[#fff1ef] text-[#9d3d35]'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-base font-semibold">
                <Clock3 className="h-5 w-5" />
                {seconds > 0
                  ? `Expira em ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
                  : 'Este código não pode mais ser usado'}
              </div>
              <p className="mt-2 text-sm leading-5 opacity-80">
                {seconds > 0
                  ? 'Mostre esta tela à pessoa que fará a confirmação.'
                  : 'Gere outro QR Code para continuar.'}
              </p>
            </div>

            {seconds > 0 && (
              <details className="group mt-4 rounded-xl border border-[#dce3de]">
                <summary className="flex cursor-pointer list-none items-center justify-between p-3 text-xs font-semibold text-[#536159]">
                  Digitar código manualmente
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-[#edf0ed] p-3">
                  <code className="block break-all font-mono text-xs leading-5 text-[#536159]">
                    {qr.value.token}
                  </code>
                </div>
              </details>
            )}

            {seconds === 0 && (
              <button
                type="button"
                onClick={() => showQr(qr.benefit)}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173f32] text-sm font-semibold text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Gerar novo QR Code
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
