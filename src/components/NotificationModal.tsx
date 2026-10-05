import React, { useState } from 'react';
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Camera,
  AlertOctagon,
  HelpCircle,
  Check,
  X,
  Eye,
  ArrowRight,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { DPONotification } from '../types/dpo';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: DPONotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDeleteNotification?: (id: string) => void;
  onClearAllNotifications?: () => void;
  onNavigateToTab?: (tab: string) => void;
  isGestor: boolean;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  onClearAllNotifications,
  onNavigateToTab,
  isGestor,
}) => {
  const [filter, setFilter] = useState<'all' | '5s' | 'anomalia' | 'critica'>('all');

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (filter === '5s') return n.type === '5s_approved' || n.type === '5s_rejected';
    if (filter === 'anomalia')
      return n.type === 'anomaly_approved' || n.type === 'anomaly_rejected';
    if (filter === 'critica') return n.type === 'critique_resolved';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: DPONotification['type']) => {
    switch (type) {
      case '5s_approved':
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 shadow-sm shadow-emerald-500/10">
            <Camera className="w-4 h-4 shrink-0" />
          </div>
        );
      case '5s_rejected':
        return (
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400 shadow-sm shadow-rose-500/10">
            <XCircle className="w-4 h-4 shrink-0" />
          </div>
        );
      case 'anomaly_approved':
        return (
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 shadow-sm shadow-amber-500/10">
            <AlertOctagon className="w-4 h-4 shrink-0" />
          </div>
        );
      case 'anomaly_rejected':
        return (
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400 shadow-sm shadow-rose-500/10">
            <AlertTriangle className="w-4 h-4 shrink-0" />
          </div>
        );
      case 'critique_resolved':
        return (
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400 shadow-sm shadow-blue-500/10">
            <HelpCircle className="w-4 h-4 shrink-0" />
          </div>
        );
      case 'pending_review':
        return (
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-300 animate-pulse">
            <Clock className="w-4 h-4 shrink-0" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300">
            <Bell className="w-4 h-4 shrink-0" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 shadow-inner">
              <Bell className="w-5 h-5 shrink-0" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base truncate">Central de Notificações</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shrink-0">
                    {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Notificações analisadas somem automaticamente do sininho.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2.5 border-b border-slate-800/60 bg-slate-950/30 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                filter === 'all'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('5s')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                filter === '5s'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Auditorias 5S
            </button>
            <button
              onClick={() => setFilter('anomalia')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                filter === 'anomalia'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Relatos
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {notifications.length > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold hover:underline shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-1"
                title="Marcar todas como analisadas e remover do sininho"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Analisar Todas (Limpar)</span>
              </button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 sm:p-3 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-6 h-6 shrink-0" />
              </div>
              <p className="text-xs font-bold text-slate-300">Tudo em dia!</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Todas as notificações foram analisadas e limpas do seu sininho.
              </p>
            </div>
          ) : (
            filtered.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onMarkRead(notif.id)}
                className="p-3 sm:p-3.5 rounded-2xl transition-all cursor-pointer flex gap-3 relative group bg-slate-900/90 hover:bg-slate-800/70 border border-slate-800 hover:border-amber-500/40 shadow-sm"
              >
                {!notif.read && (
                  <span className="absolute top-3 right-8 w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/80 animate-pulse"></span>
                )}

                {/* Dismiss button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead(notif.id);
                  }}
                  title="Analisar e dispensar notificação"
                  className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {getNotificationIcon(notif.type)}

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                      {notif.title}
                    </h4>
                    {notif.pointsAwarded && notif.pointsAwarded > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap shadow-sm">
                        +{notif.pointsAwarded.toFixed(1)} pt creditado
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed mb-2">
                    {notif.message}
                  </p>

                  {/* Thumbnail and Meta details if provided */}
                  <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-500">
                    <div className="flex items-center gap-2 min-w-0">
                      {notif.sector && (
                        <span className="truncate max-w-[180px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {notif.sector}
                        </span>
                      )}
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 shrink-0" />
                        {notif.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isGestor && notif.type === 'pending_review' && onNavigateToTab && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkRead(notif.id);
                            onClose();
                            if (notif.title.includes('5S')) {
                              onNavigateToTab('5s');
                            } else {
                              onNavigateToTab('relatos-anomalias');
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                        >
                          <span>Avaliar Agora</span>
                          <ArrowRight className="w-3 h-3 shrink-0" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkRead(notif.id);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-400 text-[10px] font-bold flex items-center gap-1 transition-all"
                      >
                        <Check className="w-3 h-3" />
                        <span>Analisada</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-center">
          <p className="text-[10px] text-slate-500">
            Regra DPO: Relatos e 5S contam pontos e critérios de desempate mediante aprovação do gestor.
          </p>
        </div>
      </div>
    </div>
  );
};
