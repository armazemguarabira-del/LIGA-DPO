import React from 'react';
import {
  Trophy,
  UserCheck,
  Bell,
  LogOut,
  Warehouse,
  ShieldCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { User, ROLE_LABELS, ROLE_BADGE_COLORS, ROLE_ICONS } from '../types/dpo';

interface NavbarParticipantProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
  unreadNotificationsCount: number;
  onToggleGestorMode?: () => void;
  isGestorSession?: boolean;
}

export const NavbarParticipant: React.FC<NavbarParticipantProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenNotifications,
  onLogout,
  unreadNotificationsCount,
  onToggleGestorMode,
  isGestorSession,
}) => {
  const roleBadge = ROLE_BADGE_COLORS[currentUser.role];

  return (
    <header className="sticky top-0 z-40 bg-[#070b14]/95 backdrop-blur-md border-b border-slate-800/80 shadow-2xl">
      {/* Top micro ticker */}
      <div className="hidden sm:block border-b border-slate-800/40 bg-slate-950/60 text-[11px] text-slate-400 py-1 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 font-bold text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIGA DPO ARMAZÉM
            </span>
            <span className="text-slate-600">|</span>
            <span>Meta Diária: 6.0 Pontos</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              Desempates: 1º Relatos de Anomalia • 2º 5S em mais de uma área
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span>
              Logado como: <strong className="text-white">{currentUser.name}</strong> ({currentUser.matricula})
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* 1. Brand Logo */}
          <div className="flex items-center gap-2.5 shrink-0 min-w-0">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 font-black">
              <Warehouse className="w-5 h-5 text-slate-950 shrink-0" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
              </span>
            </div>

            <div className="min-w-0">
              <span className="text-sm sm:text-lg font-black tracking-tight text-white block truncate">
                LIGA DPO <span className="text-amber-400">ARMAZÉM</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium block truncate">
                Painel do Colaborador
              </span>
            </div>
          </div>

          {/* 2. Primary Navigation Tabs (Ranking & Meu Progresso) */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            {/* Ranking da Liga */}
            <button
              onClick={() => setActiveTab('ranking')}
              className={`flex items-center gap-2 px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'ranking'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 bg-slate-900/50 border border-slate-800'
              }`}
            >
              <Trophy className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Ranking da Liga</span>
              <span className="sm:hidden">Ranking</span>
            </button>

            {/* Meu Progresso Diário */}
            <button
              onClick={() => setActiveTab('meu-painel')}
              className={`flex items-center gap-2 px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'meu-painel'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 bg-slate-900/50 border border-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Meu Progresso Diário</span>
              <span className="sm:hidden">Meu Painel</span>
            </button>
          </nav>

          {/* 3. Right Interactive Actions: Sininho de Notificação & Botão de Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Sininho de Notificação */}
            <button
              onClick={onOpenNotifications}
              title="Notificações de 5S e Relatos Aprovados"
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4 shrink-0" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-black text-[9px] shadow-sm animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* User Profile Info - Visível com Avatar também no Mobile */}
            <div className="flex items-center gap-2 p-1 sm:p-1.5 sm:pr-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-amber-500/40 shrink-0"
              />
              <div className="min-w-0 text-left hidden sm:block">
                <span className="text-xs font-bold text-white block truncate leading-none">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block truncate">
                  {currentUser.matricula} • {ROLE_LABELS[currentUser.role]}
                </span>
              </div>
            </div>

            {/* Botão de Retorno ao Modo Gestor */}
            {onToggleGestorMode &&
              (isGestorSession ||
                currentUser.matricula === 'G1002' ||
                currentUser.accessLevel === 'supervisor' ||
                currentUser.accessLevel === 'gerente') && (
                <button
                  onClick={onToggleGestorMode}
                  title="Voltar ao Painel do Gestor"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer shrink-0"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0 text-slate-950 stroke-[2.5]" />
                  <span className="hidden sm:inline">Voltar ao Módulo Gestor</span>
                  <span className="sm:hidden">Modo Gestor</span>
                </button>
              )}

            {/* Botão de Log Out */}
            <button
              onClick={onLogout}
              title="Sair da plataforma / Encerrar sessão"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
