import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CheckCheck,
  ChevronRight,
  Inbox,
  Loader2,
  Megaphone,
  RefreshCw,
  X,
} from 'lucide-react';
import { announcementService } from '../services/announcementService';
import type { EmployeeAnnouncement } from '../types';

const PAGE_SIZE = 20;

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const fullDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeStyle: 'short',
});

const formatAnnouncementDate = (value: string, full = false): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data não informada';
  return (full ? fullDateFormatter : shortDateFormatter).format(date);
};

const getAnnouncementError = (error: unknown, fallback: string): string => {
  const candidate = error as {
    response?: { status?: number; data?: { message?: string; detail?: string } };
  };
  const status = candidate.response?.status;
  const backendMessage = candidate.response?.data?.message
    ?? candidate.response?.data?.detail
    ?? '';

  if (status === 403) {
    return 'Seu acesso aos comunicados não está disponível. Atualize a página ou fale com o gestor.';
  }
  return backendMessage || fallback;
};

export const AnnouncementCenter: React.FC = () => {
  const panelTitleId = useId();
  const panelDescriptionId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const unreadRequestInFlight = useRef(false);

  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [countError, setCountError] = useState('');
  const [announcements, setAnnouncements] = useState<EmployeeAnnouncement[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState('');
  const [selected, setSelected] = useState<EmployeeAnnouncement | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [readError, setReadError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const [markAllError, setMarkAllError] = useState('');

  const refreshUnreadCount = useCallback(async () => {
    if (unreadRequestInFlight.current) return;
    unreadRequestInFlight.current = true;
    try {
      const count = await announcementService.getUnreadCount();
      setUnreadCount(Math.max(0, count));
      setCountError('');
    } catch (error) {
      setCountError(getAnnouncementError(
        error,
        'Não foi possível atualizar a contagem de comunicados.',
      ));
    } finally {
      unreadRequestInFlight.current = false;
    }
  }, []);

  const loadFirstPage = useCallback(async () => {
    setLoadingList(true);
    setListError('');
    try {
      const result = await announcementService.listMine(0, PAGE_SIZE);
      setAnnouncements(result.items);
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch (error) {
      setListError(getAnnouncementError(
        error,
        'Não foi possível carregar os comunicados. Tente novamente.',
      ));
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setListError('');
    try {
      const result = await announcementService.listMine(page + 1, PAGE_SIZE);
      setAnnouncements((current) => {
        const knownIds = new Set(current.map((item) => item.id));
        return [
          ...current,
          ...result.items.filter((item) => !knownIds.has(item.id)),
        ];
      });
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch (error) {
      setListError(getAnnouncementError(
        error,
        'Não foi possível carregar mais comunicados. Tente novamente.',
      ));
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, page]);

  useEffect(() => {
    void refreshUnreadCount();

    const intervalId = window.setInterval(() => {
      void refreshUnreadCount();
    }, 30_000);
    const handleFocus = () => void refreshUnreadCount();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refreshUnreadCount();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open]);

  const openPanel = () => {
    setOpen(true);
    setSelected(null);
    setReadError('');
    setMarkAllError('');
    void loadFirstPage();
    void refreshUnreadCount();
  };

  const closePanel = () => {
    setOpen(false);
    setSelected(null);
    setReadError('');
  };

  const registerRead = async (announcement: EmployeeAnnouncement) => {
    if (announcement.read || markingId === announcement.id) return;
    setMarkingId(announcement.id);
    setReadError('');
    try {
      const updated = await announcementService.markAsRead(announcement.id);
      setAnnouncements((current) => current.map((item) => (
        item.id === updated.id ? updated : item
      )));
      setSelected((current) => current?.id === updated.id ? updated : current);
      setUnreadCount((current) => Math.max(0, current - 1));
      setCountError('');
    } catch (error) {
      setReadError(getAnnouncementError(
        error,
        'A mensagem foi aberta, mas a leitura não foi registrada. Tente novamente.',
      ));
    } finally {
      setMarkingId(null);
    }
  };

  const openAnnouncement = (announcement: EmployeeAnnouncement) => {
    setSelected(announcement);
    setReadError('');
    if (!announcement.read) void registerRead(announcement);
  };

  const markAllAsRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    setMarkAllError('');
    try {
      const remaining = await announcementService.markAllAsRead();
      const readAt = new Date().toISOString();
      setAnnouncements((current) => current.map((item) => (
        item.read ? item : { ...item, read: true, readAt }
      )));
      setSelected((current) => (
        current && !current.read ? { ...current, read: true, readAt } : current
      ));
      setUnreadCount(Math.max(0, remaining));
      setCountError('');
    } catch (error) {
      setMarkAllError(getAnnouncementError(
        error,
        'Não foi possível marcar todos como lidos. Tente novamente.',
      ));
    } finally {
      setMarkingAll(false);
    }
  };

  const badgeText = unreadCount > 9 ? '9+' : String(unreadCount);
  const triggerLabel = unreadCount > 0
    ? `Comunicados: ${unreadCount} não ${unreadCount === 1 ? 'lido' : 'lidos'}`
    : 'Comunicados: nenhuma mensagem não lida';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openPanel}
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-controls={open ? panelTitleId : undefined}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-red-600 px-0.5 text-[9px] font-bold leading-none text-white"
          >
            {badgeText}
          </span>
        )}
      </button>

      <span className="sr-only" role="status" aria-live="polite">
        {unreadCount > 0
          ? `${unreadCount} comunicado${unreadCount === 1 ? '' : 's'} não lido${unreadCount === 1 ? '' : 's'}.`
          : 'Todos os comunicados foram lidos.'}
      </span>

      {open && (
        <div
          className="fixed inset-0 z-[80] bg-slate-950/45 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePanel();
          }}
        >
          <aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={panelTitleId}
            aria-describedby={panelDescriptionId}
            className="absolute inset-0 flex flex-col border-l border-[var(--line)] bg-[var(--surface)] shadow-2xl sm:left-auto sm:w-[460px]"
          >
            <header className="flex shrink-0 items-start gap-3 border-b border-[var(--line)] px-4 py-4 sm:px-5">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                <Megaphone className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id={panelTitleId} className="text-base font-semibold text-[var(--ink)]">
                  Comunicados
                </h2>
                <p id={panelDescriptionId} className="mt-0.5 text-xs leading-5 text-[var(--muted)]">
                  Avisos e mensagens da sua empresa.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closePanel}
                aria-label="Fechar comunicados"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>

            {selected ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="border-b border-[var(--line)] px-4 py-3 sm:px-5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(null);
                      setReadError('');
                    }}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-[var(--brand-strong)] hover:bg-[var(--brand-soft)]"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Voltar aos comunicados
                  </button>
                </div>

                <article className="px-5 py-6 sm:px-7">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      selected.read
                        ? 'bg-[var(--surface-muted)] text-[var(--muted)]'
                        : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                    }`}>
                      {selected.read ? 'Lido' : 'Não lido'}
                    </span>
                    {markingId === selected.id && (
                      <span className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        Registrando leitura...
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-xl font-semibold leading-7 tracking-tight text-[var(--ink)]">
                    {selected.title}
                  </h3>
                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--muted)]">
                    <span className="font-semibold text-[var(--ink)]">{selected.author}</span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={selected.publishedAt}>
                      {formatAnnouncementDate(selected.publishedAt, true)}
                    </time>
                  </div>

                  {readError && (
                    <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{readError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void registerRead(selected)}
                        disabled={markingId === selected.id}
                        className="mt-2 ml-6 font-semibold underline decoration-current underline-offset-2 disabled:opacity-60"
                      >
                        Tentar registrar novamente
                      </button>
                    </div>
                  )}

                  <p className="mt-6 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--ink)]">
                    {selected.content}
                  </p>
                </article>
              </div>
            ) : (
              <>
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface-muted)]/45 px-4 py-3 sm:px-5">
                  <p className="text-xs font-medium text-[var(--muted)]">
                    {unreadCount > 0
                      ? `${unreadCount} não ${unreadCount === 1 ? 'lido' : 'lidos'}`
                      : 'Tudo em dia'}
                  </p>
                  <button
                    type="button"
                    onClick={() => void markAllAsRead()}
                    disabled={markingAll || unreadCount === 0}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--brand-strong)] hover:bg-[var(--brand-soft)] disabled:cursor-default disabled:opacity-45"
                  >
                    {markingAll
                      ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      : <CheckCheck className="h-4 w-4" aria-hidden="true" />}
                    Marcar todas como lidas
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {(countError || markAllError) && (
                    <div role="alert" className="mx-4 mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 sm:mx-5">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p>{markAllError || countError}</p>
                        {countError && !markAllError && (
                          <button
                            type="button"
                            onClick={() => void refreshUnreadCount()}
                            className="mt-1 font-semibold underline underline-offset-2"
                          >
                            Atualizar contagem
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {loadingList ? (
                    <div role="status" className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-[var(--muted)]">
                      <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" aria-hidden="true" />
                      Carregando comunicados...
                    </div>
                  ) : listError && announcements.length === 0 ? (
                    <div className="flex min-h-72 flex-col items-center justify-center px-8 text-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                        <AlertCircle className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <p role="alert" className="mt-4 text-sm font-semibold text-[var(--ink)]">
                        Os comunicados não carregaram
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{listError}</p>
                      <button
                        type="button"
                        onClick={() => void loadFirstPage()}
                        className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--action)] px-4 py-2 text-xs font-semibold text-[var(--action-ink)] hover:bg-[var(--action-hover)]"
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Tentar novamente
                      </button>
                    </div>
                  ) : announcements.length === 0 ? (
                    <div className="flex min-h-72 flex-col items-center justify-center px-8 text-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                        <Inbox className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <p className="mt-4 text-sm font-semibold text-[var(--ink)]">
                        Nenhum comunicado por aqui
                      </p>
                      <p className="mt-1 max-w-xs text-xs leading-5 text-[var(--muted)]">
                        Quando sua empresa publicar um aviso, ele aparecerá nesta área.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 sm:p-4">
                      <ul className="space-y-2" aria-label="Lista de comunicados">
                        {announcements.map((announcement) => (
                          <li key={announcement.id}>
                            <button
                              type="button"
                              onClick={() => openAnnouncement(announcement)}
                              className={`group relative w-full overflow-hidden rounded-xl border p-4 text-left transition-colors ${
                                announcement.read
                                  ? 'border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-muted)]/60'
                                  : 'border-red-200 bg-red-50/60 hover:bg-red-50 dark:border-red-900/60 dark:bg-red-950/20 dark:hover:bg-red-950/30'
                              }`}
                            >
                              {!announcement.read && (
                                <span className="absolute inset-y-0 left-0 w-1 bg-red-600" aria-hidden="true" />
                              )}
                              <span className="flex items-start gap-3">
                                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                  announcement.read ? 'bg-[var(--line)]' : 'bg-red-600'
                                }`} aria-hidden="true" />
                                <span className="min-w-0 flex-1">
                                  <span className={`block text-sm leading-5 text-[var(--ink)] ${
                                    announcement.read ? 'font-medium' : 'font-bold'
                                  }`}>
                                    {announcement.title}
                                  </span>
                                  {!announcement.read && <span className="sr-only">Não lido. </span>}
                                  <span className="mt-1 block line-clamp-2 text-xs leading-5 text-[var(--muted)]">
                                    {announcement.content}
                                  </span>
                                  <span className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
                                    <span className="max-w-[55%] truncate">{announcement.author}</span>
                                    <span aria-hidden="true">·</span>
                                    <time dateTime={announcement.publishedAt}>
                                      {formatAnnouncementDate(announcement.publishedAt)}
                                    </time>
                                  </span>
                                </span>
                                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--muted)] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>

                      {listError && (
                        <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                          <p>{listError}</p>
                          <button
                            type="button"
                            onClick={() => void loadMore()}
                            className="mt-1 font-semibold underline underline-offset-2"
                          >
                            Tentar carregar novamente
                          </button>
                        </div>
                      )}

                      {hasMore && !listError && (
                        <button
                          type="button"
                          onClick={() => void loadMore()}
                          disabled={loadingMore}
                          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--line)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-muted)] disabled:opacity-60"
                        >
                          {loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                          {loadingMore ? 'Carregando...' : 'Carregar mais'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
};
