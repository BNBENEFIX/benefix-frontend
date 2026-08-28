'use client';

import { useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  HeartPulse,
  KeyRound,
  Menu,
  QrCode,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  X,
} from 'lucide-react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';

const easeOut = [0.22, 1, 0.36, 1] as const;

const productTasks = [
  {
    icon: Building2,
    number: '01',
    label: 'Para quem organiza',
    title: 'Cadastre o benefício sem montar um manual.',
    text: 'O formulário separa o essencial das regras opcionais e mostra exatamente o que falta.',
    action: 'Cadastrar benefício',
    accent: '#F2C96D',
  },
  {
    icon: QrCode,
    number: '02',
    label: 'Para quem usa',
    title: 'Encontre e mostre o QR Code em poucos toques.',
    text: 'O colaborador entra, escolhe o benefício e apresenta a tela no local de atendimento.',
    action: 'Mostrar QR Code',
    accent: '#9FD5BD',
  },
  {
    icon: CheckCircle2,
    number: '03',
    label: 'Para quem confirma',
    title: 'Saiba quando deu certo — sem precisar interpretar.',
    text: 'Espera, conferência, sucesso e erro ocupam a tela com instruções claras sobre o próximo passo.',
    action: 'Confirmar uso',
    accent: '#F0A993',
  },
];

const journey = [
  {
    number: '01',
    title: 'A empresa cria',
    text: 'O gestor cadastra o que oferece e define as regras de uso.',
    state: 'Benefício disponível',
  },
  {
    number: '02',
    title: 'A pessoa escolhe',
    text: 'O colaborador encontra o benefício sem navegar por telas desnecessárias.',
    state: 'Pronto para usar',
  },
  {
    number: '03',
    title: 'O QR Code conecta',
    text: 'Um código temporário leva os dados certos para o local de atendimento.',
    state: 'Aguardando leitura',
  },
  {
    number: '04',
    title: 'O uso é confirmado',
    text: 'A tela informa o resultado e orienta o que fazer em seguida.',
    state: 'Uso confirmado',
  },
];

const contexts = [
  {
    icon: Store,
    title: 'No balcão',
    text: 'Ação rápida para equipes que atendem com fila e pouco tempo.',
  },
  {
    icon: HeartPulse,
    title: 'Na recepção',
    text: 'Confirmação clara para rotinas de atendimento e agendamento.',
  },
  {
    icon: Users,
    title: 'No consultório',
    text: 'Linguagem neutra para benefícios ligados a cuidado e bem-estar.',
  },
];

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 30 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.72, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}

