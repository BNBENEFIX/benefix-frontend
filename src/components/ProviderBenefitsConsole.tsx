'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { Camera, Check, CheckCircle2, RefreshCw, ScanLine, X } from 'lucide-react';
import { sharedBenefitService } from '../services/sharedBenefitService';
import type { RedemptionPreview, SharedBenefitRequest } from '../types';

const extractToken = (value: string) => {
  const clean = value.trim();
  try {
    const url = new URL(clean);
    return url.pathname.split('/').filter(Boolean).at(-1) ?? clean;
  } catch {
    return clean;
  }
};

export function ProviderBenefitsConsole() {
  const [requests, setRequests] = useState<SharedBenefitRequest[]>([]);
  const [token, setToken] = useState('');
  const [preview, setPreview] = useState<RedemptionPreview | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [camera, setCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const load = useCallback(async () => {
    try { setRequests(await sharedBenefitService.providerRequests()); }
    catch { setRequests([]); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => () => controlsRef.current?.stop(), []);

  const act = async (id: number, approved: boolean) => {
    setBusy(true);
    try {
      if (approved) await sharedBenefitService.approve(id);
      else await sharedBenefitService.reject(id, 'Solicitação recusada pelo estabelecimento');
      setMessage(approved ? 'Solicitação aprovada.' : 'Solicitação recusada.');
      await load();
    } finally { setBusy(false); }
  };

  const previewValue = async (raw = token) => {
    const parsed = extractToken(raw);
    if (!parsed) return;
    setBusy(true);
    setMessage('');
    try {
      setToken(parsed);
      setPreview(await sharedBenefitService.previewToken(parsed));
      controlsRef.current?.stop();
      setCamera(false);
    } catch (error) {
      const candidate = error as { response?: { data?: { message?: string } } };
      setPreview(null);
      setMessage(candidate.response?.data?.message ?? 'QR Code inválido ou expirado.');
    } finally { setBusy(false); }
  };

  const startCamera = async () => {
    setCamera(true);
    setMessage('');
    window.setTimeout(async () => {
      if (!videoRef.current) return;
      const reader = new BrowserMultiFormatReader();
      try {
        controlsRef.current = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
          if (result) previewValue(result.getText());
        });
      } catch {
        setCamera(false);
        setMessage('Não foi possível acessar a câmera. Cole o código manualmente.');
      }
    }, 50);
  };

  const consume = async () => {
    setBusy(true);
    try {
      const result = await sharedBenefitService.consumeToken(token);
      setPreview(null);
      setToken('');
      setMessage(`Benefício “${result.benefitName}” utilizado por ${result.beneficiaryName}.`);
    } catch (error) {
      const candidate = error as { response?: { data?: { message?: string } } };
      setMessage(candidate.response?.data?.message ?? 'Não foi possível concluir o resgate.');
    } finally { setBusy(false); }
  };

  return (
    <section className="mx-auto max-w-[1240px] px-6 pt-8">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-[#d9ddd8] bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#2f7a5c]">Compartilhamento</p>
              <h2 className="mt-2 text-xl font-semibold text-[#17201c]">Solicitações recebidas</h2>
            </div>
            <button onClick={load} className="rounded-lg p-2 text-[#66716b] hover:bg-[#f0f2ef]" aria-label="Atualizar solicitações"><RefreshCw className="h-4 w-4" /></button>
          </div>
          <div className="mt-5 divide-y divide-[#edf0ec]">
            {requests.length === 0 ? <p className="py-6 text-sm text-[#66716b]">Nenhuma solicitação pendente.</p> : requests.map((request) => (
              <div key={request.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <div className="text-sm font-semibold text-[#17201c]">{request.benefitName}</div>
                  <div className="mt-1 text-xs text-[#7a857f]">{request.employeeName} · {request.employeeCompanyName}</div>
                </div>
                <div className="flex gap-2">
                  <button disabled={busy} onClick={() => act(request.id, false)} className="rounded-lg border border-[#d8b5b0] p-2 text-[#a33f35]" aria-label="Recusar"><X className="h-4 w-4" /></button>
                  <button disabled={busy} onClick={() => act(request.id, true)} className="rounded-lg bg-[#194b3a] p-2 text-white" aria-label="Aprovar"><Check className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#d9ddd8] bg-[#12372a] p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#a9c8b8]">Estabelecimento</p>
          <h2 className="mt-2 text-xl font-semibold">Validar benefício</h2>
          <p className="mt-2 text-xs leading-5 text-[#b9ccc2]">Leia o QR Code apresentado pelo usuário ou cole o token abaixo.</p>

          {camera && <video ref={videoRef} className="mt-4 aspect-video w-full rounded-lg bg-black object-cover" muted playsInline />}

          <div className="mt-5 flex gap-2">
            <input value={token} onChange={(event) => setToken(event.target.value)} placeholder="Cole o token ou URL do QR Code" className="h-11 min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-3 text-xs text-white placeholder:text-white/40" />
            <button onClick={() => previewValue()} disabled={busy || !token.trim()} className="rounded-lg bg-[#d8a84e] px-4 text-xs font-semibold text-[#183128] disabled:opacity-50">Validar</button>
          </div>
          <button onClick={camera ? () => { controlsRef.current?.stop(); setCamera(false); } : startCamera} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/20 text-xs font-semibold hover:bg-white/10">
            {camera ? <X className="h-4 w-4" /> : <Camera className="h-4 w-4" />} {camera ? 'Fechar câmera' : 'Ler com a câmera'}
          </button>

          {preview && (
            <div className="mt-5 rounded-lg bg-white p-4 text-[#17201c]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#23664e]"><CheckCircle2 className="h-4 w-4" /> Código válido</div>
              <div className="mt-3 text-base font-semibold">{preview.benefitName}</div>
              <div className="mt-1 text-xs text-[#66716b]">Usuário: {preview.beneficiaryName}</div>
              <button onClick={consume} disabled={busy} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#194b3a] text-xs font-semibold text-white">
                <ScanLine className="h-4 w-4" /> Confirmar utilização
              </button>
            </div>
          )}
          {message && <p role="status" className="mt-4 text-xs leading-5 text-[#e8d39f]">{message}</p>}
        </div>
      </div>
    </section>
  );
}
