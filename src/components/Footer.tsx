import React from 'react';
import { Shield, Sparkles, Send, Mail, MapPin, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="footer" className="bg-slate-900 text-slate-400 border-t border-slate-800 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Info Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white tracking-tight">BeneficiSaaS</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Plataforma inovadora de inteligência analítica para gestão moderna e engajamento em benefícios corporativos reais.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
            <Shield className="w-4 h-4 text-emerald-500" />
            Conformidade LGPD garantida
          </div>
        </div>

        {/* Categories Column */}
        <div>
          <h4 className="text-sm font-semibold tracking-wider text-slate-200 uppercase mb-4">Recursos</h4>
          <ul className="space-y-2.5 text-sm">
            <li><a href="#hero" className="hover:text-emerald-400 transition-colors">Inicial</a></li>
            <li><a href="#benefits" className="hover:text-emerald-400 transition-colors">Categorias</a></li>
            <li><a href="#how-it-works" className="hover:text-emerald-400 transition-colors">Como Funciona</a></li>
            <li><a href="#testimonials" className="hover:text-emerald-400 transition-colors">Clientes Satisfeitos</a></li>
            <li><a href="#contact" className="hover:text-emerald-400 transition-colors text-emerald-400">Suporte & Negócios</a></li>
          </ul>
        </div>

        {/* Contact Column */}
        <div>
          <h4 className="text-sm font-semibold tracking-wider text-slate-200 uppercase mb-4">Contato & Endereço</h4>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-500" />
              corporativo@beneficisaas.com.br
            </li>
            <li className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-500" />
              0800 550 400
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              Av. Paulista, 1000 - Bela Vista, SP
            </li>
          </ul>
        </div>

        {/* ESG / Commitment Column */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold tracking-wider text-slate-200 uppercase mb-4">Newsletter Analítica</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cadastre-se para receber relatórios mensais exclusivos de tendências de bem-estar corporal.
          </p>
          <form className="relative" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Seu e-mail corporativo..." 
              className="w-full bg-slate-800 text-white text-xs px-4 py-2.5 rounded-xl outline-none border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all pr-10"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 BeneficiSaaS Tecnologias S.A. Todos os direitos reservados.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:underline">Políticas de Privacidade</a>
          <a href="#" className="hover:underline">Termos de Uso</a>
          <a href="#" className="hover:underline">Relatórios ESG</a>
        </div>
      </div>
    </footer>
  );
};
