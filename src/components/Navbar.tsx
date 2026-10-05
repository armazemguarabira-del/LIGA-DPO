import React, { useState } from 'react';
import {
  Trophy,
  UserCheck,
  Camera,
  FileText,
  Sliders,
  Database,
  ChevronDown,
  Warehouse,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Eye,
  Lock,
  Unlock,
  Target,
  LogOut,
} from 'lucide-react';
import { User, ROLE_LABELS, ROLE_BADGE_COLORS, ROLE_ICONS } from '../types/dpo';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
  onOpenWmsModal: () => void;
  onOpenCritiques: () => void;
  onLogout: () => void;
  isGestor: boolean;
  onToggleGestorMode: () => void;
  pendingFiveSCount: number;
  pendingCritiquesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenLogin,
  onOpenWmsModal,
  onOpenCritiques,
  onLogout,
  isGestor,
  onToggleGestorMode,
  pendingFiveSCount,
  pendingCritiquesCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#070b14]/95 backdrop-blur-md border-b border-slate-800/80 shadow-2xl">
      {/* Top micro status bar */}
      <div className="hidden sm:block border-b border-slate-800/40 bg-slate-950/60 text-[11px] text-slate-400 py-1 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-semibold text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIGA DPO OFICIAL • ARMAZÉM
            </span>
            <span className="text-slate-600">|</span>
            <span>4 Cargos • 15 Colaboradores • 60 Metas</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-medium">Teto Diário: 6.0 Pontos</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400 font-medium">Desempate: 1º Relatos / 2º 5S Extra</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleGestorMode}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all ${
                isGestor
                  ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
              }`}
            >
              {isGestor ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {isGestor ? 'Acesso: GESTOR (Completo)' : 'Acesso: PARTICIPANTE (Restrito)'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 font-black">
              <Warehouse className="w-5 h-5 text-slate-950" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white">
                  LIGA DPO <span className="text-amber-400">ARMAZÉM</span>
                </span>
                <span
                  className={`hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isGestor
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isGestor ? 'GESTOR' : 'PARTICIPANTE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Ranking de Excelência & Metas Individuais
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Subject to Access Level) */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* 1. Ranking da Liga (Accessible to all) */}
            <button
              onClick={() => setActiveTab('ranking')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'ranking'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Ranking da Liga
            </button>

            {/* 2. Meu Progresso Diário (Accessible to all) */}
            <button
              onClick={() => setActiveTab('meu-painel')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'meu-painel'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Meu Progresso Diário
              {currentUser && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-black/20 text-current">
                  6.0 pts
                </span>
              )}
            </button>

            {/* 3. Pontuação do Supervisor (ONLY GESTOR / SUPERVISOR) */}
            {isGestor && (
              <button
                onClick={() => setActiveTab('pontuacao-supervisor')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'pontuacao-supervisor'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Target className="w-4 h-4 text-amber-400" />
                Pontuação do Supervisor
              </button>
            )}

            {/* 4. Auditoria 5S (ONLY GESTOR) */}
            {isGestor && (
              <button
                onClick={() => setActiveTab('5s')}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === '5s'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Camera className="w-4 h-4" />
                Auditoria 5S
                {pendingFiveSCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                    {pendingFiveSCount}
                  </span>
                )}
              </button>
            )}

            {/* 5. Relatórios & PDF (ONLY GESTOR) */}
            {isGestor && (
              <button
                onClick={() => setActiveTab('relatorios')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'relatorios'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FileText className="w-4 h-4" />
                Relatórios & PDF
              </button>
            )}

            {/* 6. Cadastros & Metas (ONLY GESTOR) */}
            {isGestor && (
              <button
                onClick={() => setActiveTab('cadastros')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'cadastros'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sliders className="w-4 h-4" />
                Cadastros & Metas
              </button>
            )}
          </nav>

          {/* Right Action Profile & Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Contestações/Críticas button */}
            <button
              onClick={onOpenCritiques}
              title="Solicitações de Crítica / Contestações"
              className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              {pendingCritiquesCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-black text-[9px]">
                  {pendingCritiquesCount}
                </span>
              )}
            </button>

            {/* JSON / WMS Integration button (Gestor only) */}
            {isGestor && (
              <button
                onClick={onOpenWmsModal}
                title="Importar / Exportar JSON da Liga e WMS"
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition-colors hidden sm:flex"
              >
                <Database className="w-4 h-4" />
              </button>
            )}

            {/* Active User Card & Switcher */}
            {currentUser && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenLogin}
                  title="Trocar usuário ativo"
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-left transition-all group cursor-pointer"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-amber-500/40"
                  />
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                        {currentUser.name}
                      </span>
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-700 text-slate-300">
                        {currentUser.matricula}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>{ROLE_ICONS[currentUser.role]}</span>
                      <span>{ROLE_LABELS[currentUser.role]}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
                </button>

                <button
                  onClick={onLogout}
                  title="Sair da plataforma / Encerrar sessão"
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center justify-between overflow-x-auto py-2.5 border-t border-slate-800/60 gap-1 scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium flex items-center gap-1.5 ${
              activeTab === 'ranking' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Ranking
          </button>
          <button
            onClick={() => setActiveTab('meu-painel')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium flex items-center gap-1.5 ${
              activeTab === 'meu-painel' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Meu Painel
          </button>
          {isGestor && (
            <>
              <button
                onClick={() => setActiveTab('pontuacao-supervisor')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium flex items-center gap-1.5 ${
                  activeTab === 'pontuacao-supervisor' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                Pontuar
              </button>
              <button
                onClick={() => setActiveTab('5s')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium flex items-center gap-1.5 ${
                  activeTab === '5s' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                5S
              </button>
              <button
                onClick={() => setActiveTab('relatorios')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium flex items-center gap-1.5 ${
                  activeTab === 'relatorios' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Relatórios
              </button>
              <button
                onClick={() => setActiveTab('cadastros')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium flex items-center gap-1.5 ${
                  activeTab === 'cadastros' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Cadastros
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
