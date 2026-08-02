'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertTriangle,
  Building2,
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
import type { RedemptionToken, SharedBenefit, SharedBenefitRequest } from '../types';

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

const feedbackClasses: Record<FeedbackKind, string> = {
  success: 'border-[#b9d7c6] bg-[#edf8f1] text-[#235c46]',
  error: 'border-[#efc2bc] bg-[#fff1ef] text-[#8f3730]',
  info: 'border-[#ead4a8] bg-[#fff8e9] text-[#815a19]',
};

export function SharedBenefitsHub() {
  const { user } = useAuth();
  const [mine, setMine] = useState<SharedBenefit[]>([]);
  const [available, setAvailable] = useState<SharedBenefit[]>([]);
  const [requests, setRequests] = useState<SharedBenefitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [qr, setQr] = useState<{ benefit: SharedBenefit; value: RedemptionToken } | null>(null);
  const [seconds, setSeconds] = useState(0);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [myBenefits, shared, myRequests] = await Promise.all([
        sharedBenefitService.mine(),
        sharedBenefitService.available(),
        sharedBenefitService.myRequests(),
      ]);
      setMine(myBenefits);
      setAvailable(shared);
      setRequests(myRequests);
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

  const requestStatus = useMemo(
    () => new Map(requests.map((item) => [item.benefitId, item])),
    [requests],
  );

  const handleRequest = async (benefit: SharedBenefit) => {
    setBusyId(benefit.id);
    setFeedback(null);
    try {
      await sharedBenefitService.request(benefit.id);
      setFeedback({
        kind: 'success',
        title: 'Pedido enviado',
        detail: `O estabelecimento recebeu seu pedido para usar ${benefit.name}. Acompanhe a resposta nesta tela.`,
      });
      await load(true);
    } catch (error) {
      setFeedback({
        kind: 'error',
        title: 'Não foi possível enviar o pedido',
        detail: apiMessage(error),
      });
    } finally {
      setBusyId(null);
    }
  };

  const showQr = async (benefit: SharedBenefit) => {
    if (!benefit.subscriptionId) {
      setFeedback({
        kind: 'error',
        title: 'QR Code indisponível',
        detail: 'Atualize a página. Se o problema continuar, fale com o responsável da sua empresa.',
      });
      return;
    }

    setBusyId(benefit.id);
    setFeedback(null);
    try {
      const value = await sharedBenefitService.issueToken(benefit.subscriptionId);
      setQr({ benefit, value });
    } catch (error) {
      setFeedback({
        kind: 'error',
        title: 'Não foi possível gerar o QR Code',
        detail: apiMessage(error),
      });
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
    <div className="min-h-screen bg-[#f5f6f2] px-4 py-6 text-[#18211d] sm:px-6 sm:py-9">
      <div className="mx-auto max-w-[1180px]">
        <header className="flex flex-col gap-5 border-b border-[#d8dfda] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#2f7658]">
              Seus benefícios
            </p>
            <h1 className="mt-3 font-display text-3xl tracking-[-.03em] sm:text-4xl">
              Olá, {user?.name?.split(' ')[0]}.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#68746d]">
              Escolha um benefício e mostre o QR Code no local de atendimento.
            </p>
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg border border-[#cfd8d2] bg-white px-4 text-sm font-semibold text-[#536159] hover:bg-[#f0f3ef]"
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
              <h2 className="text-2xl font-semibold tracking-[-.02em]">Prontos para usar</h2>
              <p className="mt-1 text-sm text-[#68746d]">Toque no botão para abrir o QR Code.</p>
            </div>
            <span className="shrink-0 text-xs font-medium text-[#76827b]">
              {mine.length} {mine.length === 1 ? 'benefício' : 'benefícios'}
            </span>
          </div>

          {mine.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#c8d1cb] bg-white/60 p-8 sm:p-10">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7efe9] text-[#2f7658]">
                <TicketCheck className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">Nenhum benefício liberado ainda</h3>
              <p className="mt-2 max-w-lg text-sm leading-6 text-[#68746d]">
                Peça um benefício disponível abaixo. Quando o estabelecimento aprovar, ele
                aparecerá aqui.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {mine.map((benefit) => (
                <article
                  key={benefit.id}
                  className="flex flex-col rounded-2xl border border-[#d5ddd8] bg-white p-5 shadow-[0_8px_30px_rgba(23,63,50,.05)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7efe9] text-[#2f7658]">
                      <TicketCheck className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-[#edf8f1] px-3 py-1 text-xs font-semibold text-[#2f7658]">
                      Liberado
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-[-.015em]">{benefit.name}</h3>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[#68746d]">
                    <Store className="h-4 w-4 shrink-0" />
                    {benefit.providerName}
                  </p>
                  {benefit.description && (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#68746d]">
                      {benefit.description}
                    </p>
                  )}
                  <div className="mt-5 border-t border-[#edf0ed] pt-4">
                    <p className="mb-3 text-xs text-[#76827b]">{formatDate(benefit.validUntil)}</p>
                    <button
                      type="button"
                      onClick={() => showQr(benefit)}
                      disabled={busyId === benefit.id}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173f32] px-4 text-sm font-semibold text-white hover:bg-[#102e25] disabled:opacity-60"
                    >
                      {busyId === benefit.id
                        ? <Loader2 className="h-5 w-5 animate-spin" />
                        : <QrCode className="h-5 w-5" />}
                      {busyId === benefit.id ? 'Gerando QR Code...' : 'Mostrar QR Code'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12 border-t border-[#d8dfda] pt-9">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#2f7658]">
              Novas opções
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.02em]">
              Pedir outro benefício
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68746d]">
              Estes benefícios são oferecidos por empresas parceiras e precisam de aprovação.
            </p>
          </div>

          {available.length === 0 ? (
            <div className="rounded-2xl border border-[#d5ddd8] bg-white p-6 text-sm text-[#68746d]">
              Não há novos benefícios disponíveis no momento.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {available.map((benefit) => {
                const request = requestStatus.get(benefit.id);
                const pending = benefit.accessStatus === 'PENDING' || request?.status === 'PENDING';
                const rejected = benefit.accessStatus === 'REJECTED' || request?.status === 'REJECTED';

                return (
                  <article
                    key={benefit.id}
                    className="flex flex-col rounded-2xl border border-[#d8dfda] bg-[#eef1ed] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#2f7658]">
                        <Building2 className="h-5 w-5" />
                      </span>
                      {pending && (
                        <span className="rounded-full bg-[#fff5df] px-3 py-1 text-xs font-semibold text-[#815a19]">
                          Aguardando resposta
                        </span>
                      )}
                      {rejected && (
                        <span className="rounded-full bg-[#fff1ef] px-3 py-1 text-xs font-semibold text-[#9d3d35]">
                          Não aprovado
                        </span>
                      )}
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">{benefit.name}</h3>
                    <p className="mt-2 text-sm text-[#68746d]">{benefit.providerName}</p>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#68746d]">
                      {benefit.description}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRequest(benefit)}
                      disabled={pending || busyId === benefit.id}
                      className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#b9c8bf] bg-white px-4 text-sm font-semibold text-[#173f32] hover:border-[#2f7658] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyId === benefit.id && <Loader2 className="h-4 w-4 animate-spin" />}
                      {pending
                        ? 'Aguardando aprovação'
                        : rejected
                          ? 'Pedir novamente'
                          : 'Pedir benefício'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <details className="group mt-10 rounded-2xl border border-[#d5ddd8] bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-base font-semibold">
            Acompanhar pedidos
            <ChevronDown className="h-5 w-5 text-[#68746d] transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-[#edf0ed]">
            {requests.length === 0 ? (
              <p className="p-5 text-sm text-[#68746d]">Você ainda não fez nenhum pedido.</p>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="grid gap-2 border-b border-[#edf0ed] p-5 last:border-0 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <div className="text-sm font-semibold">{request.benefitName}</div>
                    <div className="mt-1 text-xs text-[#76827b]">
                      {request.providerName} · {formatDate(request.requestedAt)}
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${
                    request.status === 'APPROVED'
                      ? 'text-[#2f7658]'
                      : request.status === 'REJECTED'
                        ? 'text-[#a13e35]'
                        : request.status === 'CANCELLED'
                          ? 'text-[#68746d]'
                          : 'text-[#815a19]'
                  }`}>
                    {request.status === 'APPROVED'
                      ? 'Aprovado'
                      : request.status === 'REJECTED'
                        ? 'Não aprovado'
                        : request.status === 'CANCELLED'
                          ? 'Cancelado — empresa desativada'
                          : 'Aguardando resposta'}
                  </span>
                </div>
              ))
            )}
          </div>
        </details>
      </div>

      {qr && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#0d1a14]/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-title"
            className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-7"
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
                  {qr.benefit.name}
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
