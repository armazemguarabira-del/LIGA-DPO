import React, { useState, useRef } from 'react';
import {
  Warehouse,
  Trophy,
  Target,
  Camera,
  AlertOctagon,
  FileText,
  Sliders,
  Database,
  Calendar,
  HelpCircle,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Lock,
  Unlock,
  Sparkles,
  ShieldAlert,
  Upload,
  UserCheck,
} from 'lucide-react';
import { User, ROLE_LABELS, ROLE_ICONS } from '../types/dpo';
import { storageService } from '../services/storageService';
import { compressImage } from '../services/imageCompression';

interface SidebarGestorProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenWmsModal: () => void;
  onOpenMonthlyHistory: () => void;
  onOpenCritiques: () => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
  onToggleGestorMode: () => void;
  pendingFiveSCount: number;
  pendingSafetyCount: number;
  pendingCritiquesCount: number;
  unreadNotificationsCount: number;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onGestorPhotoUpdated?: () => void;
}

export const SidebarGestor: React.FC<SidebarGestorProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenWmsModal,
  onOpenMonthlyHistory,
  onOpenCritiques,
  onOpenNotifications,
  onLogout,
  onToggleGestorMode,
  pendingFiveSCount,
  pendingSafetyCount,
  pendingCritiquesCount,
  unreadNotificationsCount,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  onGestorPhotoUpdated,
}) => {
  const gestorPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleGestorPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const photoUrl = await compressImage(file, 256, 256, 0.82);
    storageService.updateGestorPhoto(photoUrl, currentUser.id);
    if (onGestorPhotoUpdated) {
      onGestorPhotoUpdated();
    }
  };
  const menuItems = [
    {
      id: 'ranking',
      label: 'Ranking da Liga',
      sublabel: 'Visão Geral & Cargos',
      icon: Trophy,
      isAction: false,
    },
    {
      id: 'pontuacao-supervisor',
      label: 'Pontuação Supervisor',
      sublabel: 'Lançamento Diário (4 Metas)',
      icon: Target,
      isAction: false,
    },
    {
      id: '5s',
      label: 'Auditoria 5S com Foto',
      sublabel: 'Validação e Sensos',
      icon: Camera,
      badge: pendingFiveSCount > 0 ? pendingFiveSCount : null,
      badgeColor: 'bg-rose-500 text-white',
      isAction: false,
    },
    {
      id: 'relatos-anomalias',
      label: 'Relatos de Anomalia',
      sublabel: 'Aprovação para Pontuar',
      icon: AlertOctagon,
      badge: pendingSafetyCount > 0 ? pendingSafetyCount : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-black',
      isAction: false,
    },
    {
      id: 'relatorios',
      label: 'Relatórios DPO (PDF)',
      sublabel: 'Exportação & Auditoria',
      icon: FileText,
      isAction: false,
    },
    {
      id: 'cadastros',
      label: 'Cadastros & Metas',
      sublabel: 'Configurar 60 Metas',
      icon: Sliders,
      isAction: false,
    },
  ];

  const secondaryActions = [
    {
      id: 'wms',
      label: 'Integração WMS / JSON',
      icon: Database,
      onClick: onOpenWmsModal,
    },
    {
      id: 'historico',
      label: 'Histórico Mensal 2026',
      icon: Calendar,
      onClick: onOpenMonthlyHistory,
    },
    {
      id: 'criticas',
      label: 'Contestações de Pontos',
      icon: HelpCircle,
      badge: pendingCritiquesCount > 0 ? pendingCritiquesCount : null,
      onClick: onOpenCritiques,
    },
    {
      id: 'participante-switch',
      label: 'Módulo do Participante',
      icon: UserCheck,
      badge: null,
      onClick: () => {
        onToggleGestorMode();
        setIsMobileOpen(false);
      },
    },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#080d1a] border-r border-slate-800/80 shadow-2xl transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        {/* Header / Brand */}
        <div
          className={`border-b border-slate-800/80 bg-slate-950/80 transition-all ${
            isCollapsed
              ? 'py-4 px-2 flex flex-col items-center justify-center gap-3'
              : 'p-4 flex items-center justify-between gap-3'
          }`}
        >
          {/* Logo & Brand Info */}
          <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'justify-center w-full' : ''}`}>
            {/* Casinha Button - Clicar nela quando recolhido também expande a barra! */}
            <button
              type="button"
              onClick={() => {
                if (isCollapsed) setIsCollapsed(false);
              }}
              title={isCollapsed ? 'Clique para expandir a barra lateral' : 'LIGA DPO ARMAZÉM'}
              className={`relative w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 font-black transition-all ${
                isCollapsed ? 'cursor-pointer hover:scale-105 hover:ring-2 hover:ring-amber-400' : ''
              }`}
            >
              <Warehouse className="w-5 h-5 text-slate-950 shrink-0" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
              </span>
            </button>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-white text-base tracking-tight truncate">
                    LIGA DPO <span className="text-amber-400">GESTOR</span>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    PAINEL LATERAL
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dedicated Collapse toggle (desktop) / Close (mobile) - Espaçado e sem sobreposição */}
          <div className={`flex items-center shrink-0 ${isCollapsed ? 'w-full justify-center' : 'ml-auto'}`}>
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expandir barra lateral' : 'Ocultar barra lateral'}
              className={`hidden lg:flex rounded-xl bg-slate-800/90 hover:bg-amber-500 hover:text-slate-950 text-slate-300 items-center justify-center transition-all shrink-0 border border-slate-700/60 shadow-sm cursor-pointer ${
                isCollapsed ? 'w-11 h-8 mt-1' : 'w-8 h-8'
              }`}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 shrink-0" />
              ) : (
                <PanelLeftClose className="w-4 h-4 shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden w-8 h-8 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center shrink-0 cursor-pointer"
              title="Fechar menu lateral"
            >
              <X className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>

        {/* Quick Notification Bell Banner */}
        <div className="p-3 border-b border-slate-800/60 bg-slate-950/30">
          <button
            onClick={() => {
              onOpenNotifications();
              setIsMobileOpen(false);
            }}
            className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all ${
              unreadNotificationsCount > 0
                ? 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300'
                : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800'
            } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
            title="Central de Notificações"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0 text-amber-400">
                <Bell className="w-4 h-4 shrink-0" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                )}
              </div>
              {!isCollapsed && (
                <div className="text-left min-w-0">
                  <span className="text-xs font-bold text-white block truncate">Notificações</span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {unreadNotificationsCount > 0
                      ? `${unreadNotificationsCount} aviso(s) pendente(s)`
                      : 'Sem novos alertas'}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && unreadNotificationsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shrink-0">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>

        {/* Main Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-none">
          {/* Section: Operação & Auditoria */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                Módulos de Gestão DPO
              </span>
            )}

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={item.label}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all group ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-slate-950 text-amber-400 shadow-inner'
                          : 'bg-slate-800/80 text-slate-400 group-hover:text-amber-400 group-hover:bg-slate-750'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>

                    {!isCollapsed && (
                      <div className="text-left min-w-0">
                        <span className="text-xs font-bold block truncate">{item.label}</span>
                        <span
                          className={`text-[10px] block truncate ${
                            isActive ? 'text-slate-900 font-semibold' : 'text-slate-500'
                          }`}
                        >
                          {item.sublabel}
                        </span>
                      </div>
                    )}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Section: Ações & Ferramentas */}
          <div className="space-y-1 pt-2 border-t border-slate-800/60">
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                Ferramentas do Gestor
              </span>
            )}

            {secondaryActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    action.onClick();
                    setIsMobileOpen(false);
                  }}
                  title={action.label}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all group ${
                    isCollapsed ? 'justify-center px-0' : 'justify-between'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-850 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-amber-400 group-hover:bg-slate-800 transition-colors">
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    {!isCollapsed && (
                      <span className="text-xs font-semibold truncate text-slate-300 group-hover:text-white">
                        {action.label}
                      </span>
                    )}
                  </div>

                  {!isCollapsed && action.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shrink-0">
                      {action.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer / Profile & Mode Switcher */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/70 space-y-2">
          {/* User Profile Info with Gestor Photo Import Button */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-2xl bg-slate-900 border border-slate-800 ${
              isCollapsed ? 'justify-center p-1.5' : ''
            }`}
          >
            <div className="relative group/avatar shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-amber-500/40 shrink-0"
              />
              <button
                type="button"
                onClick={() => gestorPhotoInputRef.current?.click()}
                title="Importar Foto do Gestor"
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
              >
                <Camera className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-white truncate">{currentUser.name}</span>
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold shrink-0">
                    {currentUser.matricula}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className="text-[10px] text-slate-400 truncate">Gestor DPO Armazém</span>
                  <button
                    type="button"
                    onClick={() => gestorPhotoInputRef.current?.click()}
                    title="Importar Foto do Gestor"
                    className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Upload className="w-2.5 h-2.5" />
                    <span>Foto</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={gestorPhotoInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleGestorPhotoFile}
          />

          {/* Bottom Actions: Toggle Mode & Logout */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleGestorMode}
              title="Acessar Módulo do Participante (Visualização do Colaborador)"
              className={`flex items-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 transition-all flex-1 cursor-pointer shadow-sm ${
                isCollapsed ? 'justify-center px-0' : 'px-3'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0 text-amber-400 group-hover:text-slate-950" />
              {!isCollapsed && <span>Módulo Participante</span>}
            </button>

            <button
              onClick={onLogout}
              title="Sair / Encerrar Sessão"
              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 transition-all shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
