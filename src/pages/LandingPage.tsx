import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { 
  Sparkles, Heart, Activity, BookOpen, Truck, Smile, ShieldAlert, Cpu, Palmtree, 
  Map, PhoneCall, ArrowRight, CheckCircle2, TrendingUp, Users, Star, MessageSquare 
} from 'lucide-react';
import { contactService, metricsService } from '../services/api';
import { Toast } from '../components/Toast';

export const LandingPage: React.FC<{ onNavigateToDashboardByRole: () => void }> = ({ onNavigateToDashboardByRole }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({ name: '', company: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [metrics, setMetrics] = useState({
    activeBenefitsCount: 24,
    usersCount: 1650,
    hiredBenefitsTotal: 840,
    satisfactionRate: 94.6,
    companiesRegisteredCount: 16
  });

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await metricsService.getDashboardMetrics();
        if (data) {
          setMetrics({
            activeBenefitsCount: data.activeBenefitsCount,
            usersCount: data.usersCount,
            hiredBenefitsTotal: data.hiredBenefitsTotal,
            satisfactionRate: data.satisfactionRate,
            companiesRegisteredCount: data.companiesRegisteredCount
          });
        }
      } catch (err) {
        console.warn('Could not fetch server live statistics. Fallback to offline defaults.', err);
      }
    };
    fetchMetrics();
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setToast({ visible: true, message: 'Por favor preencha os campos obrigatórios (Nome, E-mail, Mensagem).', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await contactService.submitContact(formData);
      setToast({ visible: true, message: 'Sua solicitação de demonstração foi registrada com sucesso! Retornaremos o contato em breve.', type: 'success' });
      setFormData({ name: '', company: '', email: '', phone: '', message: '' });
    } catch (err) {
      setToast({ visible: true, message: 'Ocorreu um erro ao enviar sua mensagem. Verifique a conexão com o servidor.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { title: 'Saúde', desc: 'Assistência integral e telemedicina', icon: Heart, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
    { title: 'Educação', desc: 'Bolsas, cursos e treinamentos', icon: BookOpen, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/20' },
    { title: 'Alimentação', desc: 'Cartões refeição e mercado', icon: Smile, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
    { title: 'Transporte', desc: 'Auxílio locomoção corporativo', icon: Truck, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/20' },
    { title: 'Bem-estar', desc: 'Ergonomia e hábitos saudáveis', icon: Activity, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
    { title: 'Tecnologia', desc: 'Subisídios para equipamentos e home office', icon: Cpu, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
    { title: 'Lazer', desc: 'Cinema, viagens e hospedagens', icon: Palmtree, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/20' },
    { title: 'Psicologia', desc: 'Aconselhamento e terapia online', icon: ShieldAlert, color: 'text-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-950/20' },
  ];

  const steps = [
    { num: '01', title: 'Fornecedor Cadastra', desc: 'Parceiros renomados cadastram benefícios de alta performance no ecossistema SaaS.' },
    { num: '02', title: 'RH Contrata', desc: 'O RH seleciona e contrata de forma integrada carteiras customizadas para colaboradores.' },
    { num: '03', title: 'Funcionário Solicita', desc: 'De forma 100% autônoma, colaboradores solicitam resgates de carteiras ativas.' },
    { num: '04', title: 'Sincronização & Uso', desc: 'RH aprova com inteligência, e funcionários utilizam vouchers em tempo real.' },
  ];

  return (
    <div className="fade-in">
      
      {/* Toast notifications */}
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

      {/* Hero Section */}
      <header id="hero" className="relative px-6 py-16 md:py-24 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          
          <div className="md:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-spin" /> Plataforma SaaS Inovadora
            </div>
            
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-slate-900 dark:text-white tracking-tight leading-tight">
              Transforme os benefícios corporativos em uma <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">ferramenta estratégica</span> de valorização dos colaboradores.
            </h1>
            
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed">
              Vá além dos vales tradicionais. Conecte de forma inteligente seus parceiros, RH e colaboradores em um ecossistema integrado com gamificação robusta, IA generativa e métricas ESG em tempo real.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={onNavigateToDashboardByRole}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm shadow-xl hover:shadow-emerald-500/10 hover:brightness-105 transition-all cursor-pointer"
              >
                Acessar Plataforma
                <ArrowRight className="w-4 h-4" />
              </button>
              <a 
                href="#contact" 
                className="px-6 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all"
              >
                Solicitar Demonstração
              </a>
            </div>
          </div>

          <div className="md:col-span-5 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl rounded-full"></div>
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600" 
              alt="Plataforma de Gestão de Benefícios Corporativos"
              className="rounded-2xl shadow-2xl relative border border-slate-200 dark:border-slate-800 max-h-[400px] object-cover w-full" 
            />
          </div>

        </div>
      </header>

      {/* Stats Board */}
      <section className="px-6 py-12 border-y border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div>
            <div className="font-display font-black text-3xl sm:text-4xl text-emerald-600 dark:text-emerald-400">{metrics.companiesRegisteredCount}+</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Empresas Contratantes</div>
          </div>
          <div>
            <div className="font-display font-black text-3xl sm:text-4xl text-emerald-600 dark:text-emerald-400">{metrics.activeBenefitsCount}+</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Benefícios Ativos</div>
          </div>
          <div>
            <div className="font-display font-black text-3xl sm:text-4xl text-emerald-600 dark:text-emerald-400">{metrics.usersCount}+</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Colaboradores Ativos</div>
          </div>
          <div>
            <div className="font-display font-black text-3xl sm:text-4xl text-emerald-600 dark:text-emerald-400">{metrics.hiredBenefitsTotal}+</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Resgates Concluídos</div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <div className="font-display font-black text-3xl sm:text-4xl text-teal-600 dark:text-teal-400">{metrics.satisfactionRate}%</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Índice NPS Geral</div>
          </div>
        </div>
      </section>

      {/* Benefits Categories */}
      <section id="benefits" className="px-6 py-16 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-800 dark:text-white leading-tight">
            Categorias de Benefícios no Ecossistema
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Ofereça muito mais que VT e VR. Nosso ecossistema atua com amplas frentes de qualidade corporal, educação e estabilidade mental para todas as necessidades.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, k) => {
            const Icon = cat.icon;
            return (
              <div 
                key={k} 
                className="p-5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl hover:border-emerald-500 dark:hover:border-emerald-500/30 hover:shadow-lg transition-all text-left flex gap-4"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100">{cat.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{cat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it Works Flow */}
      <section id="how-it-works" className="px-6 py-16 bg-slate-900 border-y border-slate-800/80 text-white">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-4">
            <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight text-white">Como Funciona a Jornada</h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              Simples, prático e integrado. Entenda o fluxo inteligente de ponta a ponta que agiliza processos burocráticos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((st, sIndex) => (
              <div key={sIndex} className="relative p-6 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-3 text-left">
                <span className="font-display font-black text-4xl text-emerald-500/20 absolute top-4 right-4">{st.num}</span>
                <span className="inline-flex py-1 px-2.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/10 text-emerald-400">Etapa</span>
                <h4 className="font-semibold text-sm text-white">{st.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Carousel of logos (Suppliers Partners) */}
      <section className="py-12 border-b border-slate-150 dark:border-slate-850 px-6 bg-slate-50/20 dark:bg-slate-950/25 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider mb-6">Empresas Clientes e Fornecedores Parceiros Associados</div>
          
          <div className="flex overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#f8fafc] dark:from-[#090d16] to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#f8fafc] dark:from-[#090d16] to-transparent z-10 pointer-events-none"></div>
            
            <div className="animate-slide whitespace-nowrap flex items-center gap-16 py-3">
              <span className="font-display font-extrabold text-slate-400/50 hover:text-emerald-500 text-lg transition-colors cursor-pointer">🍀 CAJU BENEFÍCIOS</span>
              <span className="font-display font-extrabold text-slate-400/50 hover:text-emerald-500 text-lg transition-colors cursor-pointer">🍎 ALIMENTA BRASIL</span>
              <span className="font-display font-extrabold text-slate-400/50 hover:text-emerald-500 text-lg transition-colors cursor-pointer font-mono tracking-tighter">GYMPASS / WELLHUB</span>
              <span className="font-display font-extrabold text-slate-400/50 hover:text-emerald-500 text-lg transition-colors cursor-pointer">🏥 PRIME SAÚDE</span>
              <span className="font-display font-extrabold text-slate-400/50 hover:text-emerald-500 text-lg transition-colors cursor-pointer">☯ ZENMIND CORP</span>
              <span className="font-display font-extrabold text-slate-400/50 hover:text-emerald-500 text-lg transition-colors cursor-pointer">🎓 INFINITY EDU</span>
              
              <span className="font-display font-extrabold text-slate-400/50 hover:text-emerald-500 text-lg transition-colors cursor-pointer">🍀 CAJU BENEFÍCIOS</span>
              <span className="font-display font-extrabold text-slate-400/50 hover:text-emerald-500 text-lg transition-colors cursor-pointer">🍎 ALIMENTA BRASIL</span>
              <span className="font-display font-extrabold text-slate-400/50 hover:text-emerald-500 text-lg transition-colors cursor-pointer font-mono tracking-tighter">GYMPASS / WELLHUB</span>
              <span className="font-display font-extrabold text-slate-400/50 hover:text-emerald-500 text-lg transition-colors cursor-pointer">🏥 PRIME SAÚDE</span>
              <span className="font-display font-extrabold text-slate-400/50 hover:text-emerald-500 text-lg transition-colors cursor-pointer">☯ ZENMIND CORP</span>
              <span className="font-display font-extrabold text-slate-400/50 hover:text-emerald-500 text-lg transition-colors cursor-pointer">🎓 INFINITY EDU</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 py-16 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-800 dark:text-white tracking-tight">O que dizem os clientes</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Histórias de sucesso de RHs estratégicos e colaboradores engajados que mudaram sua relação corporativa diária.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="p-6 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 text-left shadow-sm">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />)}
            </div>
            <p className="text-slate-600 dark:text-slate-300 italic text-sm leading-relaxed">
              &quot;Substituímos toda burocracia das solicitações de benefícios por e-mail pelo portal do BeneficiSaaS. Agora o time tem tudo liberado pelo QR Code na hora, e nossa visibilidade financeira de relatórios cresceu exponencialmente!&quot;
            </p>
            <div className="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100" alt="Ana Paula" className="w-10 h-10 rounded-full" />
              <div>
                <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100">Ana Paula Guedes</h5>
                <span className="text-[10px] text-slate-400 font-medium">Head de RH na TechNext S.A.</span>
              </div>
            </div>
          </div>

          <div className="p-6 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 text-left shadow-sm">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />)}
            </div>
            <p className="text-slate-600 dark:text-slate-300 italic text-sm leading-relaxed">
              &quot;O programa de gamificação e o chatbot analítico trazem uma interação inovadora fora do padrão. Consigo planejar meu uso semanal acumulando pontos por frequentar a academia, sob altos níveis de engajamento generalizado.&quot;
            </p>
            <div className="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" alt="Luís Antunes" className="w-10 h-10 rounded-full" />
              <div>
                <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100">Luís Antunes</h5>
                <span className="text-[10px] text-slate-400 font-medium">Engenheiro de Software na Acme Dev</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Demo Request / Contact Form */}
      <section id="contact" className="px-6 py-16 bg-slate-50 dark:bg-slate-950 border-t border-slate-150 dark:border-slate-900 flex items-center justify-center">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-left">
          
          <div className="p-8 bg-slate-900 text-white flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold tracking-wide uppercase">Demonstração Atendida</span>
              <h3 className="font-display font-bold text-2xl tracking-tight leading-tight">Quer otimizar os recursos do seu RH estratégico?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Preencha os dados e fale com nossa consultoria analítica especializada. Montamos uma proposta de simulação com base no porte de colaboradores da sua empresa em até 24 horas úteis.
              </p>
            </div>
            
            <div className="flex gap-2.5 items-center text-xs text-slate-400 pt-4 border-t border-slate-800">
              <PhoneCall className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="block font-bold">Atendimento Direto</span>
                <span>(11) 3220-4040 ou corporativo@beneficios.com</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleContactSubmit} className="p-8 space-y-4">
            <h4 className="font-display font-extrabold text-md text-slate-800 dark:text-slate-100">Seja parceiro corporativo</h4>
            
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="Seu nome completo *" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs p-3 rounded-xl outline-none border border-slate-200 dark:border-slate-800 focus:border-emerald-500 transition-all font-medium"
                />
                <input 
                  type="text" 
                  placeholder="Nome do seu RH/Empresa" 
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs p-3 rounded-xl outline-none border border-slate-200 dark:border-slate-800 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input 
                  type="email" 
                  placeholder="Seu e-mail de negócios *" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs p-3 rounded-xl outline-none border border-slate-200 dark:border-slate-800 focus:border-emerald-500 transition-all"
                />
                <input 
                  type="tel" 
                  placeholder="Telefone comercial" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs p-3 rounded-xl outline-none border border-slate-200 dark:border-slate-800 focus:border-emerald-500 transition-all"
                />
              </div>

              <textarea 
                rows={4}
                required
                placeholder="Qual o volume médio de funcionários e seu principal desafio corporativo? *"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs p-3 rounded-xl outline-none border border-slate-200 dark:border-slate-800 focus:border-emerald-500 transition-all resize-none"
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              {submitting ? 'Enviando Dados...' : 'Receber Proposta de Demonstração'}
            </button>
          </form>

        </div>
      </section>

    </div>
  );
};
