import React, { useState, useMemo } from "react";
import {
  Trophy,
  Medal,
  Award,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Camera,
  Eye,
  Sliders,
  Users,
  Flame,
  CheckCircle,
  AlertCircle,
  Layers,
  Calendar,
  ChevronDown,
  Check,
  X,
  Target,
  AlertOctagon,
  HelpCircle,
  ShieldAlert,
  Undo2,
} from "lucide-react";
import {
  JobRole,
  RankingEntry,
  ROLE_LABELS,
  ROLE_BADGE_COLORS,
  ROLE_ICONS,
  User,
  MONTHS_OF_YEAR,
} from "../types/dpo";
import { storageService } from "../services/storageService";
import { DisqualificationModal } from "./DisqualificationModal";

interface DashboardRankingProps {
  rankings: RankingEntry[];
  selectedRoleTab: JobRole | "all";
  setSelectedRoleTab: (role: JobRole | "all") => void;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  onSelectCollaborator: (entry: RankingEntry) => void;
  onEditCollaboratorMetas?: (user: User) => void;
  canEdit: boolean;
  activeSeason: string;
}

export const DashboardRanking: React.FC<DashboardRankingProps> = ({
  rankings,
  selectedRoleTab,
  setSelectedRoleTab,
  selectedMonth,
  setSelectedMonth,
  onSelectCollaborator,
  onEditCollaboratorMetas,
  canEdit,
  activeSeason,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDisqualifyModalOpen, setIsDisqualifyModalOpen] = useState(false);
  const [selectedUserToDisqualify, setSelectedUserToDisqualify] =
    useState<User | null>(null);

  const handleOpenDisqualifyModal = (user: User) => {
    setSelectedUserToDisqualify(user);
    setIsDisqualifyModalOpen(true);
  };

  const handleConfirmDisqualify = (userId: string, motivo: string) => {
    storageService.disqualifyUser(userId, motivo, "Gestor DPO Armazém");
  };

  const handleConfirmRequalify = (userId: string) => {
    storageService.requalifyUser(userId, "Gestor DPO Armazém");
  };

  // Filter rankings based on role tab and search query with high-performance memoization
  const filteredRankings = useMemo(() => {
    return rankings.filter((entry) => {
      if (selectedRoleTab !== "all" && entry.user.role !== selectedRoleTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = entry.user.name.toLowerCase().includes(q);
        const matchMatricula = entry.user.matricula.toLowerCase().includes(q);
        if (!matchName && !matchMatricula) return false;
      }
      return true;
    });
  }, [rankings, selectedRoleTab, searchQuery]);

  // Top 3 Podium
  const top3 = useMemo(() => filteredRankings.slice(0, 3), [filteredRankings]);
  const currentMonthInfo = useMemo(
    () =>
      MONTHS_OF_YEAR.find((m) => m.number === selectedMonth) ||
      MONTHS_OF_YEAR[8],
    [selectedMonth],
  );

  // Global calculations
  const totalCompetitors = filteredRankings.length;
  const avgAttainment = useMemo(
    () =>
      totalCompetitors > 0
        ? Math.round(
            filteredRankings.reduce((acc, r) => acc + r.avgAttainment, 0) /
              totalCompetitors,
          )
        : 0,
    [filteredRankings, totalCompetitors],
  );
  const totalReportsToday = useMemo(
    () => filteredRankings.reduce((acc, r) => acc + r.safetyReportsCount, 0),
    [filteredRankings],
  );
  const total5sApprovedToday = useMemo(
    () =>
      filteredRankings.filter(
        (r) => r.todayScore >= 5 || r.fiveSApprovedCount > 0,
      ).length,
    [filteredRankings],
  );

  return (
    <div className="space-y-6">
      {/* Top DPO Header & Live Operational Summary */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1222] via-[#090e1a] to-[#161208] border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {activeSeason} • LIGA DPO
              </span>

              {/* Month Selector dropdown */}
              <div className="relative inline-block">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="appearance-none bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-full px-3 py-1 pr-7 text-xs font-bold hover:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer transition-colors"
                >
                  <option value={0}>Temporada Completa (Geral 2026)</option>
                  {MONTHS_OF_YEAR.map((m) => (
                    <option key={m.number} value={m.number}>
                      Mês: {m.name} (2026)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Ranking Oficial da Liga DPO
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Competição individual por cargo com teto de{" "}
              <strong className="text-amber-400 font-bold">6.0 pontos</strong>.
              Critérios oficiais de desempate:{" "}
              <strong className="text-white">
                1º Número de Relatos de Segurança/Anomalia
              </strong>{" "}
              e{" "}
              <strong className="text-white">2º 5S em Mais de uma Área</strong>.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-sm text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Teto Diário
              </span>
              <span className="text-xl font-black text-amber-400">6.0 pts</span>
              <span className="text-[10px] text-slate-500 block">
                4 metas por colab
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-sm text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Atingimento Médio
              </span>
              <span className="text-xl font-black text-emerald-400">
                {avgAttainment}%
              </span>
              <span className="text-[10px] text-slate-500 block">
                hoje na operação
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-sm text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Relatos Desempate
              </span>
              <span className="text-xl font-black text-amber-400">
                {totalReportsToday}
              </span>
              <span className="text-[10px] text-slate-500 block">
                1º critério aplicado
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-sm text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                5S Validados
              </span>
              <span className="text-xl font-black text-purple-400">
                {total5sApprovedToday}
              </span>
              <span className="text-[10px] text-slate-500 block">
                com foto/webcam
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cargo Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedRoleTab("all")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedRoleTab === "all"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Trophy className="w-4 h-4" />
            Geral ({rankings.length})
          </button>

          <button
            onClick={() => setSelectedRoleTab("ajudante")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedRoleTab === "ajudante"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <span>📦</span>
            Ajudante de Armazém (9)
          </button>

          <button
            onClick={() => setSelectedRoleTab("conferente")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedRoleTab === "conferente"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <span>📋</span>
            Conferente (2)
          </button>

          <button
            onClick={() => setSelectedRoleTab("empilhador")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedRoleTab === "empilhador"
                ? "bg-blue-500 text-slate-950 shadow-md shadow-blue-500/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <span>🚜</span>
            Empilhador (3)
          </button>

          <button
            onClick={() => setSelectedRoleTab("manobrista")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedRoleTab === "manobrista"
                ? "bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <span>🚛</span>
            Manobrista (1)
          </button>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome ou matrícula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>
      </div>

      {/* TOP 3 PODIUM */}
      {top3.length >= 2 && !searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* SILVER - #2 */}
          {top3[1] && (
            <div
              onClick={() => onSelectCollaborator(top3[1])}
              className="order-2 md:order-1 cursor-pointer group relative p-5 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-slate-600 transition-all hover:-translate-y-1 shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-8 h-8 rounded-full bg-slate-700/80 border border-slate-500 flex items-center justify-center font-black text-slate-200 text-sm shadow">
                  #2
                </span>
                <span className="text-xs font-bold text-slate-400">Prata</span>
              </div>
              <div className="flex items-center gap-3.5 mb-3">
                <img
                  src={top3[1].user.avatar}
                  alt={top3[1].user.name}
                  className="w-13 h-13 rounded-2xl object-cover ring-2 ring-slate-400/40"
                />
                <div>
                  <h3 className="font-extrabold text-white text-base group-hover:text-amber-400 transition-colors">
                    {top3[1].user.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800">
                      {top3[1].user.matricula}
                    </span>
                    <span>•</span>
                    <span>{ROLE_LABELS[top3[1].user.role]}</span>
                  </div>
                </div>
              </div>

              {/* Tie-breaker pills */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {top3[1].safetyReportsCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1 shrink-0">
                    <AlertOctagon className="w-3 h-3 shrink-0" />
                    <span>{top3[1].safetyReportsCount} relatos</span>
                  </span>
                )}
                {top3[1].extraFiveSCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1 shrink-0">
                    <Layers className="w-3 h-3 shrink-0" />
                    <span>{top3[1].extraFiveSCount} 5S extra</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">
                    Hoje
                  </span>
                  <span className="text-emerald-400 font-extrabold text-sm">
                    {top3[1].todayScore.toFixed(1)} / 6.0 pts
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">
                    Acumulado
                  </span>
                  <span className="text-white font-black text-base">
                    {top3[1].totalScore} pts
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* GOLD - #1 CHAMPION */}
          {top3[0] && (
            <div
              onClick={() => onSelectCollaborator(top3[0])}
              className="order-1 md:order-2 cursor-pointer group relative p-6 rounded-3xl bg-gradient-to-b from-[#1c160c] via-slate-900 to-slate-950 border-2 border-amber-500/60 hover:border-amber-400 transition-all hover:-translate-y-1.5 shadow-2xl shadow-amber-500/10"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[11px] shadow-lg flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 fill-slate-950" />
                LÍDER DO RANKING
              </div>
              <div className="flex items-center justify-between mb-3 mt-1">
                <span className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-base shadow-md">
                  #1
                </span>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Ouro
                </span>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <img
                  src={top3[0].user.avatar}
                  alt={top3[0].user.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-400 shadow-md"
                />
                <div>
                  <h3 className="font-black text-white text-lg group-hover:text-amber-300 transition-colors">
                    {top3[0].user.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">
                      {top3[0].user.matricula}
                    </span>
                    <span>•</span>
                    <span>{ROLE_LABELS[top3[0].user.role]}</span>
                  </div>
                </div>
              </div>

              {/* Tie-breaker pills */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {top3[0].safetyReportsCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                    <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {top3[0].safetyReportsCount} relatos (1º Desempate)
                    </span>
                  </span>
                )}
                {top3[0].extraFiveSCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 shrink-0">
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span>{top3[0].extraFiveSCount} 5S extra</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-amber-500/20">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">
                    Hoje
                  </span>
                  <span className="text-amber-400 font-black text-base">
                    {top3[0].todayScore.toFixed(1)} / 6.0 pts (
                    {top3[0].avgAttainment}%)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">
                    Acumulado
                  </span>
                  <span className="text-white font-black text-lg">
                    {top3[0].totalScore} pts
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* BRONZE - #3 */}
          {top3[2] && (
            <div
              onClick={() => onSelectCollaborator(top3[2])}
              className="order-3 md:order-3 cursor-pointer group relative p-5 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-amber-700/60 transition-all hover:-translate-y-1 shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-8 h-8 rounded-full bg-amber-800/80 border border-amber-600 flex items-center justify-center font-black text-amber-200 text-sm shadow">
                  #3
                </span>
                <span className="text-xs font-bold text-amber-600">Bronze</span>
              </div>
              <div className="flex items-center gap-3.5 mb-3">
                <img
                  src={top3[2].user.avatar}
                  alt={top3[2].user.name}
                  className="w-13 h-13 rounded-2xl object-cover ring-2 ring-amber-700/50"
                />
                <div>
                  <h3 className="font-extrabold text-white text-base group-hover:text-amber-400 transition-colors">
                    {top3[2].user.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800">
                      {top3[2].user.matricula}
                    </span>
                    <span>•</span>
                    <span>{ROLE_LABELS[top3[2].user.role]}</span>
                  </div>
                </div>
              </div>

              {/* Tie-breaker pills */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {top3[2].safetyReportsCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1 shrink-0">
                    <AlertOctagon className="w-3 h-3 shrink-0" />
                    <span>{top3[2].safetyReportsCount} relatos</span>
                  </span>
                )}
                {top3[2].extraFiveSCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1 shrink-0">
                    <Layers className="w-3 h-3 shrink-0" />
                    <span>{top3[2].extraFiveSCount} 5S extra</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">
                    Hoje
                  </span>
                  <span className="text-emerald-400 font-extrabold text-sm">
                    {top3[2].todayScore.toFixed(1)} / 6.0 pts
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">
                    Acumulado
                  </span>
                  <span className="text-white font-black text-base">
                    {top3[2].totalScore} pts
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Ranking Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-black text-white text-base">
              {selectedRoleTab === "all"
                ? "Ranking Geral da Liga"
                : `Ranking: ${ROLE_LABELS[selectedRoleTab]}`}
            </h2>
            <span className="text-xs text-slate-400">
              ({filteredRankings.length} participantes)
            </span>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>
              Teto Diário:{" "}
              <strong className="text-amber-400">6.0 Pontos</strong>
            </span>
            <span>•</span>
            <span>
              Desempate:{" "}
              <strong className="text-white">Relatos & 5S Extra</strong>
            </span>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 text-center w-14">Pos</th>
                <th className="py-3 px-4">Colaborador</th>
                <th className="py-3 px-4">Cargo</th>
                <th className="py-3 px-4">
                  Metas Individuais de Hoje (4 Metas)
                </th>
                <th className="py-3 px-4 text-center">
                  Desempate (Relatos / 5S)
                </th>
                <th className="py-3 px-4 text-center">Pontos Hoje</th>
                <th className="py-3 px-4 text-center">Acumulado</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredRankings.map((entry) => {
                const roleBadge = ROLE_BADGE_COLORS[entry.user.role];
                const isTop1 = entry.position === 1;
                const isTop2 = entry.position === 2;
                const isTop3 = entry.position === 3;

                return (
                  <tr
                    key={entry.userId}
                    className={`hover:bg-slate-800/40 transition-colors group ${
                      entry.isDesqualificado
                        ? "bg-rose-950/20 hover:bg-rose-950/30"
                        : ""
                    }`}
                  >
                    {/* Position */}
                    <td className="py-3.5 px-4 text-center">
                      {entry.isDesqualificado ? (
                        <span
                          title={`Desqualificado: ${entry.motivoDesqualificacao || "Sem motivo"}`}
                          className="inline-flex items-center justify-center px-2 h-7 rounded-xl font-black text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                        >
                          DQ (#{entry.position})
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-black text-xs ${
                            isTop1
                              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30"
                              : isTop2
                                ? "bg-slate-600 text-white"
                                : isTop3
                                  ? "bg-amber-800 text-amber-200"
                                  : "bg-slate-800/80 text-slate-400"
                          }`}
                        >
                          #{entry.position}
                        </span>
                      )}
                    </td>

                    {/* Collaborator */}
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => onSelectCollaborator(entry)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <img
                          src={entry.user.avatar}
                          alt={entry.user.name}
                          className={`w-10 h-10 rounded-xl object-cover ring-1 ${
                            entry.isDesqualificado
                              ? "ring-rose-500/60 grayscale-[0.3]"
                              : "ring-slate-700"
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white group-hover:text-amber-400 transition-colors block">
                              {entry.user.name}
                            </span>
                            {entry.isDesqualificado && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                                <AlertOctagon className="w-3 h-3 text-rose-400" />
                                Desqualificado
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 block">
                            Matrícula: {entry.user.matricula}
                          </span>
                          {entry.isDesqualificado &&
                            entry.motivoDesqualificacao && (
                              <span
                                className="text-[11px] text-rose-400 font-medium italic block max-w-xs truncate"
                                title={entry.motivoDesqualificacao}
                              >
                                Motivo: "{entry.motivoDesqualificacao}"
                              </span>
                            )}
                        </div>
                      </div>
                    </td>

                    {/* Cargo */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}
                      >
                        <span>{ROLE_ICONS[entry.user.role]}</span>
                        <span>{ROLE_LABELS[entry.user.role]}</span>
                      </span>
                    </td>

                    {/* The 4 Specific Metas Breakdown */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap max-w-md">
                        {entry.user.metas.map((meta) => {
                          const todayDateStr = new Date().toISOString().split('T')[0];
                          const todayRec = storageService.getDailyRecord(entry.userId, todayDateStr);
                          const achieved = todayRec?.metaStatus
                            ? !!todayRec.metaStatus[meta.ordem]
                            : false;
                          return (
                            <span
                              key={meta.ordem}
                              title={`${meta.descricao} (${meta.pontos} pts)`}
                              className={`px-2 py-1 rounded-md text-[10px] font-semibold border flex items-center gap-1 transition-all ${
                                achieved
                                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                  : "bg-slate-800/80 text-slate-400 border-slate-700/60"
                              }`}
                            >
                              <span className="font-bold text-[9px]">
                                M{meta.ordem}:
                              </span>
                              <span className="truncate max-w-[120px]">
                                {meta.descricao}
                              </span>
                              <span
                                className={`font-mono text-[9px] font-black ${
                                  achieved
                                    ? "text-emerald-400"
                                    : "text-slate-500"
                                }`}
                              >
                                {meta.pontos}p
                              </span>
                              {achieved ? (
                                <Check className="w-2.5 h-2.5 text-emerald-400 ml-0.5" />
                              ) : (
                                <span className="text-slate-500 text-[8px]">
                                  •
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Desempate (Relatos & 5S Extra) */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          title="1º Critério de Desempate: Relatos de Segurança / Anomalia realizados"
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                        >
                          <AlertOctagon className="w-3 h-3 text-amber-400" />
                          {entry.safetyReportsCount}
                        </span>

                        <span
                          title="2º Critério de Desempate: 5S em mais de uma área do armazém"
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center gap-1"
                        >
                          <Layers className="w-3 h-3 text-purple-400" />
                          {entry.extraFiveSCount}
                        </span>
                      </div>
                    </td>

                    {/* Today Score */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-black text-sm text-emerald-400">
                          {entry.todayScore.toFixed(1)} / 6.0
                        </span>
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full"
                            style={{ width: `${entry.avgAttainment}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold mt-0.5">
                          {entry.avgAttainment}%
                        </span>
                      </div>
                    </td>

                    {/* Total Accumulated Score */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-black text-sm text-white block">
                        {entry.totalScore} pts
                      </span>
                      <span className="text-[10px] text-slate-500">
                        acumulado
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectCollaborator(entry)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Ver
                        </button>

                        {canEdit && (
                          <button
                            onClick={() =>
                              onEditCollaboratorMetas &&
                              onEditCollaboratorMetas(entry.user)
                            }
                            title="Lançar / Auditar as 4 metas deste colaborador"
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <Sliders className="w-3 h-3" />
                            Auditar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="lg:hidden divide-y divide-slate-800/80">
          {filteredRankings.map((entry) => (
            <div
              key={entry.userId}
              className={`p-4 space-y-3 transition-colors ${
                entry.isDesqualificado
                  ? "bg-rose-950/20 border-l-4 border-l-rose-500"
                  : ""
              }`}
            >
              {/* Header: Position, Avatar, Name & Scores */}
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {entry.isDesqualificado ? (
                    <span
                      title={`Desqualificado: ${entry.motivoDesqualificacao || ""}`}
                      className="px-2 h-7 rounded-xl font-black text-[11px] flex items-center justify-center shrink-0 bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    >
                      DQ
                    </span>
                  ) : (
                    <span
                      className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        entry.position === 1
                          ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30"
                          : entry.position === 2
                            ? "bg-slate-300 text-slate-950"
                            : entry.position === 3
                              ? "bg-amber-700 text-amber-100"
                              : "bg-slate-800 text-amber-400"
                      }`}
                    >
                      #{entry.position}
                    </span>
                  )}
                  <img
                    src={entry.user.avatar}
                    alt={entry.user.name}
                    className={`w-10 h-10 rounded-xl object-cover ring-1 shrink-0 ${
                      entry.isDesqualificado
                        ? "ring-rose-500/60 grayscale-[0.3]"
                        : "ring-slate-750"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-white text-sm truncate">
                        {entry.user.name}
                      </h4>
                      {entry.isDesqualificado && (
                        <span className="px-2 py-0.2 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[9px] font-black uppercase tracking-wider shrink-0">
                          Desqualificado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                      <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 shrink-0">
                        {entry.user.matricula}
                      </span>
                      <span>•</span>
                      <span className="truncate">
                        {ROLE_LABELS[entry.user.role]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-black text-sm text-emerald-400 block leading-tight">
                    {entry.todayScore.toFixed(1)} / 6.0
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold block">
                    {entry.totalScore} pts
                  </span>
                </div>
              </div>

              {/* Disqualification Motive Banner for Mobile */}
              {entry.isDesqualificado && entry.motivoDesqualificacao && (
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs space-y-0.5">
                  <div className="flex items-center gap-1 font-bold text-rose-400 text-[11px]">
                    <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                    <span>Desqualificado pelo Gestor:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 italic pl-4">
                    "{entry.motivoDesqualificacao}"
                  </p>
                </div>
              )}

              {/* 4 Metas Snapshot Row for Mobile */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {entry.user.metas.map((meta) => {
                  const todayDateStr = new Date().toISOString().split('T')[0];
                  const todayRec = storageService.getDailyRecord(
                    entry.userId,
                    todayDateStr,
                  );
                  const achieved = todayRec?.metaStatus
                    ? !!todayRec.metaStatus[meta.ordem]
                    : false;

                  return (
                    <div
                      key={meta.ordem}
                      className={`p-1.5 rounded-lg border text-center transition-all ${
                        achieved
                          ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                          : "bg-slate-950/60 border-slate-800/80 text-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-0.5 text-[10px] font-bold">
                        <span>M{meta.ordem}</span>
                        {achieved ? (
                          <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                        ) : (
                          <span className="text-slate-600 text-[8px]">•</span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono block leading-none pt-0.5">
                        {meta.pontos}p
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Tie-breaker badges */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-0.5">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold flex items-center gap-1 shrink-0">
                  <AlertOctagon className="w-3 h-3 shrink-0 text-amber-400" />
                  <span>{entry.safetyReportsCount} relato(s) aprovado(s)</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold flex items-center gap-1 shrink-0">
                  <Layers className="w-3 h-3 shrink-0 text-purple-400" />
                  <span>{entry.extraFiveSCount} 5S extra</span>
                </span>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-1 text-xs border-t border-slate-800/60 flex-wrap gap-2">
                <button
                  onClick={() => onSelectCollaborator(entry)}
                  className="text-amber-400 font-bold hover:underline flex items-center gap-1 shrink-0"
                >
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  Ver Detalhes
                </button>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() =>
                        onEditCollaboratorMetas &&
                        onEditCollaboratorMetas(entry.user)
                      }
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm shadow-amber-500/20 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 shrink-0" />
                      <span>Auditar Metas</span>
                    </button>
                  )}
                  {canEdit &&
                    (entry.isDesqualificado ? (
                      <button
                        type="button"
                        onClick={() => handleOpenDisqualifyModal(entry.user)}
                        title="Reativar colaborador na Liga DPO"
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold text-xs flex items-center gap-1.5 border border-emerald-500/40 transition-all cursor-pointer"
                      >
                        <Undo2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Reativar</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenDisqualifyModal(entry.user)}
                        title="Desqualificar colaborador da Liga DPO"
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-rose-500/30 transition-all cursor-pointer"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        <span>Desqualificar</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disqualification Modal for Gestor */}
      <DisqualificationModal
        isOpen={isDisqualifyModalOpen}
        onClose={() => setIsDisqualifyModalOpen(false)}
        user={selectedUserToDisqualify}
        gestorName="Gestor DPO Armazém"
        onConfirmDisqualify={handleConfirmDisqualify}
        onConfirmRequalify={handleConfirmRequalify}
      />
    </div>
  );
};
