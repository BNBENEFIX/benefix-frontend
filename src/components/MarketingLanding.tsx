import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  ChevronRight,
  CircleDot,
  Handshake,
  HeartPulse,
  Layers3,
  LockKeyhole,
  Search,
  ShieldCheck,
  Users,
  WalletCards,
} from 'lucide-react';

const capabilities = [
  {
    icon: Users,
    eyebrow: 'Pessoas',
    title: 'A equipe organizada, de verdade',
    text: 'Cadastre, atualize, ative ou desative colaboradores mantendo cada empresa em seu próprio ambiente.',
  },
  {
    icon: WalletCards,
    eyebrow: 'Benefícios',
    title: 'Um catálogo que o RH controla',
    text: 'Crie benefícios internos e encontre novas opções no marketplace para montar uma oferta coerente.',
  },
  {
    icon: Handshake,
    eyebrow: 'Parcerias',
    title: 'Parcerias com fluxo claro',
    text: 'Solicite, aceite, rejeite ou encerre parcerias sem depender de planilhas e conversas espalhadas.',
  },
];

const flow = [
  ['01', 'Cadastre a empresa', 'Crie a organização e o primeiro acesso de gestão em um único fluxo.'],
  ['02', 'Monte a estrutura', 'Adicione colaboradores e organize os benefícios disponíveis para o time.'],
  ['03', 'Conecte novas ofertas', 'Explore o marketplace e formalize parcerias dentro da plataforma.'],
  ['04', 'Dê autonomia', 'O colaborador acessa a conta e realiza a adesão ao benefício escolhido.'],
];

