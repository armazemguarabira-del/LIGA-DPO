import React from 'react';
import {
  X,
  Trophy,
  Award,
  Calendar,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Camera,
  Star,
  Activity,
  Layers,
  Sliders,
  Check,
  Target,
} from 'lucide-react';
import {
  User,
  RankingEntry,
  DailyRecord,
  ROLE_LABELS,
  ROLE_BADGE_COLORS,
  ROLE_ICONS,
} from '../types/dpo';

interface CollaboratorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: RankingEntry | null;
  dailyRecord: DailyRecord | null;
  onOpenEditMetas?: (user: User) => void;
  canEdit?: boolean;
}

export const CollaboratorDetailModal: React.FC<CollaboratorDetailModalProps> = ({
  isOpen,
  onClose,
  entry,
  dailyRecord,
  onOpenEditMetas,
  canEdit,
}) => {
  if (!isOpen || !entry) return null;

  const { user } = entry;
  const roleBadge = ROLE_BADGE_COLORS[user.role];
  const todayScore = dailyRecord ? dailyRecord.calculatedScore : entry.todayScore;
  const attainment = Math.round((todayScore / 6.0) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Banner with Trophy & User Info */}
        <div className="relative p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-amber-500/50 shadow-xl"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border} flex items-center gap-1`}
                >
                  <span>{ROLE_ICONS[user.role]}</span>
                  <span>{ROLE_LABELS[user.role]}</span>
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">
                  {user.matricula}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white">{user.name}</h2>
              <p className="text-xs text-slate-400">
                Estatísticas em tempo real • Liga DPO Armazém • Teto 6.0 Pts
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Disqualification Banner in Modal if Applicable */}
          {user.desqualificado && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 space-y-1.5 animate-fade-in">
              <div className="flex items-center gap-2 font-black text-rose-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Colaborador com Status Desqualificado</span>
              </div>
              <p className="text-xs text-slate-300">
                <strong className="text-rose-400">Motivo registrado:</strong> "{user.motivoDesqualificacao || 'Sem motivo registrado'}"
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-rose-900/50 flex items-center justify-between">
                <span>Posição no ranking: <strong>Último Lugar</strong> (continua pontuando normalmente)</span>
                {user.dataDesqualificacao && (
                  <span className="text-slate-400">{user.dataDesqualificacao}</span>
                )}
              </div>
            </div>
          )}

          {/* Key KPI Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Pontos Hoje
              </span>
              <span className="text-2xl font-black text-emerald-400">
                {todayScore.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500 block">de 6.0 pontos ({attainment}%)</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Acumulado
              </span>
              <span className="text-2xl font-black text-white">{entry.totalScore}</span>
              <span className="text-[10px] text-slate-500 block">pontos na temporada</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Posição Cargo
              </span>
              <span className="text-2xl font-black text-amber-400">#{entry.categoryPosition}</span>
              <span className="text-[10px] text-slate-500 block">no seu cargo</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Posição Geral
              </span>
              <span className="text-2xl font-black text-purple-400">#{entry.generalPosition}</span>
              <span className="text-[10px] text-slate-500 block">de 15 colaboradores</span>
            </div>
          </div>

          {/* The 4 Specific Metas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" />
                Desempenho das 4 Metas Individuais de Hoje
              </h3>
              <span className="text-xs font-mono font-bold text-amber-400">
                {todayScore.toFixed(1)} / 6.0 pts
              </span>
            </div>

            <div className="space-y-2">
              {user.metas.map((meta) => {
                const isChecked = dailyRecord?.metaStatus
                  ? !!dailyRecord.metaStatus[meta.ordem]
                  : entry.todayScore >= (meta.ordem === 1 ? 2 : meta.ordem === 2 ? 4 : 5);

                return (
                  <div
                    key={meta.ordem}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      isChecked
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-amber-400 font-bold flex items-center justify-center text-xs">
                        {meta.ordem}
                      </span>
                      <div>
                        <span className="font-bold text-white block">{meta.descricao}</span>
                        <span className="text-[10px] text-slate-500">
                          Peso de pontuação: {meta.pontos} {meta.pontos === 1 ? 'ponto' : 'pontos'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                          isChecked
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isChecked ? `+${meta.pontos} pts` : '0 pts'}
                      </span>
                      {isChecked ? (
                        <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                      ) : (
                        <span className="text-slate-600 text-xs">Pendente</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5S Status Details */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Status da Auditoria 5S</h4>
                <p className="text-[11px] text-slate-400">
                  {dailyRecord?.fiveSApproved
                    ? 'Auditoria 5S aprovada pela supervisão (+1 ponto computado)'
                    : 'Aguardando validação ou envio de evidência fotográfica'}
                </p>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                dailyRecord?.fiveSApproved
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {dailyRecord?.fiveSApproved ? 'APROVADO' : 'PENDENTE'}
            </span>
          </div>

          {/* Historical Trend */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Histórico Recente (Últimos 5 Dias)
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {entry.historyScores.map((h, i) => (
                <div
                  key={i}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center"
                >
                  <span className="text-[10px] text-slate-500 block">{h.date}</span>
                  <span className="text-sm font-black text-amber-400 block mt-0.5">
                    {h.score}.0
                  </span>
                  <span className="text-[9px] text-slate-400">pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Regra DPO: Todos os colaboradores competem por cargo com metas de 6.0 pontos.
          </span>

          <div className="flex items-center gap-2">
            {onOpenEditMetas && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEditMetas(user);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Sliders className="w-3.5 h-3.5" />
                Auditar Metas Diárias
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
