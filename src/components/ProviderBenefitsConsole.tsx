'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Keyboard,
  Loader2,
  RefreshCw,
  RotateCcw,
  ScanLine,
  UserRound,
  X,
} from 'lucide-react';
import { sharedBenefitService } from '../services/sharedBenefitService';
import { partnershipService } from '../services/partnershipService';
import type { BackendPartnership, RedemptionPreview } from '../types';

type RedemptionState =
  | 'idle'
  | 'scanning'
  | 'checking'
  | 'ready'
  | 'confirming'
  | 'success'
  | 'error';

interface StatusMessage {
  title: string;
  detail: string;
}

interface RequestMessage extends StatusMessage {
  kind: 'success' | 'error';
}

const extractToken = (value: string) => {
  const clean = value.trim();
  try {
    const url = new URL(clean);
    return url.pathname.split('/').filter(Boolean).at(-1) ?? clean;
  } catch {
    return clean;
  }
};

const getApiMessage = (error: unknown, fallback: string) => {
  const candidate = error as { response?: { data?: { message?: string } } };
  return candidate.response?.data?.message ?? fallback;
};

export function ProviderBenefitsConsole() {
  const [partnerships, setPartnerships] = useState<BackendPartnership[]>([]);
  const [partnershipsLoading, setPartnershipsLoading] = useState(true);
  const [partnershipBusyId, setPartnershipBusyId] = useState<number | null>(null);
  const [partnershipMessage, setPartnershipMessage] = useState<RequestMessage | null>(null);

  const [token, setToken] = useState('');
  const [preview, setPreview] = useState<RedemptionPreview | null>(null);
  const [redemptionState, setRedemptionState] = useState<RedemptionState>('idle');
  const [redemptionMessage, setRedemptionMessage] = useState<StatusMessage | null>(null);
  const [manualEntry, setManualEntry] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const decodeLockedRef = useRef(false);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    decodeLockedRef.current = false;
  }, []);

  const loadPartnerships = useCallback(async () => {
    setPartnershipsLoading(true);
    try {
      setPartnerships(await partnershipService.providerPending());
    } catch {
      setPartnerships([]);
    } finally {
      setPartnershipsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPartnerships();
  }, [loadPartnerships]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const resetRedemption = () => {
    stopCamera();
    setToken('');
    setPreview(null);
    setRedemptionMessage(null);
    setManualEntry(false);
    setRedemptionState('idle');
  };

  const actOnPartnership = async (partnership: BackendPartnership, accepted: boolean) => {
    setPartnershipBusyId(partnership.id);
    setPartnershipMessage(null);
    try {
      if (accepted) {
        await partnershipService.accept(partnership.id);
      } else {
        await partnershipService.reject(partnership.id);
      }
      setPartnershipMessage({
        kind: 'success',
        title: accepted ? 'Parceria aceita' : 'Parceria recusada',
        detail: accepted
          ? `${partnership.clientCompanyName} já pode oferecer ${partnership.benefitName}.`
          : `A parceria com ${partnership.clientCompanyName} foi recusada.`,
      });
      await loadPartnerships();
    } catch (error) {
      setPartnershipMessage({
        kind: 'error',
        title: 'Não foi possível concluir',
        detail: getApiMessage(error, 'Tente novamente em instantes.'),
      });
    } finally {
      setPartnershipBusyId(null);
    }
  };

  const previewValue = useCallback(async (raw: string) => {
    const parsed = extractToken(raw);
    if (!parsed) return;

    stopCamera();
    setToken(parsed);
    setPreview(null);
    setRedemptionMessage(null);
    setRedemptionState('checking');

    try {
      const value = await sharedBenefitService.previewToken(parsed);
      setPreview(value);
      setRedemptionState('ready');
    } catch (error) {
      setRedemptionMessage({
        title: 'QR Code não aceito',
        detail: getApiMessage(
          error,
          'O código pode ter expirado ou já ter sido utilizado. Peça à pessoa para gerar um novo QR Code.',
        ),
      });
      setRedemptionState('error');
    }
  }, [stopCamera]);

  const startCamera = async () => {
    stopCamera();
    setManualEntry(false);
    setPreview(null);
    setRedemptionMessage(null);
    setRedemptionState('scanning');

    window.setTimeout(async () => {
      if (!videoRef.current) return;
      const reader = new BrowserMultiFormatReader();

      try {
        controlsRef.current = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (!result || decodeLockedRef.current) return;
            decodeLockedRef.current = true;
            void previewValue(result.getText());
          },
        );
      } catch {
        stopCamera();
        setManualEntry(true);
        setRedemptionMessage({
          title: 'A câmera não abriu',
          detail: 'Confira a permissão da câmera ou digite o código exibido abaixo do QR Code.',
        });
        setRedemptionState('error');
      }
    }, 50);
  };

  const consume = async () => {
    if (!token) return;
    setRedemptionState('confirming');
    setRedemptionMessage(null);

    try {
      const result = await sharedBenefitService.consumeToken(token);
      setPreview(null);
      setToken('');
      setRedemptionMessage({
        title: 'Uso confirmado',
        detail: `${result.benefitName} foi utilizado por ${result.beneficiaryName}.`,
      });
      setRedemptionState('success');
    } catch (error) {
      setRedemptionMessage({
        title: 'Não foi possível confirmar',
        detail: getApiMessage(
          error,
          'O QR Code pode ter expirado. Peça à pessoa para gerar um novo código e tente outra vez.',
        ),
      });
      setRedemptionState('error');
    }
  };

  const isProcessing = redemptionState === 'checking' || redemptionState === 'confirming';

  return (
    <section className="mx-auto max-w-[1180px] px-4 pt-6 sm:px-6 sm:pt-8">
      <div className="overflow-hidden rounded-2xl border border-[#cdd8d1] bg-[#173f32] text-white shadow-[0_18px_50px_rgba(23,63,50,.14)]">
        <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#b8d4c6]">
              Confirmar uso
            </p>
            <h1 className="mt-3 max-w-xl font-display text-3xl leading-tight tracking-[-.03em] sm:text-4xl">
              Leia o QR Code apresentado pela pessoa
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#c8dbd1]">
              A confirmação só acontece depois que você conferir o benefício e tocar em
              “Confirmar uso”.
            </p>

            {redemptionState === 'idle' && (
              <div className="mt-8">
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex h-14 w-full max-w-md items-center justify-center gap-3 rounded-xl bg-white px-5 text-base font-semibold text-[#173f32] hover:bg-[#edf5f0]"
                >
                  <Camera className="h-5 w-5" />
                  Abrir câmera para ler QR Code
                </button>
                <button
                  type="button"
                  onClick={() => setManualEntry((current) => !current)}
                  className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-[#c8dbd1] hover:text-white"
                >
                  <Keyboard className="h-4 w-4" />
                  Digitar código manualmente
                  <ChevronDown className={`h-4 w-4 transition-transform ${manualEntry ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}

            {redemptionState === 'scanning' && (
              <div className="mt-7 overflow-hidden rounded-xl border border-white/20 bg-black">
                <div className="relative aspect-[4/3] sm:aspect-video">
                  <video
                    ref={videoRef}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                  />
                  <div className="pointer-events-none absolute inset-5 rounded-xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,.28)]" />
                  <div className="absolute inset-x-0 bottom-4 text-center">
                    <span className="rounded-full bg-black/65 px-3 py-1.5 text-xs font-semibold">
                      Aponte para o QR Code
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetRedemption}
                  className="flex h-12 w-full items-center justify-center gap-2 bg-[#102e25] text-sm font-semibold hover:bg-[#0d281f]"
                >
                  <X className="h-4 w-4" />
                  Fechar câmera
                </button>
              </div>
            )}

            {(isProcessing) && (
              <div
                role="status"
                className="mt-8 flex min-h-52 flex-col items-center justify-center rounded-xl bg-white p-6 text-center text-[#18211d]"
              >
                <Loader2 className="h-10 w-10 animate-spin text-[#2f7658]" />
                <h2 className="mt-5 text-xl font-semibold">
                  {redemptionState === 'checking' ? 'Conferindo QR Code' : 'Confirmando uso'}
                </h2>
                <p className="mt-2 text-sm text-[#627068]">
                  Aguarde. Não feche esta tela.
                </p>
              </div>
            )}

            {redemptionState === 'ready' && preview && (
              <div className="mt-8 rounded-xl bg-white p-5 text-[#18211d] sm:p-6">
                <div className="flex items-center gap-3 text-[#2f7658]">
                  <CheckCircle2 className="h-6 w-6" />
                  <h2 className="text-lg font-semibold">QR Code válido</h2>
                </div>
                <dl className="mt-5 grid gap-4 border-y border-[#e3e8e4] py-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-[#6d7972]">Benefício</dt>
                    <dd className="mt-1 text-base font-semibold">{preview.benefitName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#6d7972]">Pessoa</dt>
                    <dd className="mt-1 flex items-center gap-2 text-base font-semibold">
                      <UserRound className="h-4 w-4 text-[#2f7658]" />
                      {preview.beneficiaryName}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 text-sm leading-6 text-[#536159]">
                  Confira os dados antes de confirmar. Esta ação registra o uso do benefício.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <button
                    type="button"
                    onClick={consume}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#173f32] px-5 text-sm font-semibold text-white hover:bg-[#102e25]"
                  >
                    <ScanLine className="h-5 w-5" />
                    Confirmar uso
                  </button>
                  <button
                    type="button"
                    onClick={resetRedemption}
                    className="h-12 rounded-xl border border-[#cfd8d2] px-5 text-sm font-semibold text-[#536159] hover:bg-[#f3f6f3]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {redemptionState === 'success' && redemptionMessage && (
              <div
                role="status"
                className="mt-8 flex min-h-64 flex-col items-center justify-center rounded-xl bg-[#edf8f1] p-6 text-center text-[#173f32]"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2f7658] text-white">
                  <Check className="h-9 w-9" strokeWidth={3} />
                </span>
                <h2 className="mt-5 text-2xl font-semibold">{redemptionMessage.title}</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-[#4e675b]">
                  {redemptionMessage.detail}
                </p>
                <button
                  type="button"
                  onClick={resetRedemption}
                  className="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#173f32] px-6 text-sm font-semibold text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                  Validar outro benefício
                </button>
              </div>
            )}

            {redemptionState === 'error' && redemptionMessage && (
              <div
                role="alert"
                className="mt-8 rounded-xl border border-[#f1c5bf] bg-[#fff1ef] p-5 text-[#762d28]"
              >
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-[#b4473d]" />
                  <div>
                    <h2 className="text-lg font-semibold">{redemptionMessage.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#8f4740]">
                      {redemptionMessage.detail}
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#b4473d] px-4 text-sm font-semibold text-white"
                  >
                    <Camera className="h-4 w-4" />
                    Tentar novamente
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualEntry(true)}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#dbaaa4] bg-white px-4 text-sm font-semibold"
                  >
                    <Keyboard className="h-4 w-4" />
                    Digitar código
                  </button>
                </div>
              </div>
            )}

            {manualEntry && (redemptionState === 'idle' || redemptionState === 'error') && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void previewValue(token);
                }}
                className="mt-5 rounded-xl border border-white/15 bg-white/10 p-4"
              >
                <label htmlFor="redemption-code" className="text-sm font-semibold">
                  Código exibido abaixo do QR Code
                </label>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input
                    id="redemption-code"
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                    placeholder="Digite ou cole o código"
                    autoComplete="off"
                    className="h-12 min-w-0 rounded-lg border border-white/20 bg-white px-3 text-sm text-[#18211d] placeholder:text-[#8a958f]"
                  />
                  <button
                    type="submit"
                    disabled={!token.trim() || isProcessing}
                    className="h-12 rounded-lg bg-white px-5 text-sm font-semibold text-[#173f32] disabled:opacity-50"
                  >
                    Conferir código
                  </button>
                </div>
              </form>
            )}
          </div>

          <aside className="border-t border-white/10 bg-[#102f25] p-6 sm:p-8 lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#9fc4b2]">
              Como funciona
            </p>
            <ol className="mt-6 space-y-6">
              {[
                ['1', 'Abra a câmera', 'Permita o acesso quando o celular solicitar.'],
                ['2', 'Leia o QR Code', 'Confira o benefício e o nome da pessoa.'],
                ['3', 'Confirme o uso', 'Só então o benefício será registrado como utilizado.'],
              ].map(([number, title, detail]) => (
                <li key={number} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/25 text-sm font-semibold">
                    {number}
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{title}</div>
                    <div className="mt-1 text-xs leading-5 text-[#b8cec3]">{detail}</div>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-[#d5ddd8] bg-white p-5 text-[#18211d] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#2f7658]">
              Parcerias pendentes
            </p>
            <h2 className="mt-2 text-xl font-semibold">Pedidos de parceria recebidos</h2>
            <p className="mt-1 text-sm text-[#68746d]">
              Outras empresas pediram para oferecer seus benefícios. Aceite para liberar a oferta.
            </p>
          </div>
          <button
            type="button"
            onClick={loadPartnerships}
            className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[#d5ddd8] px-3 text-xs font-semibold text-[#536159] hover:bg-[#f3f6f3]"
          >
            <RefreshCw className={`h-4 w-4 ${partnershipsLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>

        {partnershipMessage && (
          <div
            role={partnershipMessage.kind === 'error' ? 'alert' : 'status'}
            className={`mt-5 rounded-lg border px-4 py-3 ${
              partnershipMessage.kind === 'error'
                ? 'border-[#efc2bc] bg-[#fff1ef] text-[#8f3730]'
                : 'border-[#b9d7c6] bg-[#eef5f0] text-[#235c46]'
            }`}
          >
            <div className="text-sm font-semibold">{partnershipMessage.title}</div>
            <div className="mt-1 text-xs opacity-85">{partnershipMessage.detail}</div>
          </div>
        )}

        <div className="mt-5 divide-y divide-[#edf0ed]">
          {partnershipsLoading ? (
            <div role="status" className="flex items-center gap-3 py-8 text-sm text-[#68746d]">
              <Loader2 className="h-5 w-5 animate-spin text-[#2f7658]" />
              Carregando parcerias...
            </div>
          ) : partnerships.length === 0 ? (
            <div className="py-8">
              <p className="text-sm font-semibold">Nenhuma parceria pendente</p>
              <p className="mt-1 text-sm text-[#68746d]">Novos pedidos aparecerão aqui.</p>
            </div>
          ) : (
            partnerships.map((partnership) => (
              <div
                key={partnership.id}
                className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <div className="text-base font-semibold">{partnership.benefitName}</div>
                  <div className="mt-1 text-sm text-[#68746d]">
                    {partnership.clientCompanyName} quer oferecer este benefício aos seus
                    colaboradores.
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={partnershipBusyId !== null}
                    onClick={() => actOnPartnership(partnership, false)}
                    className="h-11 rounded-lg border border-[#dfb9b4] px-4 text-sm font-semibold text-[#9d3d35] disabled:opacity-50"
                  >
                    Recusar
                  </button>
                  <button
                    type="button"
                    disabled={partnershipBusyId !== null}
                    onClick={() => actOnPartnership(partnership, true)}
                    className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#173f32] px-4 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {partnershipBusyId === partnership.id && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Aceitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