export function MarketingLanding() {
  return (
    <main className="overflow-hidden bg-[#f6f5f1] text-[#17201c]">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex h-20 max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="BNFix — página inicial">
            <img src="/favicon.png" alt="" className="h-10 w-10 rounded-lg bg-white object-contain p-1 shadow-sm" />
            <div>
              <div className="text-[17px] font-semibold leading-none tracking-[-0.02em] text-white">BNFix</div>
              <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/55">Benefícios</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-white/75 md:flex" aria-label="Navegação principal">
            <a href="#produto" className="hover:text-white">Produto</a>
            <a href="#como-funciona" className="hover:text-white">Como funciona</a>
            <a href="#seguranca" className="hover:text-white">Segurança</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/entrar" className="hidden rounded-lg px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 sm:block">
              Entrar
            </Link>
            <Link href="/cadastro" className="rounded-lg bg-[#d8a84e] px-4 py-2.5 text-sm font-semibold text-[#183128] hover:bg-[#e5b85e]">
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <section className="relative bg-[#12372a] pb-24 pt-36 text-white sm:pb-32 sm:pt-44">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-40 top-20 h-[540px] w-[540px] rounded-full border border-white/[0.06]" />
          <div className="absolute -right-20 top-40 h-[360px] w-[360px] rounded-full border border-white/[0.06]" />
          <div className="absolute bottom-0 left-[8%] h-px w-[84%] bg-white/10" />
        </div>

        <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[.92fr_1.08fr] lg:gap-16">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-[#b9d4c6]">
              <CircleDot className="h-3.5 w-3.5 text-[#e2b45b]" />
              Gestão de benefícios em um só lugar
            </div>
            <h1 className="max-w-2xl font-display text-[3.25rem] leading-[.98] tracking-[-0.045em] sm:text-6xl lg:text-[4.6rem]">
              Benefícios que fazem sentido para a empresa e para as pessoas.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#c8d8d0] sm:text-lg sm:leading-8">
              A BNFix reúne RH, colaboradores e parceiros em uma operação simples: menos controle manual, mais clareza para escolher e gerir cada benefício.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/cadastro" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#d8a84e] px-6 text-sm font-semibold text-[#183128] hover:bg-[#e5b85e]">
                Cadastrar minha empresa
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#produto" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/20 px-6 text-sm font-semibold text-white hover:bg-white/[0.07]">
                Conhecer a plataforma
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/55">
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#e2b45b]" /> Cadastro sem cartão</span>
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#e2b45b]" /> Acesso por perfil</span>
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#e2b45b]" /> Operação centralizada</span>
            </div>
          </div>

          <div className="relative lg:pl-6">
            <div className="absolute -inset-8 rounded-full bg-[#2f7a5c]/20 blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[18px] border border-white/15 bg-[#f8f8f5] text-[#17201c] shadow-[0_32px_80px_rgba(2,18,11,.28)]">
              <div className="flex h-12 items-center justify-between border-b border-[#e2e4df] bg-white px-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#194b3a] text-[10px] font-bold text-white">BN</div>
                  <span className="text-xs font-semibold">Visão geral</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#2f7a5c]" />
                  <span className="text-[10px] text-[#66716b]">Empresa ativa</span>
                </div>
              </div>
              <div className="grid grid-cols-[54px_1fr]">
                <aside className="flex flex-col items-center gap-4 border-r border-[#e2e4df] bg-white py-5">
                  {[Layers3, Users, WalletCards, Handshake].map((Icon, index) => (
                    <span key={index} className={`flex h-8 w-8 items-center justify-center rounded-md ${index === 0 ? 'bg-[#edf5f0] text-[#194b3a]' : 'text-[#9ba49f]'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                  ))}
                </aside>
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#7a857f]">Olá, Mariana</p>
                      <h2 className="mt-1 text-base font-semibold tracking-tight">Sua operação hoje</h2>
                    </div>
                    <button className="rounded-md bg-[#194b3a] px-3 py-2 text-[10px] font-semibold text-white">Novo benefício</button>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2.5">
                    {[['128', 'Colaboradores'], ['12', 'Benefícios'], ['04', 'Parcerias']].map(([value, label]) => (
                      <div key={label} className="rounded-lg border border-[#dde1dc] bg-white p-3">
                        <div className="text-lg font-semibold tracking-tight sm:text-xl">{value}</div>
                        <div className="mt-1 truncate text-[8px] text-[#738078] sm:text-[9px]">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-lg border border-[#dde1dc] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-semibold">Benefícios disponíveis</div>
                        <div className="mt-0.5 text-[8px] text-[#7a857f]">Organizados por categoria</div>
                      </div>
                      <Search className="h-3.5 w-3.5 text-[#7a857f]" />
                    </div>
                    <div className="mt-4 space-y-3">
                      {[
                        ['Saúde integral', 'Saúde', 'Ativo'],
                        ['Bolsa de estudos', 'Educação', 'Ativo'],
                        ['Mobilidade urbana', 'Transporte', 'Pendente'],
                      ].map(([name, category, status], index) => (
                        <div key={name} className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-[#edf0ec] pt-3 first:border-0 first:pt-0">
                          <div className="flex items-center gap-3">
                            <span className={`h-8 w-1 rounded-full ${index === 2 ? 'bg-[#d8a84e]' : 'bg-[#2f7a5c]'}`} />
                            <div>
                              <div className="text-[10px] font-semibold">{name}</div>
                              <div className="mt-0.5 text-[8px] text-[#7a857f]">{category}</div>
                            </div>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[7px] font-semibold ${index === 2 ? 'bg-[#fff5df] text-[#8a6118]' : 'bg-[#edf5f0] text-[#23664e]'}`}>{status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="produto" className="px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-8 border-b border-[#d9ddd8] pb-12 lg:grid-cols-[.75fr_1fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#2f7a5c]">O produto</p>
              <h2 className="mt-4 max-w-xl font-display text-4xl leading-[1.08] tracking-[-0.035em] sm:text-5xl">
                A estrutura que o RH precisa. Sem o peso de uma ferramenta complicada.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#66716b] lg:justify-self-end">
              Cada área da BNFix foi desenhada em torno de uma tarefa concreta. Sua equipe encontra o que precisa, entende o estado de cada operação e segue em frente.
            </p>
          </div>

          <div className="grid divide-y divide-[#d9ddd8] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {capabilities.map(({ icon: Icon, eyebrow, title, text }) => (
              <article key={title} className="py-10 first:pl-0 lg:px-8 lg:py-12 lg:first:pr-8 lg:last:pr-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e3eee7] text-[#194b3a]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-7 text-xs font-semibold uppercase tracking-[.14em] text-[#2f7a5c]">{eyebrow}</p>
                <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#66716b]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-[#edece6] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-24">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#2f7a5c]">Como funciona</p>
              <h2 className="mt-4 font-display text-4xl leading-[1.08] tracking-[-0.035em] sm:text-5xl">
                Da empresa cadastrada ao benefício utilizado.
              </h2>
              <p className="mt-5 text-sm leading-6 text-[#66716b]">
                Um fluxo direto, com responsabilidades claras para gestores e colaboradores.
              </p>
            </div>
            <ol className="border-t border-[#cdd2cc]">
              {flow.map(([number, title, text]) => (
                <li key={number} className="grid gap-4 border-b border-[#cdd2cc] py-7 sm:grid-cols-[72px_1fr_auto] sm:items-center">
                  <span className="font-mono text-xs text-[#86918b]">{number}</span>
                  <div>
                    <h3 className="text-lg font-semibold tracking-[-0.015em]">{title}</h3>
                    <p className="mt-1.5 max-w-xl text-sm leading-6 text-[#66716b]">{text}</p>
                  </div>
                  <ChevronRight className="hidden h-5 w-5 text-[#9aa39e] sm:block" />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="seguranca" className="px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto grid max-w-[1240px] overflow-hidden rounded-[20px] bg-[#163e30] text-white lg:grid-cols-[1.05fr_.95fr]">
          <div className="p-8 sm:p-12 lg:p-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <ShieldCheck className="h-6 w-6 text-[#e2b45b]" />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[.16em] text-[#a9c8b8]">Acesso e isolamento</p>
            <h2 className="mt-4 max-w-xl font-display text-4xl leading-[1.08] tracking-[-0.035em] sm:text-5xl">
              Cada pessoa vê o que precisa. Cada empresa cuida do que é seu.
            </h2>
            <p className="mt-6 max-w-xl text-sm leading-7 text-[#c8d8d0]">
              A plataforma usa autenticação por token, controle de acesso por perfil e separação dos dados por empresa no backend.
            </p>
          </div>
          <div className="grid gap-px bg-white/10">
            {[
              [LockKeyhole, 'Sessão autenticada', 'Acesso protegido para administradores, gestores e colaboradores.'],
              [Building2, 'Dados por empresa', 'Operações de gestão vinculadas à organização do usuário.'],
              [BadgeCheck, 'Permissões por função', 'Cada endpoint respeita o papel necessário para executar a ação.'],
            ].map(([Icon, title, text]) => {
              const FeatureIcon = Icon as typeof LockKeyhole;
              return (
                <div key={title as string} className="bg-[#12372a] p-7 sm:p-9">
                  <FeatureIcon className="h-5 w-5 text-[#e2b45b]" />
                  <h3 className="mt-4 text-base font-semibold">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#a9bdb3]">{text as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[#d9ddd8] bg-white px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto flex max-w-[1040px] flex-col items-center text-center">
          <HeartPulse className="h-7 w-7 text-[#2f7a5c]" />
          <h2 className="mt-6 max-w-3xl font-display text-4xl leading-[1.08] tracking-[-0.035em] sm:text-5xl">
            Benefício bom é aquele que cabe na operação e chega até as pessoas.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#66716b]">
            Comece cadastrando sua empresa. A BNFix organiza o caminho a partir daí.
          </p>
          <Link href="/cadastro" className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#194b3a] px-6 text-sm font-semibold text-white hover:bg-[#12372a]">
            Começar agora
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="bg-[#f6f5f1] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="" className="h-9 w-9 rounded-lg bg-white object-contain p-1 shadow-sm" />
            <div>
              <div className="text-sm font-semibold">BNFix</div>
              <div className="text-[11px] text-[#7a857f]">Gestão de benefícios corporativos</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-[#66716b]">
            <a href="#produto" className="hover:text-[#194b3a]">Produto</a>
            <a href="#como-funciona" className="hover:text-[#194b3a]">Como funciona</a>
            <Link href="/entrar" className="hover:text-[#194b3a]">Acessar plataforma</Link>
          </div>
          <p className="text-xs text-[#8a948e]">© 2026 BNFix</p>
        </div>
      </footer>
    </main>
  );
}
