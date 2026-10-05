import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  Users,
  CheckCircle2,
  TrendingUp,
  Award,
  Sparkles,
  Shield,
  Layers,
  Target,
} from 'lucide-react';
import { User, JobRole, ROLE_LABELS, RankingEntry, ROLE_BADGE_COLORS, ROLE_ICONS } from '../types/dpo';
import { generateSupervisorPDF } from '../services/pdfService';
import { storageService } from '../services/storageService';

interface SupervisorReportsProps {
  currentUser: User | null;
  rankings: RankingEntry[];
  users: User[];
}

export const SupervisorReports: React.FC<SupervisorReportsProps> = ({
  currentUser,
  rankings,
  users,
}) => {
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedRole, setSelectedRole] = useState<JobRole | 'all'>('all');
  const [supervisorName, setSupervisorName] = useState(
    currentUser?.name || 'Supervisão DPO Armazém'
  );
  const [department, setDepartment] = useState('Armazém & Expedição DPO');
  const [isExporting, setIsExporting] = useState(false);

  // Filter rankings according to selected cargo
  const reportRankings = rankings.filter((r) => {
    if (selectedRole !== 'all' && r.user.role !== selectedRole) return false;
    return true;
  });

  const totalCollaborators = reportRankings.length;
  const avgAttainment =
    totalCollaborators > 0
      ? (reportRankings.reduce((acc, r) => acc + r.avgAttainment, 0) / totalCollaborators).toFixed(1)
      : '0';
  const totalTodayScore = reportRankings.reduce((acc, r) => acc + r.todayScore, 0);
  const avgTodayScore =
    totalCollaborators > 0 ? (totalTodayScore / totalCollaborators).toFixed(1) : '0';
  const fiveSApproved = reportRankings.reduce((acc, r) => acc + (r.todayScore >= 5 ? 1 : 0), 0);

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      generateSupervisorPDF({
        supervisorName,
        supervisorRole: 'Supervisor DPO Armazém',
        date: reportDate,
        department,
        roleFilter: selectedRole,
      });
    } catch (e) {
      console.error('PDF Generation failed:', e);
      alert('Erro ao gerar PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
              AUDITORIA & FECHAMENTO DPO
            </span>
            <span className="text-xs text-slate-400">• Teto 6.0 Pontos/Dia</span>
          </div>
          <h1 className="text-2xl font-black text-white">Relatórios Executivos em PDF</h1>
          <p className="text-xs text-slate-400">
            Gere relatórios oficiais automáticos para supervisores com ranking por cargo e metas batidas.
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all self-start md:self-auto disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Gerando Documento...' : 'Exportar Relatório PDF'}
        </button>
      </div>

      {/* Filter Parameters */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-lg">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
            Filtrar por Cargo
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="all">Geral (Todos os 4 Cargos - 15 Colaboradores)</option>
            <option value="ajudante">Ajudante de Armazém (9 Colaboradores)</option>
            <option value="conferente">Conferente (2 Colaboradores)</option>
            <option value="empilhador">Empilhador (3 Colaboradores)</option>
            <option value="manobrista">Manobrista (1 Colaborador)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
            Data de Referência
          </label>
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
            Nome do Supervisor
          </label>
          <input
            type="text"
            value={supervisorName}
            onChange={(e) => setSupervisorName(e.target.value)}
            placeholder="Nome do supervisor responsável"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* KPI Preview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Colaboradores no Escopo
          </span>
          <span className="text-2xl font-black text-white">{totalCollaborators}</span>
          <span className="text-[10px] text-slate-500 block">operadores avaliados</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Atingimento Médio
          </span>
          <span className="text-2xl font-black text-emerald-400">{avgAttainment}%</span>
          <span className="text-[10px] text-slate-500 block">taxa de sucesso operacional</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Pontuação Média
          </span>
          <span className="text-2xl font-black text-amber-400">{avgTodayScore}</span>
          <span className="text-[10px] text-slate-500 block">de 6.0 pontos hoje</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Auditorias 5S
          </span>
          <span className="text-2xl font-black text-purple-400">{fiveSApproved}</span>
          <span className="text-[10px] text-slate-500 block">validadas no escopo</span>
        </div>
      </div>

      {/* PDF Document Preview Card */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-400" />
            <h3 className="font-black text-white text-sm">
              Prévia de Impressão do Relatório Operacional
            </h3>
          </div>
          <span className="text-xs text-slate-400">Layout A4 Padrão Logístico</span>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase text-[10px] font-black">
                <th className="py-2.5 px-3 w-12 text-center">Pos</th>
                <th className="py-2.5 px-3">Matrícula</th>
                <th className="py-2.5 px-3">Colaborador</th>
                <th className="py-2.5 px-3">Cargo</th>
                <th className="py-2.5 px-3 text-center">Metas Batidas</th>
                <th className="py-2.5 px-3 text-center">Pontos Hoje</th>
                <th className="py-2.5 px-3 text-center">Ating.%</th>
                <th className="py-2.5 px-3 text-center">Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reportRankings.map((r) => {
                const roleBadge = ROLE_BADGE_COLORS[r.user.role];
                return (
                  <tr key={r.userId} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 text-center font-bold">
                      {r.isDesqualificado ? (
                        <span className="text-rose-400 font-black">DQ</span>
                      ) : (
                        <span className="text-amber-400 font-bold">#{r.position}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-300">
                      {r.user.matricula}
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      <div>
                        <span>{r.user.name}</span>
                        {r.isDesqualificado && (
                          <span className="block text-[10px] text-rose-400 font-medium">
                            [Desqualificado: {r.motivoDesqualificacao || 'Sem motivo'}]
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                        <span>{ROLE_ICONS[r.user.role]}</span>
                        <span>{ROLE_LABELS[r.user.role]}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-emerald-400">{r.metasCompletedToday} / 4</span>
                    </td>
                    <td className="py-3 px-3 text-center font-black text-white">
                      {r.todayScore.toFixed(1)} / 6.0
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-300">
                      {r.avgAttainment}%
                    </td>
                    <td className="py-3 px-3 text-center font-black text-amber-400">
                      {r.totalScore} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
