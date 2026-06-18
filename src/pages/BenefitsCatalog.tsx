import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { benefitService, recommendationService } from '../services/api';
import { partnershipService } from '../services/partnershipService';
import { Benefit, BenefitCategory } from '../types';
import { Search, Filter, Star, Sparkles, Send, Heart, Eye, RefreshCw, Bookmark } from 'lucide-react';
import { Toast } from '../components/Toast';

export const BenefitsCatalog: React.FC = () => {
  const { user } = useAuth();
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [recommendations, setRecommendations] = useState<Benefit[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('employee_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [loading, setLoading] = useState(true);

  // Filter/Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BenefitCategory | 'Todos'>('Todos');
  const [sortBy, setSortBy] = useState<'rating' | 'popular'>('popular');

  // Request benefit modal
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const allB = await benefitService.getBenefits();
      const recommended = await recommendationService.getRecommendations();
      
      setBenefits(allB);
      setRecommendations(recommended);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const toggleFavorite = (id: string) => {
    let updated: string[];
    if (favorites.includes(id)) {
      updated = favorites.filter(fId => fId !== id);
      setToast({ visible: true, message: 'Benefício removido dos seus favoritos.', type: 'info' });
    } else {
      updated = [...favorites, id];
      setToast({ visible: true, message: 'Benefício favoritado com sucesso! Acesse rapidamente pela sua carteira.', type: 'success' });
    }
    setFavorites(updated);
    localStorage.setItem('employee_favorites', JSON.stringify(updated));
  };

  const handleRequestBenefit = async () => {
    if (!selectedBenefit) return;
    try {
      const partnership = await partnershipService.request({
        benefitId: selectedBenefit.backendId ?? Number(selectedBenefit.id),
      });

      setToast({
        visible: true,
        message: `Solicitação de parceria para "${selectedBenefit.name}" enviada com sucesso. Partnership ID: ${partnership.id}.`,
        type: 'success',
      });
      setSelectedBenefit(null);
    } catch (err) {
      console.error(err);
      setToast({ visible: true, message: 'Falha técnica ao registrar a solicitação de parceria.', type: 'error' });
    }
  };

  // Filter lists
  const filteredBenefits = benefits.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    return b.ratingCount - a.ratingCount; // simple popularity by total votes
  });

  const categoriesList: (BenefitCategory | 'Todos')[] = [
    'Todos', 'Saúde', 'Academias', 'Educação', 'Psicologia', 'Alimentação', 'Telemedicina'
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Carregando Catálogo Especial...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 text-left fade-in">
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, visible: false })} />

      {/* Intelligent AI Recommendation Banner */}
      {user?.role === 'EMPLOYEE' && recommendations.length > 0 && (
        <div className="p-5 border border-emerald-500/15 bg-emerald-500/5 dark:bg-emerald-950/10 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">Módulos Inteligentes AI Direct</h4>
              <span className="text-[10px] text-slate-400">Recomendações com base em seu perfil clínico e engajamento corporativo anterior.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {recommendations.slice(0, 2).map((rec) => (
              <div key={rec.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h5 className="font-bold text-xs text-slate-800 dark:text-gray-100 leading-tight">{rec.name}</h5>
                  <span className="text-[9px] text-emerald-500 dark:text-emerald-450 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">98% Compatível</span>
                </div>
                <button 
                  onClick={() => setSelectedBenefit(rec)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg shrink-0 transition-colors cursor-pointer"
                >
                  Solicitar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Filter Control Header */}
      <div className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-4 shadow-sm">
        
        {/* Search Input and Sort selector */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar benefícios por palavras-chave, redes ou parceiros..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-200 text-xs py-2.5 pl-10 pr-4 rounded-xl outline-none border border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end text-xs">
            <span className="text-slate-400 font-medium">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="p-1.5 rounded-lg border border-slate-250 dark:border-slate-751 bg-slate-50 dark:bg-slate-955 text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="popular">Mais Requisitados</option>
              <option value="rating">Maior Avaliação</option>
            </select>
          </div>

        </div>

        {/* Categories Pills bar */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
          {categoriesList.map((cat, ci) => (
            <button
              key={ci}
              onClick={() => setSelectedCategory(cat)}
              className={`p-1.5 px-3.5 rounded-lg text-[11px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10' 
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Grid of Results */}
      <div>
        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">Total de {filteredBenefits.length} Benefícios Localizados</div>
        
        {filteredBenefits.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl min-h-[250px] flex flex-col items-center justify-center">
            <Filter className="w-8 h-8 text-slate-350 dark:text-slate-650 animate-bounce mb-3" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhum resultado corresponde aos seus filtros de busca.</span>
            <span className="text-xs text-slate-400 mt-1">Experimente buscar por outros termos ou redefinir as categorias acima.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBenefits.map((b) => (
              <div 
                key={b.id} 
                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm group hover:border-emerald-500 dark:hover:border-emerald-500/40 hover:shadow-lg transition-all"
              >
                
                {/* Header Image */}
                <div className="relative">
                  <img src={b.imageUrl} alt={b.name} className="w-full h-40 object-cover" />
                  <span className="absolute top-3.5 right-3.5 text-[8.5px] font-extrabold uppercase bg-slate-900/80 text-white py-1 px-2.5 rounded-md backdrop-blur-sm">
                    {b.category}
                  </span>
                  <span className={`absolute top-3.5 left-3.5 text-[8.5px] font-extrabold uppercase py-1 px-2.5 rounded-md backdrop-blur-sm ${b.active !== false ? 'bg-emerald-500/90 text-white' : 'bg-slate-700/90 text-slate-100'}`}>
                    {b.active !== false ? 'Ativo' : 'Inativo'}
                  </span>
                  
                  {user?.role === 'EMPLOYEE' && b.active !== false && (
                    <button 
                      onClick={() => toggleFavorite(b.id)}
                      className="absolute top-3.5 left-3.5 p-2 rounded-full glass-effect hover:bg-white text-rose-500 transition-all cursor-pointer shadow-md"
                      aria-label="Adicionar aos favoritos"
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(b.id) ? 'fill-rose-500' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Content body */}
                <div className="p-5 text-left flex-1 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">{b.supplierName}</span>
                    <h4 className="font-bold text-md text-slate-800 dark:text-slate-100 leading-snug group-hover:text-emerald-500 transition-colors">{b.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed line-clamp-2 mt-1">{b.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Avaliação:</span>
                      <span className="font-bold text-amber-500 flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {b.rating} ({b.ratingCount})
                      </span>
                    </div>
                    {b.rules && (
                      <p className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg italic">
                        <strong>Regra:</strong> {b.rules}
                      </p>
                    )}
                  </div>

                  {user?.role === 'EMPLOYEE' ? (
                    <button
                      onClick={() => setSelectedBenefit(b)}
                      disabled={b.active === false}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer text-center block transition-transform group-hover:scale-[1.01]"
                    >
                      {b.active === false ? 'Indisponível' : 'Solicitar Parceria'}
                    </button>
                  ) : (
                    <div className="text-[10px] text-center font-bold text-slate-400 uppercase py-2 bg-slate-100/50 dark:bg-slate-950/40 rounded-xl">
                      Visualização de Sandbox ({user?.role})
                    </div>
                  )}

                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Solicitation confirm Modal */}
      {selectedBenefit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-left">
            <div className="space-y-1">
              <span className="text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 px-2 py-0.5 rounded-md">
                Confirmar Solicitação de Parceria
              </span>
              <h4 className="font-display font-black text-md text-slate-850 dark:text-neutral-50 pt-1">Deseja solicitar parceria com este benefício?</h4>
              <p className="text-xs text-slate-400 uppercase tracking-wide leading-tight">{selectedBenefit.name}</p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Ao solicitar a parceria, o pedido será encaminhado ao administrador responsável por este benefício para aprovação, rejeição ou desabilitação.
            </p>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button 
                type="button" onClick={() => setSelectedBenefit(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button" onClick={handleRequestBenefit}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md cursor-pointer"
              >
                Gerar Solicitação de Parceria
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
