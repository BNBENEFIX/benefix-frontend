'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
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

const formatDate = (value?: string) => value
  ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value))
  : 'Sem data de expiração';

const apiMessage = (error: unknown) => {
  const candidate = error as { response?: { data?: { message?: string } } };
  return candidate?.response?.data?.message ?? 'Não foi possível concluir a operação.';
};

export function SharedBenefitsHub() {
  const { user } = useAuth();
  const [mine, setMine] = useState<SharedBenefit[]>([]);
  const [available, setAvailable] = useState<SharedBenefit[]>([]);
  const [requests, setRequests] = useState<SharedBenefitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
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
      setMessage(apiMessage(error));
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
    const update = () => setSeconds(Math.max(0, Math.floor((new Date(qr.value.expiresAt).getTime() - Date.now()) / 1000)));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [qr]);

  const requestStatus = useMemo(() => new Map(requests.map((item) => [item.benefitId, item])), [requests]);

  const handleRequest = async (benefitId: number) => {
    setBusyId(benefitId);
    setMessage('');
    try {
      await sharedBenefitService.request(benefitId);
      setMessage('Solicitação enviada ao estabelecimento.');
      await load(true);
    } catch (error) {
      setMessage(apiMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const showQr = async (benefit: SharedBenefit) => {
    if (!benefit.subscriptionId) return;
    setBusyId(benefit.id);
    setMessage('');
    try {
      const value = await sharedBenefitService.issueToken(benefit.subscriptionId);
      setQr({ benefit, value });
    } catch (error) {
      setMessage(apiMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center bg-[#f6f5f1]">
        <RefreshCw className="h-6 w-6 animate-spin text-[#23664e]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f5f1] px-5 py-8 text-[#17201c] sm:px-8">
      <div className="mx-auto max-w-[1240px] space-y-10">
        <header className="flex flex-col justify-between gap-5 border-b border-[#d9ddd8] pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#2f7a5c]">Área do usuário</p>
            <h1 className="mt-3 font-display text-4xl tracking-[-.035em] sm:text-5xl">
              Olá, {user?.name?.split(' ')[0]}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66716b]">
              Seus benefícios aprovados e novas oportunidades de empresas parceiras estão reunidos aqui.
            </p>
          </div>
          <button onClick={() => load()} className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-[#cfd5d0] bg-white px-4 text-xs font-semibold hover:bg-[#f0f3ef]">
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </button>
        </header>

        {message && (
          <div role="status" className="rounded-lg border border-[#cbd9d0] bg-[#edf5f0] px-4 py-3 text-sm text-[#194b3a]">
            {message}
          </div>
        )}

        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#2f7a5c]">Liberados</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-.025em]">Meus benefícios</h2>
            </div>
            <span className="text-xs text-[#7a857f]">{mine.length} disponíveis</span>
          </div>

          {mine.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#cbd1cc] bg-white/50 p-10 text-center text-sm text-[#66716b]">
              Seus benefícios aprovados aparecerão aqui.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {mine.map((benefit) => (
                <article key={benefit.id} className="flex min-h-64 flex-col rounded-xl border border-[#d9ddd8] bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e6efe9] text-[#194b3a]">
                      <TicketCheck className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-[#edf5f0] px-2.5 py-1 text-[10px] font-semibold text-[#23664e]">Aprovado</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-[-.02em]">{benefit.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[#66716b]"><Store className="h-3.5 w-3.5" /> {benefit.providerName}</p>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#66716b]">{benefit.description}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#edf0ec] pt-4">
                    <span className="text-[11px] text-[#7a857f]">{formatDate(benefit.validUntil)}</span>
                    <button
                      onClick={() => showQr(benefit)}
                      disabled={busyId === benefit.id}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#194b3a] px-3.5 text-xs font-semibold text-white hover:bg-[#12372a] disabled:opacity-60"
                    >
                      <QrCode className="h-4 w-4" /> Usar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#2f7a5c]">Compartilhados</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.025em]">Benefícios de outras empresas</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {available.map((benefit) => {
              const request = requestStatus.get(benefit.id);
              const pending = benefit.accessStatus === 'PENDING' || request?.status === 'PENDING';
              const rejected = benefit.accessStatus === 'REJECTED' || request?.status === 'REJECTED';
              return (
                <article key={benefit.id} className="flex min-h-64 flex-col rounded-xl border border-[#d9ddd8] bg-[#efeee9] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#194b3a]">
                      <Building2 className="h-5 w-5" />
                    </span>
                    {pending && <span className="rounded-full bg-[#fff5df] px-2.5 py-1 text-[10px] font-semibold text-[#8a6118]">Pendente</span>}
                    {rejected && <span className="rounded-full bg-[#fbe9e6] px-2.5 py-1 text-[10px] font-semibold text-[#a33f35]">Recusado</span>}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-[-.02em]">{benefit.name}</h3>
                  <p className="mt-1 text-xs text-[#66716b]">{benefit.providerName}</p>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#66716b]">{benefit.description}</p>
                  <button
                    onClick={() => handleRequest(benefit.id)}
                    disabled={pending || busyId === benefit.id}
                    className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#bfc8c1] bg-white px-4 text-xs font-semibold text-[#194b3a] hover:border-[#194b3a] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {busyId === benefit.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : pending ? <Clock3 className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                    {pending ? 'Aguardando aprovação' : rejected ? 'Solicitar novamente' : 'Solicitar benefício'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Minhas solicitações</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-[#d9ddd8] bg-white">
            {requests.length === 0 ? (
              <p className="p-6 text-sm text-[#66716b]">Você ainda não fez solicitações.</p>
            ) : requests.map((request) => (
              <div key={request.id} className="grid gap-2 border-b border-[#edf0ec] p-4 last:border-0 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="text-sm font-semibold">{request.benefitName}</div>
                  <div className="mt-1 text-xs text-[#7a857f]">{request.providerName} · {formatDate(request.requestedAt)}</div>
                </div>
                <span className={`text-xs font-semibold ${request.status === 'APPROVED' ? 'text-[#23664e]' : request.status === 'REJECTED' ? 'text-[#a33f35]' : 'text-[#8a6118]'}`}>
                  {request.status === 'APPROVED' ? 'Aprovada' : request.status === 'REJECTED' ? 'Recusada' : 'Pendente'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {qr && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0d1a14]/75 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="qr-title" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#2f7a5c]">Código temporário</p>
                <h2 id="qr-title" className="mt-2 text-xl font-semibold">{qr.benefit.name}</h2>
                <p className="mt-1 text-xs text-[#66716b]">{qr.benefit.providerName}</p>
              </div>
              <button onClick={() => setQr(null)} aria-label="Fechar QR Code" className="rounded-lg p-2 text-[#66716b] hover:bg-[#f0f2ef]"><X className="h-4 w-4" /></button>
            </div>
            <div className="mx-auto mt-6 w-fit rounded-xl border border-[#e0e4df] bg-white p-4">
              <QRCodeSVG value={qr.value.redemptionUrl} size={220} level="M" />
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-[#194b3a]">
              {seconds > 0 ? <Clock3 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4 text-[#a33f35]" />}
              {seconds > 0 ? `Expira em ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : 'Código expirado'}
            </div>
            <p className="mt-3 text-center text-xs leading-5 text-[#7a857f]">Apresente este código somente no estabelecimento responsável.</p>
            {seconds === 0 && (
              <button onClick={() => showQr(qr.benefit)} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#194b3a] text-xs font-semibold text-white">
                <RefreshCw className="h-3.5 w-3.5" /> Gerar novo código
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