function BenefitPass({ reduceMotion }: { reduceMotion: boolean }) {
  const float = (delay: number, distance = 8) => reduceMotion
    ? undefined
    : {
        y: [0, -distance, 0],
        rotate: [0, 0.7, 0],
        transition: {
          duration: 4.8,
          delay,
          repeat: Infinity,
          ease: 'easeInOut' as const,
        },
      };

  return (
    <div
      className="relative mx-auto h-[380px] w-full max-w-[560px] sm:h-[480px] md:h-[540px]"
      role="img"
      aria-label="Fluxo visual de um benefício liberado, apresentado por QR Code e confirmado no atendimento"
    >
      <svg
        viewBox="0 0 560 540"
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <motion.path
          d="M55 116 C155 10 332 32 462 113 C547 167 527 276 427 314 C318 355 331 476 194 495 C92 510 24 433 83 356"
          fill="none"
          stroke="rgba(242,201,109,.32)"
          strokeWidth="1.5"
          strokeDasharray="6 9"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={reduceMotion ? undefined : { pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.65, ease: easeOut }}
        />
        <motion.circle
          cx="55"
          cy="116"
          r="5"
          fill="#F2C96D"
          initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
          animate={reduceMotion ? undefined : { scale: [1, 1.8, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />
        <motion.circle
          cx="462"
          cy="113"
          r="4"
          fill="#9FD5BD"
          initial={reduceMotion ? false : { scale: 0 }}
          animate={reduceMotion ? undefined : { scale: [1, 1.7, 1] }}
          transition={{ duration: 2.8, delay: 0.7, repeat: Infinity }}
        />
      </svg>

      <motion.div
        className="absolute right-0 top-7 z-20 w-[150px] rounded-2xl border border-white/15 bg-[#174738] p-3 shadow-[0_18px_45px_rgba(0,0,0,.18)] sm:right-2 sm:w-[202px] sm:p-4"
        initial={reduceMotion ? false : { opacity: 0, x: 38, rotate: 4 }}
        animate={reduceMotion ? undefined : { opacity: 1, x: 0, rotate: 1.5 }}
        transition={{ duration: 0.85, delay: 0.8, ease: easeOut }}
      >
        <motion.div animate={float(1.2, 6)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2C96D] text-[#17352b]">
            <Building2 className="h-4 w-4" />
          </span>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[.12em] text-white/50">
            Empresa
          </p>
          <p className="mt-1 text-sm font-semibold text-white">Benefício liberado</p>
          <p className="mt-1 text-xs text-[#b9d2c5]">Pronto para a equipe</p>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute left-0 top-[145px] z-30 w-[136px] rounded-2xl border border-[#d9e3dc] bg-[#F4F6F1] p-3 text-[#18211D] shadow-[0_20px_50px_rgba(1,20,12,.22)] sm:left-1 sm:top-[185px] sm:w-[182px] sm:p-4"
        initial={reduceMotion ? false : { opacity: 0, x: -35, rotate: -5 }}
        animate={reduceMotion ? undefined : { opacity: 1, x: 0, rotate: -2 }}
        transition={{ duration: 0.85, delay: 1.05, ease: easeOut }}
      >
        <motion.div animate={float(0.4, 7)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dcece4] text-[#2F7658]">
            <Users className="h-4 w-4" />
          </span>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[.12em] text-[#748078]">
            Colaborador
          </p>
          <p className="mt-1 text-sm font-semibold">Pronto para usar</p>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute inset-x-[48px] top-[70px] z-10 overflow-hidden rounded-[28px] border border-white/30 bg-white p-3 text-[#18211D] shadow-[0_38px_90px_rgba(0,0,0,.32)] sm:inset-x-[94px] sm:top-[94px] sm:p-5"
        initial={reduceMotion ? false : { opacity: 0, y: 55, rotateX: 12, scale: 0.94 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        transition={{ duration: 1, delay: 0.45, ease: easeOut }}
        style={{ transformPerspective: 900 }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#e6ebe7] pb-4">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.png" alt="" className="h-8 w-8 rounded-lg object-contain" />
            <div>
              <p className="text-xs font-semibold">Passe BNFix</p>
              <p className="mt-0.5 text-[10px] text-[#758078]">Uso temporário</p>
            </div>
          </div>
          <span className="rounded-full bg-[#e8f4ed] px-2.5 py-1 text-[10px] font-semibold text-[#2F7658]">
            Liberado
          </span>
        </div>

        <div className="pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#78837c]">
            Cuidado e bem-estar
          </p>
          <h3 className="mt-1.5 font-display text-[1.65rem] leading-tight tracking-[-.025em]">
            Sessão de cuidado integral
          </h3>
          <p className="mt-1.5 text-xs text-[#6d7972]">Empresa parceira</p>
        </div>

        <div className="relative mx-auto mt-4 flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-2xl border border-[#dce3de] bg-[#f9faf7] sm:mt-5 sm:h-[146px] sm:w-[146px] md:h-[166px] md:w-[166px]">
          <QrCode className="h-[90px] w-[90px] text-[#11271f] sm:h-[112px] sm:w-[112px] md:h-[132px] md:w-[132px]" strokeWidth={1.35} />
          <motion.div
            className="absolute inset-x-3 top-2 h-px bg-[#DC765E] shadow-[0_0_14px_3px_rgba(220,118,94,.48)]"
            animate={reduceMotion ? undefined : { y: [0, 126, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#eff5f0] px-3 py-3 text-[#1e5d45]">
          <Clock3 className="h-4 w-4" />
          <span className="font-mono text-xs font-semibold">Expira em 04:52</span>
        </div>
        <p className="mt-3 text-center text-[11px] leading-5 text-[#78837c]">
          Mostre esta tela no atendimento
        </p>
      </motion.div>

      <motion.div
        className="absolute bottom-2 right-1 z-30 w-[160px] rounded-2xl bg-[#F2C96D] p-3 text-[#17352b] shadow-[0_20px_48px_rgba(0,0,0,.22)] sm:bottom-8 sm:right-3 sm:w-[210px] sm:p-4"
        initial={reduceMotion ? false : { opacity: 0, y: 35, rotate: 5 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0, rotate: 2 }}
        transition={{ duration: 0.85, delay: 1.35, ease: easeOut }}
      >
        <motion.div animate={float(1.8, 6)}>
          <CheckCircle2 className="h-6 w-6" />
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[.12em] opacity-60">
            Atendimento
          </p>
          <p className="mt-1 text-sm font-semibold">Uso confirmado</p>
          <p className="mt-1 text-xs opacity-70">Tudo certo para continuar</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function MarketingLanding() {
  const reduceMotion = Boolean(useReducedMotion());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    mass: 0.35,
  });
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroCopyY = useTransform(heroProgress, [0, 1], [0, 70]);
  const heroVisualY = useTransform(heroProgress, [0, 1], [0, 110]);

  return (
    <main className="overflow-hidden bg-[#F4F6F1] text-[#18211D]">
      <motion.div
        className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-[#F2C96D]"
        style={{ scaleX: smoothProgress }}
        aria-hidden="true"
      />

      <header className="absolute inset-x-0 top-0 z-40">
        <motion.div
          className="mx-auto flex h-20 max-w-[1240px] items-center justify-between px-4 pt-[env(safe-area-inset-top,0px)] sm:h-24 sm:px-8"
          initial={reduceMotion ? false : { opacity: 0, y: -18 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: easeOut }}
        >
          <Link href="/" className="flex items-center gap-2.5" aria-label="BNFix — página inicial">
            <img
              src="/favicon.png"
              alt=""
              className="h-9 w-9 rounded-lg bg-white object-contain p-1 shadow-sm sm:h-10 sm:w-10"
            />
            <div>
              <div className="text-base font-semibold leading-none tracking-[-.02em] text-white">
                BNFix
              </div>
              <div className="mt-1 text-[10px] font-medium tracking-[0.08em] text-white/55">
                Benefícios claros
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-white/70 lg:flex" aria-label="Navegação principal">
            <a href="#produto" className="hover:text-white">Produto</a>
            <a href="#como-funciona" className="hover:text-white">Como funciona</a>
            <a href="#rotinas" className="hover:text-white">Para sua rotina</a>
            <a href="#seguranca" className="hover:text-white">Segurança</a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/entrar"
              className="hidden rounded-lg px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/10 sm:inline-flex sm:px-4"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="rounded-lg bg-[#F2C96D] px-3 py-2 text-sm font-semibold text-[#17352b] hover:bg-[#f7d985] sm:px-4 sm:py-2.5"
            >
              Criar conta
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 lg:hidden"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        {/* Mobile navigation overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[80] lg:hidden">
            <div
              className="absolute inset-0 bg-[#0B3024]/90 backdrop-blur-md"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <nav
              className="relative mx-4 mt-4 rounded-2xl border border-white/10 bg-[#12372a] p-6 shadow-2xl sm:mx-8"
              aria-label="Navegação mobile"
            >
              <div className="flex items-center justify-between mb-6">
                <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileMenuOpen(false)}>
                  <img src="/favicon.png" alt="" className="h-9 w-9 rounded-lg bg-white object-contain p-1" />
                  <span className="text-base font-semibold text-white">BNFix</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <a href="#produto" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-3 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white">Produto</a>
                <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-3 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white">Como funciona</a>
                <a href="#rotinas" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-3 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white">Para sua rotina</a>
                <a href="#seguranca" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-3 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white">Segurança</a>
              </div>
              <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-5">
                <Link href="/entrar" onClick={() => setMobileMenuOpen(false)} className="flex h-11 items-center justify-center rounded-xl border border-white/20 text-sm font-semibold text-white hover:bg-white/10">
                  Entrar
                </Link>
                <Link href="/cadastro" onClick={() => setMobileMenuOpen(false)} className="flex h-11 items-center justify-center rounded-xl bg-[#F2C96D] text-sm font-semibold text-[#17352b] hover:bg-[#f7d985]">
                  Criar conta
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <section
        ref={heroRef}
        className="relative min-h-[780px] bg-[#0B3024] pb-24 pt-[calc(2rem+env(safe-area-inset-top,0px))] text-white sm:min-h-[880px] sm:pt-40 lg:flex lg:min-h-[820px] lg:items-center lg:pb-28 lg:pt-32"
      >
        <div className="benefix-dot-field absolute inset-0 opacity-35" aria-hidden="true" />
        <div className="absolute inset-x-[8%] bottom-0 h-px bg-white/10" aria-hidden="true" />

        <div className="relative mx-auto grid w-full max-w-[1240px] items-center gap-10 px-4 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-8">
          <motion.div style={reduceMotion ? undefined : { y: heroCopyY }}>
            <motion.div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-[#b9d4c6]"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: easeOut }}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#F2C96D]" />
              Benefícios que chegam até as pessoas
            </motion.div>

            <h1 className="max-w-[680px] font-display text-[3.2rem] leading-[.94] tracking-[-.048em] sm:text-[4.5rem] lg:text-[5rem]">
              {[
                'O benefício',
                'sai do papel',
                'e vira cuidado.',
              ].map((line, index) => (
                <span key={line} className="block overflow-hidden pb-[.08em]">
                  <motion.span
                    className={`block ${index === 2 ? 'text-[#F2C96D]' : ''}`}
                    initial={reduceMotion ? false : { y: '110%', rotate: 2 }}
                    animate={reduceMotion ? undefined : { y: 0, rotate: 0 }}
                    transition={{ duration: 0.9, delay: 0.42 + index * 0.1, ease: easeOut }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              className="mt-7 max-w-xl text-base leading-7 text-[#c4d7ce] sm:text-lg sm:leading-8"
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.85, ease: easeOut }}
            >
              A BNFix organiza o caminho entre quem oferece e quem usa: cadastro simples,
              acesso direto e confirmação por QR Code.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col gap-3 sm:flex-row"
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 1, ease: easeOut }}
            >
              <Link
                href="/cadastro"
                className="group inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-[#F2C96D] px-6 text-sm font-semibold text-[#17352b] hover:bg-[#f7d985]"
              >
                Cadastrar minha empresa
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#produto"
                className="inline-flex h-13 items-center justify-center rounded-xl border border-white/20 px-6 text-sm font-semibold text-white hover:bg-white/[0.07]"
              >
                Ver como funciona
              </a>
            </motion.div>

            <motion.div
              className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5 text-xs text-white/55"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.18 }}
            >
              {['Sem cartão', 'Acesso por perfil', 'Experiência mobile'].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#F2C96D]" />
                  {item}
                </span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="relative lg:translate-x-3"
            style={reduceMotion ? undefined : { y: heroVisualY }}
          >
            <BenefitPass reduceMotion={reduceMotion} />
          </motion.div>
        </div>
      </section>

      <section className="border-b border-[#d9e0da] bg-white px-4 py-8 sm:px-8">
        <div className="mx-auto grid max-w-[1240px] gap-5 sm:grid-cols-3 sm:divide-x sm:divide-[#d9e0da]">
          {[
            ['Uma entrada', 'O perfil certo já abre na tarefa certa.'],
            ['Uma ação principal', 'Cada tela deixa claro o que fazer agora.'],
            ['Um resultado visível', 'Sucesso e erro não passam despercebidos.'],
          ].map(([title, text], index) => (
            <Reveal key={title} delay={index * 0.08} className="sm:px-6 sm:first:pl-0">
              <p className="text-sm font-semibold text-[#183f31]">{title}</p>
              <p className="mt-1.5 text-sm leading-6 text-[#6b7770]">{text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="produto" className="px-4 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-7 border-b border-[#d7ded8] pb-12 lg:grid-cols-[.85fr_1fr] lg:items-end">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#2F7658]">
                Clareza em cada tarefa
              </p>
              <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.04] tracking-[-.038em] sm:text-5xl">
                A interface explica o caminho enquanto a pessoa usa.
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="lg:justify-self-end">
              <p className="max-w-xl text-base leading-7 text-[#66736c]">
                Gestores e colaboradores não precisam aprender “como o sistema funciona”.
                Cada tela usa verbos diretos, estados grandes e uma próxima ação evidente.
              </p>
            </Reveal>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {productTasks.map(({ icon: Icon, number, label, title, text, action, accent }, index) => (
              <Reveal key={title} delay={index * 0.09}>
                <motion.article
                  className="group flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-[#d6ded8] bg-white p-6 shadow-[0_12px_40px_rgba(23,63,50,.05)] sm:p-7"
                  whileHover={reduceMotion ? undefined : { y: -7 }}
                  transition={{ duration: 0.35, ease: easeOut }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-[#17352b]"
                      style={{ backgroundColor: accent }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs text-[#8a958f]">{number}</span>
                  </div>
                  <p className="mt-8 text-xs font-semibold uppercase tracking-[.13em] text-[#2F7658]">
                    {label}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-[-.025em]">
                    {title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-[#68756e]">{text}</p>
                  <div className="mt-auto pt-8">
                    <div className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#edf3ee] px-4 text-sm font-semibold text-[#173f32] transition-colors group-hover:bg-[#173f32] group-hover:text-white">
                      {action}
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </motion.article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-[#e9eee9] px-4 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-24">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#2F7658]">
              Uma jornada, quatro momentos
            </p>
            <h2 className="mt-4 font-display text-4xl leading-[1.04] tracking-[-.038em] sm:text-5xl">
              Do cadastro ao “uso confirmado”.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[#66736c]">
              Cada pessoa enxerga apenas o trecho da jornada que precisa executar.
            </p>
          </Reveal>

          <ol className="relative">
            <div className="absolute bottom-8 left-[19px] top-8 w-px bg-[#c7d3ca]" aria-hidden="true" />
            {journey.map((step, index) => (
              <Reveal key={step.number} delay={index * 0.06}>
                <li className="relative grid grid-cols-[40px_1fr] gap-5 border-b border-[#cbd5cd] py-7 first:pt-0">
                  <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#b9c9be] bg-[#e9eee9] font-mono text-xs text-[#517060]">
                    {step.number}
                  </span>
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <h3 className="text-xl font-semibold tracking-[-.02em]">{step.title}</h3>
                      <p className="mt-2 max-w-lg text-sm leading-6 text-[#66736c]">{step.text}</p>
                    </div>
                    <span className="w-fit rounded-full border border-[#bdcabf] bg-white/55 px-3 py-1.5 text-xs font-semibold text-[#2F7658]">
                      {step.state}
                    </span>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section id="rotinas" className="relative bg-[#0B3024] px-4 py-24 text-white sm:px-8 sm:py-32">
        <div className="benefix-dot-field absolute inset-0 opacity-25" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1240px]">
          <Reveal className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#9FD5BD]">
              Feita para rotinas reais
            </p>
            <h2 className="mt-4 font-display text-4xl leading-[1.04] tracking-[-.038em] sm:text-5xl">
              A mesma clareza, mesmo quando o dia muda completamente.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#bfd2c8]">
              A linguagem permanece neutra e direta para funcionar em diferentes tipos de
              empresa e atendimento.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 lg:grid-cols-3">
            {contexts.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} delay={index * 0.09}>
                <motion.article
                  className="min-h-64 bg-[#10382b] p-7 sm:p-9"
                  whileHover={reduceMotion ? undefined : { backgroundColor: '#164737' }}
                >
                  <Icon className="h-6 w-6 text-[#F2C96D]" />
                  <h3 className="mt-10 text-2xl font-semibold tracking-[-.02em]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#afc7ba]">{text}</p>
                </motion.article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="seguranca" className="px-4 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto grid max-w-[1240px] overflow-hidden rounded-3xl border border-[#d4ddd6] bg-white lg:grid-cols-[1.05fr_.95fr]">
          <Reveal className="p-7 sm:p-12 lg:p-16">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e2eee6] text-[#2F7658]">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[.15em] text-[#2F7658]">
              Segurança sem complicação
            </p>
            <h2 className="mt-4 max-w-xl font-display text-4xl leading-[1.04] tracking-[-.038em] sm:text-5xl">
              Cada empresa no seu espaço. Cada pessoa no caminho certo.
            </h2>
            <p className="mt-6 max-w-xl text-sm leading-7 text-[#66736c]">
              A BNFix protege o acesso e mostra somente o que cada perfil precisa para
              realizar sua tarefa.
            </p>
          </Reveal>

          <div className="grid gap-px bg-[#dce3de]">
            {[
              [KeyRound, 'Acesso individual', 'Cada pessoa entra com sua própria conta.'],
              [Building2, 'Dados por empresa', 'A gestão permanece vinculada à organização correta.'],
              [BadgeCheck, 'Permissões por perfil', 'Gestor e colaborador veem ações diferentes.'],
            ].map(([Icon, title, text], index) => {
              const FeatureIcon = Icon as typeof KeyRound;
              return (
                <Reveal key={title as string} delay={index * 0.07}>
                  <div className="bg-[#eff3ef] p-7 sm:p-9">
                    <FeatureIcon className="h-5 w-5 text-[#2F7658]" />
                    <h3 className="mt-4 text-base font-semibold">{title as string}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#66736c]">{text as string}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-8 sm:pb-32">
        <Reveal>
          <div className="relative mx-auto flex max-w-[1120px] flex-col items-center overflow-hidden rounded-3xl bg-[#F2C96D] px-6 py-16 text-center text-[#17352b] sm:px-12 sm:py-20">
            <motion.div
              className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-[#17352b]/15"
              animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            />
            <Sparkles className="h-7 w-7" />
            <h2 className="mt-6 max-w-3xl font-display text-4xl leading-[1.04] tracking-[-.038em] sm:text-5xl">
              Menos explicação. Mais gente usando o benefício.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#3d594d]">
              Cadastre sua empresa e comece pela parte mais simples: deixar claro o que cada
              pessoa pode fazer.
            </p>
            <Link
              href="/cadastro"
              className="group mt-8 inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-[#173f32] px-6 text-sm font-semibold text-white hover:bg-[#102e25]"
            >
              Cadastrar minha empresa
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-[#d7ded8] bg-white px-4 py-10 sm:px-8">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="" className="h-9 w-9 rounded-lg object-contain" />
            <div>
              <div className="text-sm font-semibold">BNFix</div>
              <div className="mt-0.5 text-[11px] text-[#758078]">
                Benefícios claros para rotinas reais
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-[#66736c]">
            <a href="#produto" className="hover:text-[#173f32]">Produto</a>
            <a href="#como-funciona" className="hover:text-[#173f32]">Como funciona</a>
            <a href="#rotinas" className="hover:text-[#173f32]">Para sua rotina</a>
            <Link href="/entrar" className="hover:text-[#173f32]">Entrar</Link>
          </div>
          <p className="text-xs text-[#87918b]">© 2026 BNFix</p>
        </div>
      </footer>
    </main>
  );
}
