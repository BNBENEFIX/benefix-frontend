import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './screens/LoginPage';
import { RegisterPage } from './screens/RegisterPage';
import { DashboardAdmin } from './screens/DashboardAdmin';
import { DashboardSupplier } from './screens/DashboardSupplier';
import { DashboardRH } from './screens/DashboardRH';
import { SharedBenefitsHub } from './screens/SharedBenefitsHub';
import { BenefitsCatalog } from './screens/BenefitsCatalog';
import { CompanyProfile } from './screens/CompanyProfile';
import { ProviderBenefitsConsole } from './components/ProviderBenefitsConsole';
import { Building2, LayoutDashboard, ShoppingBag, Loader2, Users } from 'lucide-react';

// ── Conteúdo principal (autenticado) ─────────────────────────────────────────

const AuthenticatedApp: React.FC = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'EMPLOYEE';
  const [activeTab, setActiveTab] = useState<'catalog' | 'dashboard' | 'company' | 'employees'>(
    isEmployee ? 'catalog' : 'dashboard',
  );

  const renderDashboard = () => {
    if (!user) return null;
    switch (user.role) {
      case 'ADMIN':    return <DashboardAdmin />;
      case 'SUPPLIER': return <DashboardSupplier />;
      case 'COMPANY':  return <ProviderBenefitsConsole />;
      case 'EMPLOYEE': return <SharedBenefitsHub />;
      default:         return null;
    }
  };

  const tabClass = (tab: typeof activeTab) =>
    activeTab === tab
      ? 'bg-[var(--action)] text-[var(--action-ink)]'
      : 'text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]';

  return (
    <div className="flex flex-col min-h-screen bg-app transition-colors">
      <Navbar />

      {/* O colaborador tem uma única jornada; esconder abas duplicadas reduz
          decisões antes da ação principal "Mostrar QR Code". */}
      {!isEmployee && (
        <div className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-[1180px] items-center gap-2 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex h-10 items-center gap-2 rounded-lg px-4 transition-colors ${tabClass('dashboard')}`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Painel</span>
            </button>
            {user?.role === 'COMPANY' && (
              <button
                onClick={() => setActiveTab('employees')}
                className={`flex h-10 items-center gap-2 rounded-lg px-4 transition-colors ${tabClass('employees')}`}
              >
                <Users className="h-4 w-4" />
                <span>Colaboradores</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex h-10 items-center gap-2 rounded-lg px-4 transition-colors ${tabClass('catalog')}`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{user?.role === 'COMPANY' ? 'Benefícios' : 'Catálogo'}</span>
            </button>
            {user?.role === 'COMPANY' && (
              <button
                onClick={() => setActiveTab('company')}
                className={`flex h-10 items-center gap-2 rounded-lg px-4 transition-colors ${tabClass('company')}`}
              >
                <Building2 className="h-4 w-4" />
                <span>Empresa</span>
              </button>
            )}
          </div>
        </div>
      )}

      <main
        key={`${user?.role ?? 'anonymous'}:${user?.companyId ?? 'no-company'}`}
        className="flex-1 bg-[var(--canvas)] transition-colors"
      >
        {isEmployee
          ? <SharedBenefitsHub />
          : activeTab === 'catalog'
            ? <BenefitsCatalog />
            : activeTab === 'company' && user?.role === 'COMPANY'
              ? <CompanyProfile />
              : activeTab === 'employees' && user?.role === 'COMPANY'
                ? <DashboardRH />
            : renderDashboard()}
      </main>
    </div>
  );
};

// ── Roteamento de autenticação ────────────────────────────────────────────────

type AuthScreen = 'login' | 'register';

const AppContent: React.FC<{ initialAuthScreen?: AuthScreen }> = ({ initialAuthScreen = 'login' }) => {
  const { user, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreen>(initialAuthScreen);

  // Spinner global enquanto carrega sessão
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Carregando sessão...
          </span>
        </div>
      </div>
    );
  }

  // A presença do usuário no contexto é a única fonte de verdade da sessão.
  // Assim logout e desativação sempre retornam corretamente ao login.
  if (user) {
    return <AuthenticatedApp />;
  }

  // Tela de cadastro
  if (authScreen === 'register') {
    return (
      <RegisterPage
        onBackToLogin={() => setAuthScreen('login')}
        onRegisterSuccess={() => setAuthScreen('login')}
      />
    );
  }

  // Tela de login (com link para cadastro)
  return (
    <LoginPage
      onLoginSuccess={() => setAuthScreen('login')}
      onNavigateToRegister={() => setAuthScreen('register')}
    />
  );
};

// ── Root ─────────────────────────────────────────────────────────────────────

export default function App({ initialAuthScreen = 'login' }: { initialAuthScreen?: AuthScreen }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent initialAuthScreen={initialAuthScreen} />
      </AuthProvider>
    </ThemeProvider>
  );
}
