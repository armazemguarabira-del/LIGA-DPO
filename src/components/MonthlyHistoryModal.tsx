import React, { useState } from 'react';
import {
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trophy,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Camera,
  Layers,
  Sparkles,
  ArrowRight,
  Check,
  Target,
  Clock,
} from 'lucide-react';
import {
  User,
  DailyRecord,
  MONTHS_OF_YEAR,
  ROLE_LABELS,
  ROLE_BADGE_COLORS,
} from '../types/dpo';
import { storageService } from '../services/storageService';

interface MonthlyHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onOpenCritiqueForDate: (date: string) => void;
}

export const MonthlyHistoryModal: React.FC<MonthlyHistoryModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenCritiqueForDate,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // Default: Setembro
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedDayRecord, setSelectedDayRecord] = useState<DailyRecord | null>(null);

  if (!isOpen) return null;

  const currentMonthInfo =
    MONTHS_OF_YEAR.find((m) => m.number === selectedMonth) || MONTHS_OF_YEAR[8];

  const monthRecords = storageService.getDailyRecordsForUserAndMonth(
    user.id,
    selectedMonth,
    selectedYear
  );

  // Month KPI summaries
  const totalDaysWorked = monthRecords.length;
  const totalMonthScore = monthRecords.reduce((acc, r) => acc + r.calculatedScore, 0);
  const avgDailyScore =
    totalDaysWorked > 0 ? (totalMonthScore / totalDaysWorked).toFixed(1) : '0';
  const approved5SInMonth = monthRecords.filter((r) => r.fiveSApproved).length;

  // Build calendar days array
  const daysInMonth = currentMonthInfo.daysInMonth;
  const recordMap = new Map<number, DailyRecord>();
  monthRecords.forEach((r) => {
    const day = parseInt(r.date.split('-')[2], 10);
    recordMap.set(day, r);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-xl object-cover ring-1 ring-amber-500/50"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{user.name}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                  {user.matricula}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Histórico Anual de Metas • {ROLE_LABELS[user.role]} • Teto 6.0 Pontos/Dia
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 12 Months Selector Bar */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/60 overflow-x-auto scrollbar-none flex items-center gap-1.5">
          {MONTHS_OF_YEAR.map((m) => {
            const isSelected = m.number === selectedMonth;
            return (
              <button
                key={m.number}
                onClick={() => {
                  setSelectedMonth(m.number);
                  setSelectedDayRecord(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {m.name}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Monthly Summary Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Dias Participados
              </span>
              <span className="text-2xl font-black text-white">{totalDaysWorked}</span>
              <span className="text-[10px] text-slate-500 block">em {currentMonthInfo.name}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Pontos no Mês
              </span>
              <span className="text-2xl font-black text-amber-400">{totalMonthScore}</span>
              <span className="text-[10px] text-slate-500 block">pontos acumulados</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Média Diária
              </span>
              <span className="text-2xl font-black text-emerald-400">{avgDailyScore}</span>
              <span className="text-[10px] text-slate-500 block">de 6.0 pontos/dia</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                5S Concluídos
              </span>
              <span className="text-2xl font-black text-purple-400">{approved5SInMonth}</span>
              <span className="text-[10px] text-slate-500 block">auditorias aprovadas</span>
            </div>
          </div>

          {/* Calendar Grid View */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                Calendário de Participação: {currentMonthInfo.name} de {selectedYear}
              </h3>
              <span className="text-xs text-slate-400">
                Clique em um dia para inspecionar as 4 metas ou solicitar crítica
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const rec = recordMap.get(day);
                const isSelected = selectedDayRecord?.date === rec?.date && !!rec;
                const isPerfect = rec && rec.calculatedScore === 6;
                const isGood = rec && rec.calculatedScore >= 4;

                return (
                  <div
                    key={day}
                    onClick={() => rec && setSelectedDayRecord(rec)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      rec
                        ? isSelected
                          ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/40 shadow-lg'
                          : isPerfect
                          ? 'border-emerald-500/50 bg-emerald-950/20 hover:border-emerald-400'
                          : isGood
                          ? 'border-blue-500/40 bg-blue-950/20 hover:border-blue-400'
                          : 'border-slate-700 bg-slate-950/60 hover:border-slate-600'
                        : 'border-slate-850 bg-slate-950/30 opacity-40 cursor-default'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-400 block">{day}</span>
                    {rec ? (
                      <div className="mt-1">
                        <span
                          className={`text-sm font-black block ${
                            isPerfect
                              ? 'text-emerald-400'
                              : isGood
                              ? 'text-blue-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {rec.calculatedScore}.0
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold">pts</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-600 block mt-2">-</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Inspector */}
          {selectedDayRecord && (
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 animate-fade-in shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-400" />
                    Detalhamento do Dia: {selectedDayRecord.date}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Pontuação obtida:{' '}
                    <strong className="text-emerald-400 font-black">
                      {selectedDayRecord.calculatedScore} / 6.0 Pontos
                    </strong>{' '}
                    ({Math.round((selectedDayRecord.calculatedScore / 6.0) * 100)}% de atingimento)
                  </p>
                </div>

                {/* Contestation status & button */}
                {(() => {
                  const check = storageService.isDateContestable(selectedDayRecord.date);
                  const hasUnachievedMetas = selectedDayRecord.calculatedScore < 6;

                  if (!hasUnachievedMetas) {
                    return (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
                        <Check className="w-3.5 h-3.5" />
                        100% das Metas Atingidas (6.0 pts)
                      </span>
                    );
                  }

                  if (!check.eligible) {
                    return (
                      <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium flex items-center gap-1.5 self-start sm:self-auto" title={check.reason}>
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Contestação expirada ({check.diffDays} dias)</span>
                      </div>
                    );
                  }

                  return (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenCritiqueForDate(selectedDayRecord.date);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 self-start sm:self-auto transition-transform active:scale-95 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                      Contestar Meta / Enviar Evidência
                    </button>
                  );
                })()}
              </div>

              {/* 2-Day Contestation Rule Notice */}
              {(() => {
                const check = storageService.isDateContestable(selectedDayRecord.date);
                if (!check.eligible && selectedDayRecord.calculatedScore < 6) {
                  return (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>
                        <strong>Regra da Liga DPO:</strong> O prazo limite para contestações é de até <strong>2 dias</strong> da data da meta. Este registro tem <strong>{check.diffDays} dias</strong> da data atual.
                      </span>
                    </div>
                  );
                }
                if (check.eligible && selectedDayRecord.calculatedScore < 6) {
                  return (
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                      <span>
                        Prazo de contestação <strong>ativo</strong> ({check.diffDays === 0 ? 'Meta de hoje' : check.diffDays === 1 ? 'Meta de ontem (1 dia)' : 'Meta de 2 dias atrás'}). Você pode anexar evidência fotográfica para avaliação do Gestor.
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* 4 Metas of that Day with Clear Achieved vs Not Achieved Status */}
              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                  Status das 4 Metas Individuais do Colaborador:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {user.metas.map((m) => {
                    const achieved = selectedDayRecord.metaStatus
                      ? !!selectedDayRecord.metaStatus[m.ordem]
                      : selectedDayRecord.calculatedScore >= (m.ordem === 1 ? 2 : m.ordem === 2 ? 4 : 5);

                    return (
                      <div
                        key={m.ordem}
                        className={`p-3 rounded-2xl border transition-all ${
                          achieved
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 shadow-sm'
                            : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-amber-400 font-mono">Meta {m.ordem}:</span>
                              <span className="font-bold text-white text-xs">{m.descricao}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              Peso da meta: <strong>{m.pontos}.0 pontos</strong>
                            </span>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5 font-bold text-xs">
                            {achieved ? (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 font-black">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                +{m.pontos}.0 pts
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1 font-bold">
                                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                Não Atingida (0 pts)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
