import React, { useState } from 'react';
import {
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  Eye,
  Filter,
  Camera,
  MapPin,
  Calendar,
  Sparkles,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { SafetyAnomalyReport, ROLE_LABELS, ROLE_BADGE_COLORS, ROLE_ICONS } from '../types/dpo';
import { storageService } from '../services/storageService';

interface SafetyReportsManagementProps {
  reports: SafetyAnomalyReport[];
  onReportsUpdated: () => void;
  supervisorName: string;
}

export const SafetyReportsManagement: React.FC<SafetyReportsManagementProps> = ({
  reports,
  onReportsUpdated,
  supervisorName,
}) => {
  const [filter, setFilter] = useState<'all' | 'pendente' | 'aprovado' | 'rejeitado'>('pendente');
  const [selectedReport, setSelectedReport] = useState<SafetyAnomalyReport | null>(null);
  const [feedback, setFeedback] = useState('');
  const [awardedPoints, setAwardedPoints] = useState<number>(1);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);

  const pendingCount = reports.filter((r) => r.status === 'pendente').length;
  const approvedCount = reports.filter((r) => r.status === 'aprovado').length;
  const rejectedCount = reports.filter((r) => r.status === 'rejeitado').length;

  const filteredReports = reports.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const handleApprove = (report: SafetyAnomalyReport) => {
    storageService.validateSafetyReport(
      report.id,
      'aprovado',
      supervisorName,
      awardedPoints,
      feedback.trim() || 'Relato preventivo avaliado e aprovado. Meta computada e critério de desempate ativo.'
    );
    setSelectedReport(null);
    setFeedback('');
    onReportsUpdated();
  };

  const handleReject = (report: SafetyAnomalyReport) => {
    storageService.validateSafetyReport(
      report.id,
      'rejeitado',
      supervisorName,
      0,
      feedback.trim() || 'Relato não atende aos requisitos operacionais de anomalia/segurança.'
    );
    setSelectedReport(null);
    setFeedback('');
    onReportsUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1222] via-[#090e1a] to-[#1a1205] border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                <AlertOctagon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                MÓDULO DE GESTÃO DPO • PILAR SEGURANÇA
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                1º Critério Oficial de Desempate
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Validação de Relatos de Anomalia & Segurança
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Conforme a regra operacional DPO, colaboradores pontuam e conquistam vantagem no
              critério de desempate somente após a <strong>aprovação formal do gestor</strong>.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-center min-w-[90px]">
              <span className="text-2xl font-black text-amber-400 block">{pendingCount}</span>
              <span className="text-[10px] uppercase font-bold text-amber-300/80">Pendentes</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-center min-w-[90px]">
              <span className="text-2xl font-black text-emerald-400 block">{approvedCount}</span>
              <span className="text-[10px] uppercase font-bold text-emerald-300/80">Aprovados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setFilter('pendente')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              filter === 'pendente'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            Pendentes de Validação
            {pendingCount > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  filter === 'pendente' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'
                }`}
              >
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter('aprovado')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              filter === 'aprovado'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Aprovados ({approvedCount})
          </button>

          <button
            onClick={() => setFilter('rejeitado')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              filter === 'rejeitado'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            Não Validados ({rejectedCount})
          </button>

          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              filter === 'all'
                ? 'bg-slate-200 text-slate-950'
                : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            Todos ({reports.length})
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400 space-y-3">
            <ShieldCheck className="w-12 h-12 mx-auto text-slate-500 shrink-0" />
            <h3 className="font-bold text-white text-base">Nenhum relato neste filtro</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Quando os colaboradores enviarem fotos de anomalias pelo painel, elas aparecerão aqui
              para aprovação imediata.
            </p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const roleBadge = ROLE_BADGE_COLORS[report.userRole];
            const isPendente = report.status === 'pendente';
            const isAprovado = report.status === 'aprovado';

            return (
              <div
                key={report.id}
                className={`relative rounded-3xl bg-slate-900/80 border p-5 flex flex-col justify-between transition-all hover:border-slate-700 shadow-xl ${
                  isPendente
                    ? 'border-amber-500/40 bg-amber-500/[0.02]'
                    : isAprovado
                    ? 'border-emerald-500/30'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  {/* Header Author & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border} flex items-center gap-1 shrink-0`}
                      >
                        <span>{ROLE_ICONS[report.userRole]}</span>
                        <span className="truncate">{ROLE_LABELS[report.userRole]}</span>
                      </span>
                      <span className="text-xs font-bold text-white truncate">{report.userName}</span>
                      <span className="font-mono text-[10px] text-slate-400">({report.userMatricula})</span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 uppercase tracking-wider flex items-center gap-1 ${
                        isPendente
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          : isAprovado
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {isPendente && <Clock className="w-3 h-3 shrink-0" />}
                      {isAprovado && <Check className="w-3 h-3 shrink-0" />}
                      {report.status}
                    </span>
                  </div>

                  {/* Photo Preview with click to enlarge */}
                  <div
                    onClick={() => setEnlargedPhoto(report.photoUrl)}
                    className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 mb-3 border border-slate-800 group cursor-pointer"
                  >
                    <img
                      src={report.photoUrl}
                      alt={report.description}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
                      <span className="text-[11px] font-semibold text-white flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        {report.sector}
                      </span>
                    </div>
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm text-[10px] font-bold text-slate-300 flex items-center gap-1 group-hover:text-amber-400">
                      <Eye className="w-3 h-3 shrink-0" /> Ampliar
                    </span>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300 capitalize">{report.type}</span>
                      <span>
                        {report.date} às {report.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                      "{report.description}"
                    </p>
                  </div>

                  {/* Feedback / Evaluation Info if already reviewed */}
                  {!isPendente && (
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 text-xs mb-3 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Avaliador: <strong className="text-white">{report.evaluatedBy}</strong></span>
                        <span>{report.evaluatedAt}</span>
                      </div>
                      {report.feedback && (
                        <p className="text-[11px] text-slate-300 italic">"{report.feedback}"</p>
                      )}
                      {isAprovado && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 pt-0.5">
                          <Check className="w-3 h-3 shrink-0" /> +{report.pointsAwarded || 1} pt atribuído ao colaborador
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions for Pending Reports */}
                {isPendente && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(report)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      Aprovar (+1 pt)
                    </button>

                    <button
                      onClick={() => {
                        const reason = prompt('Motivo da não validação (feedback ao colaborador):');
                        if (reason !== null) {
                          storageService.validateSafetyReport(
                            report.id,
                            'rejeitado',
                            supervisorName,
                            0,
                            reason.trim() || 'Não atendeu aos critérios operacionais.'
                          );
                          onReportsUpdated();
                        }
                      }}
                      className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5 shrink-0" />
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Enlarged Photo Modal */}
      {enlargedPhoto && (
        <div
          onClick={() => setEnlargedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden border border-slate-700 shadow-2xl">
            <img src={enlargedPhoto} alt="Evidência da Anomalia" className="w-full h-full object-contain" />
            <button
              onClick={() => setEnlargedPhoto(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-950/80 text-white flex items-center justify-center hover:bg-rose-500 transition-colors"
            >
              <X className="w-5 h-5 shrink-0" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
