import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Sliders,
  Sparkles,
  Search,
  Filter,
  Save,
  Check,
  X,
  Target,
  Users,
  Award,
  Calendar,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Undo2,
  AlertOctagon,
  Camera,
  Layers,
  RotateCcw,
  Zap,
  ChevronRight,
  Info,
  ExternalLink,
  CheckCheck,
  Plus,
} from 'lucide-react';
import {
  User,
  DailyRecord,
  JobRole,
  ROLE_LABELS,
  ROLE_BADGE_COLORS,
  ROLE_ICONS,
  SafetyAnomalyReport,
} from '../types/dpo';
import { storageService } from '../services/storageService';
import { DisqualificationModal } from './DisqualificationModal';
import { SupervisorCreateAnomalyModal } from './SupervisorCreateAnomalyModal';

interface SupervisorScoringGuideProps {
  users: User[];
  dailyRecords: DailyRecord[];
  onDataChanged: () => void;
  onNavigateTab?: (tab: string) => void;
}

// OS 6 AJUDANTES VALIDADOS EXCLUSIVAMENTE ATRAVÉS DA FOTO DO CÍCERO (CONFERENTE G1121)
const CICERO_TEAM_MATRICULAS = ['G1128', 'G1147', 'G1125', 'G1161', 'G1160', 'G1154'];

export const SupervisorScoringGuide: React.FC<SupervisorScoringGuideProps> = ({
  users,
  dailyRecords,
  onDataChanged,
  onNavigateTab,
}) => {
  const [selectedRole, setSelectedRole] = useState<JobRole | 'all' | 'desqualificados'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'warning' | 'info'>('success');

  // Disqualification Modal State
  const [isDisqualifyModalOpen, setIsDisqualifyModalOpen] = useState(false);
  const [selectedUserToDisqualify, setSelectedUserToDisqualify] = useState<User | null>(null);

  // Anomaly Report Modal State (Supervisor Manual Launch)
  const [isAnomalyModalOpen, setIsAnomalyModalOpen] = useState(false);
  const [anomalyPreselectedUserId, setAnomalyPreselectedUserId] = useState<string | undefined>(undefined);

  // Safety Meta Direct/Report Prompt State
  const [safetyPromptData, setSafetyPromptData] = useState<{
    user: User;
    ordem: number;
    metaDesc: string;
  } | null>(null);

  // Validation Blocked Modal State (when attempting to score without prior audit)
  const [validationAlertData, setValidationAlertData] = useState<{
    type: '5s' | 'safety';
    user: User;
    isCiceroTeam: boolean;
    metaDesc: string;
  } | null>(null);

  const handleOpenCreateAnomalyModal = (userId?: string) => {
    setAnomalyPreselectedUserId(userId);
    setIsAnomalyModalOpen(true);
  };

  const handleAnomalyCreated = (report: SafetyAnomalyReport) => {
    onDataChanged();
    setFeedbackType('success');
    setFeedback(`Relato de anomalia registrado e atribuído com sucesso a ${report.userName}! Meta de segurança validada.`);
    setTimeout(() => setFeedback(''), 5000);
  };

  const handleScoreSafetyDirectly = () => {
    if (!safetyPromptData) return;
    const { user, ordem } = safetyPromptData;
    storageService.toggleMetaStatus(user.id, selectedDate, ordem, true);
    onDataChanged();
    setSafetyPromptData(null);
    setFeedbackType('success');
    setFeedback(`Meta de Segurança (${ordem}) pontuada diretamente para ${user.name}.`);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleLaunchReportFromPrompt = () => {
    if (!safetyPromptData) return;
    const targetUserId = safetyPromptData.user.id;
    setSafetyPromptData(null);
    handleOpenCreateAnomalyModal(targetUserId);
  };

  // Locate Cicero and check his 5S status for the selected date
  const ciceroUser = users.find(
    (u) => u.matricula === 'G1121' || u.name.toLowerCase().includes('cicero')
  );
  const ciceroSubmissions = storageService.getFiveSSubmissions();
  const cicero5SSub = ciceroUser
    ? ciceroSubmissions.find((s) => s.userId === ciceroUser.id && s.date === selectedDate)
    : null;
  const isCicero5SApproved = ciceroUser
    ? storageService.hasApprovedFiveS(ciceroUser.id, selectedDate)
    : false;

  const handleOpenDisqualifyModal = (user: User) => {
    setSelectedUserToDisqualify(user);
    setIsDisqualifyModalOpen(true);
  };

  const handleConfirmDisqualify = (userId: string, motivo: string) => {
    storageService.disqualifyUser(userId, motivo, 'Gestor DPO Armazém');
    onDataChanged();
    setFeedbackType('warning');
    setFeedback(`Colaborador desqualificado da Liga DPO. Foi movido para a última posição do ranking mantendo sua pontuação.`);
    setTimeout(() => setFeedback(''), 5000);
  };

  const handleConfirmRequalify = (userId: string) => {
    storageService.requalifyUser(userId, 'Gestor DPO Armazém');
    onDataChanged();
    setFeedbackType('success');
    setFeedback(`Qualificação restaurada com sucesso! A posição do colaborador no ranking foi recalculada.`);
    setTimeout(() => setFeedback(''), 5000);
  };

  // Direct 1-click approval for Cicero's 5S (auto-fills the 6 helpers)
  const handleApproveCiceroDirectly = () => {
    if (!cicero5SSub) return;
    storageService.validateFiveSSubmission(
      cicero5SSub.id,
      'aprovado',
      'Gestor DPO Armazém',
      1,
      'Auditoria 5S da equipe homologada pelo supervisor via foto do Conferente Cícero.'
    );
    onDataChanged();
    setValidationAlertData(null);
    setFeedbackType('success');
    setFeedback(
      `🎉 Foto do Conferente Cícero homologada com sucesso! O 5S dos 6 colaboradores (Eldenkleber, Luis, Natanael, Dimas, Admilton e Edilson) foi preenchido e pontuado automaticamente!`
    );
    setTimeout(() => setFeedback(''), 6000);
  };

  // Count disqualified users
  const disqualifiedCount = users.filter((u) => u.desqualificado).length;

  // Filter users
  const filteredUsers = users.filter((u) => {
    if (selectedRole === 'desqualificados') {
      if (!u.desqualificado) return false;
    } else if (selectedRole !== 'all' && u.role !== selectedRole) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.matricula.toLowerCase().includes(q);
    }
    return true;
  });

  // Toggle single meta (preencher uma a uma ou despontuar)
  const handleToggleMeta = (user: User, ordem: number, currentVal: boolean) => {
    const meta = user.metas.find((m) => m.ordem === ordem);
    const willAchieve = !currentVal;

    // Se estiver despontuando (willAchieve === false), a desmarcação é sempre permitida!
    if (!willAchieve) {
      storageService.toggleMetaStatus(user.id, selectedDate, ordem, false);
      onDataChanged();
      setFeedbackType('info');
      setFeedback(`Meta ${ordem} despontuada para ${user.name}.`);
      setTimeout(() => setFeedback(''), 3000);
      return;
    }

    // Se estiver pontuando (willAchieve === true):
    if (meta) {
      const is5S = meta.categoria === '5s' || meta.descricao.toLowerCase().includes('5s');
      const isSafety =
        meta.categoria === 'seguranca' ||
        meta.descricao.toLowerCase().includes('relato') ||
        meta.descricao.toLowerCase().includes('anomalia') ||
        meta.descricao.toLowerCase().includes('segurança');

      // 1. REGRA 5S: O SUPERVISOR PODE MARCAR O ÍCONE DE 5S DIRETAMENTE MESMO SEM O COLABORADOR TER ENVIADO FOTO!
      if (is5S) {
        storageService.toggleMetaStatus(user.id, selectedDate, ordem, true);
        onDataChanged();
        setFeedbackType('success');
        setFeedback(`Meta ${ordem} (5S) pontuada com sucesso para ${user.name}!`);
        setTimeout(() => setFeedback(''), 3000);
        return;
      }

      // 2. REGRA SEGURANÇA: Se ainda não há relato homologado no dia, abre o prompt flexível
      if (isSafety) {
        const hasSafety = storageService.hasApprovedSafetyReport(user.id, selectedDate);
        if (!hasSafety) {
          setSafetyPromptData({
            user,
            ordem,
            metaDesc: meta.descricao,
          });
          return;
        }
      }
    }

    // Se passou na validação, computa a pontuação
    storageService.toggleMetaStatus(user.id, selectedDate, ordem, true);
    onDataChanged();
  };

  // Complete metas for a single user (bater metas respeitando validações de 5S e Relatos)
  const handleScoreAllMetas = (user: User) => {
    const hasSafety = storageService.hasApprovedSafetyReport(user.id, selectedDate);

    const metaStatus: Record<number, boolean> = {};
    let pendingNote = '';

    user.metas.forEach((m) => {
      const is5S = m.categoria === '5s' || m.descricao.toLowerCase().includes('5s');
      const isSafety =
        m.categoria === 'seguranca' ||
        m.descricao.toLowerCase().includes('relato') ||
        m.descricao.toLowerCase().includes('anomalia') ||
        m.descricao.toLowerCase().includes('segurança');

      if (is5S) {
        // O supervisor pode bater o 5S diretamente na pontuação!
        metaStatus[m.ordem] = true;
      } else if (isSafety) {
        metaStatus[m.ordem] = hasSafety;
        if (!hasSafety) {
          pendingNote += ' Relato de segurança pendente (você pode lançar via botão "+ Relato").';
        }
      } else {
        metaStatus[m.ordem] = true;
      }
    });

    storageService.setAllMetasStatus(user.id, selectedDate, metaStatus);
    onDataChanged();

    if (pendingNote) {
      setFeedbackType('warning');
      setFeedback(`Metas operacionais e de qualidade batidas para ${user.name}!${pendingNote}`);
    } else {
      setFeedbackType('success');
      setFeedback(`Todas as 4 metas batidas (6.0 pts) para ${user.name}! Você pode despontuar individualmente se desejar.`);
    }
    setTimeout(() => setFeedback(''), 5000);
  };

  // Clear all metas for a user (score = 0.0)
  const handleClearAllMetas = (userId: string) => {
    storageService.setAllMetasStatus(userId, selectedDate, {
      1: false,
      2: false,
      3: false,
      4: false,
    });
    onDataChanged();
    setFeedbackType('info');
    setFeedback('Pontuação zerada (0.0). Preencha meta por meta conforme o turno.');
    setTimeout(() => setFeedback(''), 3000);
  };

  // BATCH: Score all active collaborators (respeitando validações de 5S e Relatos)
  const handleBatchScoreAll = () => {
    const result = storageService.batchScoreAllForDate(selectedDate);
    onDataChanged();

    if (result.pendingAuditsCount > 0) {
      setFeedbackType('warning');
      setFeedback(
        `⚡ Metas operacionais e de qualidade batidas para toda a equipe! ${result.pendingAuditsCount} itens de 5S ou Relatos permaneceram pendentes pois exigem validação prévia na Auditoria 5S e Relatos de Anomalia.`
      );
    } else {
      setFeedbackType('success');
      setFeedback(
        `⚡ Todas as metas marcadas como batidas (6.0) para todos os colaboradores no dia ${selectedDate}. Despontue individualmente os itens não atingidos!`
      );
    }
    setTimeout(() => setFeedback(''), 6000);
  };

  // BATCH: Reset today's scores to 0.0 (Virada de dia / novo turno)
  const handleBatchResetDay = () => {
    storageService.resetDailyScoresForDate(selectedDate);
    onDataChanged();
    setFeedbackType('warning');
    setFeedback(
      `🔄 Pontuações do dia ${selectedDate} zeradas (0.0) para toda a equipe. Preencha uma a uma ou utilize "Bater Todas e Despontuar".`
    );
    setTimeout(() => setFeedback(''), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              PAINEL EXCLUSIVO • PONTUAÇÃO DO SUPERVISOR
            </span>
            <span className="text-xs text-slate-400">• Teto: 6.0 Pontos por Colaborador</span>
          </div>
          <h1 className="text-2xl font-black text-white">Lançamento de Metas Diárias da Equipe</h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Na virada do dia, as pontuações iniciam zeradas. Cabe ao supervisor preencher meta por meta individualmente ou bater todas e despontuar. 5S e Relatos de Anomalia exigem validação formal nas respectivas abas de auditoria.
          </p>
        </div>

        {/* Global Batch Actions (Virada de dia / Bater Todas) & Relato Manual */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {/* BOTÃO PARA INFORMAR RELATOS DE ANOMALIA NÃO LANÇADOS NO APP */}
          <button
            onClick={() => handleOpenCreateAnomalyModal()}
            title="Informar relato de anomalia / segurança atribuindo a qualquer colaborador (foto opcional)"
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <AlertOctagon className="w-4 h-4 fill-slate-950" />
            <span>+ Lançar Relato de Anomalia</span>
          </button>

          <button
            onClick={handleBatchResetDay}
            title="Zerar pontuações do dia para iniciar nova conferência"
            className="px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:border-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Zerar Dia (0.0 Geral)</span>
          </button>

          <button
            onClick={handleBatchScoreAll}
            title="Bater metas operacionais para toda a equipe (itens auditados são computados e falhas podem ser despontuadas)"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Bater Todas e Despontuar</span>
          </button>
        </div>
      </div>

      {/* Cicero Team Rule Quick Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-purple-300 uppercase tracking-wider">
                Regra DPO: 5S da Equipe Armazém (Foto do Cícero)
              </span>
              {isCicero5SApproved ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> Homologado
                </span>
              ) : cicero5SSub ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Foto Pendente de Aprovação
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                  Aguardando envio de foto
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              O 5S dos colaboradores <strong>Eldenkleber, Luis, Natanael, Dimas, Admilton e Edilson</strong> é validado através da foto do Conferente <strong>Cícero (G1121)</strong>. Se aprovada, o 5S desta equipe é preenchido automaticamente!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isCicero5SApproved && cicero5SSub && (
            <button
              onClick={handleApproveCiceroDirectly}
              title="Aprovar a foto de 5S enviada por Cícero e preencher automaticamente os 6 ajudantes"
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/20"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Aprovar Foto Cícero Agora</span>
            </button>
          )}

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('5s')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1 border border-slate-700"
            >
              <span>Ver Auditoria 5S</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 animate-fade-in shadow-md ${
            feedbackType === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : feedbackType === 'warning'
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
              : 'bg-blue-500/20 border-blue-500/40 text-blue-200'
          }`}
        >
          {feedbackType === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : feedbackType === 'warning' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          ) : (
            <Info className="w-4 h-4 shrink-0 text-blue-400" />
          )}
          <span>{feedback}</span>
        </div>
      )}

      {/* Control Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        {/* Cargo Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setSelectedRole('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              selectedRole === 'all'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setSelectedRole('ajudante')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              selectedRole === 'ajudante'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Ajudantes (9)
          </button>
          <button
            onClick={() => setSelectedRole('conferente')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              selectedRole === 'conferente'
                ? 'bg-emerald-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Conferentes (2)
          </button>
          <button
            onClick={() => setSelectedRole('empilhador')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              selectedRole === 'empilhador'
                ? 'bg-blue-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Empilhadores (3)
          </button>
          <button
            onClick={() => setSelectedRole('manobrista')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              selectedRole === 'manobrista'
                ? 'bg-purple-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Manobrista (1)
          </button>

          {/* Tab de Desqualificados */}
          <button
            onClick={() => setSelectedRole('desqualificados')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedRole === 'desqualificados'
                ? 'bg-rose-600 text-white font-black'
                : disqualifiedCount > 0
                ? 'text-rose-400 hover:text-rose-200 bg-rose-950/30 border border-rose-500/30'
                : 'text-slate-500 bg-slate-850/40'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Desqualificados ({disqualifiedCount})</span>
          </button>
        </div>

        {/* Date Presets, Picker & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Date Presets */}
          {(() => {
            const todayStr = new Date().toISOString().split('T')[0];
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
            return (
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedDate === todayStr
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Hoje ({todayStr.split('-').slice(1).reverse().join('/')})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(yesterdayStr)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedDate === yesterdayStr
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ontem ({yesterdayStr.split('-').slice(1).reverse().join('/')})
                </button>
              </div>
            );
          })()}

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            />
          </div>

          <div className="relative w-44">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Info Banner on selected date */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Data ativa: <strong className="text-white font-mono">{selectedDate}</strong>.
            {selectedDate === '2026-09-30' ? (
              <span className="text-amber-300 ml-1">
                (Virada do dia: as pontuações iniciam zeradas em 0.0. Preencha uma a uma ou bata todas e despontue).
              </span>
            ) : (
              <span className="text-slate-400 ml-1">
                (Preencha meta por meta individualmente ou utilize "Bater Todas" e despontue as falhas).
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span>* 5S e Relatos exigem validação prévia</span>
        </div>
      </div>

      {/* Collaborator Scoring Cards List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-400">Nenhum colaborador encontrado com os filtros atuais.</p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const rec = dailyRecords.find((r) => r.userId === user.id && r.date === selectedDate);
            const metaStatus = rec?.metaStatus || { 1: false, 2: false, 3: false, 4: false };
            const score = rec ? rec.calculatedScore : 0;
            const roleBadge = ROLE_BADGE_COLORS[user.role];

            // Verification checks for 5S and Safety Reports
            const has5S = storageService.hasApprovedFiveS(user.id, selectedDate);
            const hasSafety = storageService.hasApprovedSafetyReport(user.id, selectedDate);
            const isCiceroTeam = CICERO_TEAM_MATRICULAS.includes(user.matricula);

            return (
              <div
                key={user.id}
                className={`p-5 rounded-3xl bg-slate-900/90 border transition-colors shadow-xl space-y-4 ${
                  user.desqualificado
                    ? 'border-rose-500/50 bg-rose-950/15'
                    : 'border-slate-800'
                }`}
              >
                {/* Header Info & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className={`w-12 h-12 rounded-2xl object-cover ring-2 ${
                        user.desqualificado ? 'ring-rose-500/60 grayscale-[0.3]' : 'ring-slate-700'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-white text-base truncate">{user.name}</h3>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold shrink-0">
                          {user.matricula}
                        </span>
                        {user.desqualificado && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-black uppercase tracking-wider shrink-0">
                            Desqualificado
                          </span>
                        )}
                        {isCiceroTeam && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[10px] font-bold shrink-0">
                            Equipe Armazém (5S via Cícero)
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold ${roleBadge.text}`}
                      >
                        <span>{ROLE_ICONS[user.role]}</span>
                        <span>{ROLE_LABELS[user.role]}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Nota do Dia ({selectedDate})
                      </span>
                      <span className="text-2xl font-black text-emerald-400">
                        {score.toFixed(1)} <span className="text-xs text-slate-500 font-bold">/ 6.0</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* BATER TODAS */}
                      <button
                        onClick={() => handleScoreAllMetas(user)}
                        title="Bater metas operacionais e despontuar individualmente"
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-xs font-bold border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Bater Todas</span>
                      </button>

                      {/* LANÇAR RELATO DE ANOMALIA PARA ESTE COLABORADOR */}
                      <button
                        onClick={() => handleOpenCreateAnomalyModal(user.id)}
                        title={`Lançar e atribuir relato de anomalia para ${user.name} (foto opcional)`}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-bold border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <AlertOctagon className="w-3.5 h-3.5" />
                        <span>+ Relato</span>
                      </button>

                      {/* ZERAR (0.0) */}
                      <button
                        onClick={() => handleClearAllMetas(user.id)}
                        title="Zerar metas do dia para preencher uma a uma"
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Zerar</span>
                      </button>

                      {/* DESQUALIFICAR / REATIVAR AÇÃO EXCLUSIVA SUPERVISOR / GESTOR */}
                      {user.desqualificado ? (
                        <button
                          onClick={() => handleOpenDisqualifyModal(user)}
                          title="Restaurar qualificação na Liga DPO"
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-xs font-bold border border-emerald-500/40 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          <span>Reativar</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenDisqualifyModal(user)}
                          title="Desqualificar este colaborador da Liga informando o motivo formal"
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-xs font-bold border border-rose-500/30 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Desqualificar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Disqualification Banner on Card */}
                {user.desqualificado && (
                  <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-rose-400">
                        <AlertOctagon className="w-4 h-4 shrink-0" />
                        <span>Colaborador Desqualificado da Liga DPO (Posicionado no Último Lugar)</span>
                      </div>
                      {user.dataDesqualificacao && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {user.dataDesqualificacao}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 italic pl-5">
                      <strong>Motivo informado:</strong> "{user.motivoDesqualificacao || 'Sem motivo registrado'}"
                    </p>
                  </div>
                )}

                {/* The 4 Specific Metas Interactive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {user.metas.map((meta) => {
                    const isChecked = !!metaStatus[meta.ordem];
                    const is5SMeta =
                      meta.categoria === '5s' || meta.descricao.toLowerCase().includes('5s');
                    const isSafetyMeta =
                      meta.categoria === 'seguranca' ||
                      meta.descricao.toLowerCase().includes('relato') ||
                      meta.descricao.toLowerCase().includes('anomalia') ||
                      meta.descricao.toLowerCase().includes('segurança');

                    return (
                      <div
                        key={meta.ordem}
                        onClick={() => handleToggleMeta(user, meta.ordem, isChecked)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between select-none ${
                          isChecked
                            ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-90'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-amber-400">
                              Meta {meta.ordem}
                            </span>
                            <span className="font-mono text-xs font-black px-1.5 py-0.2 rounded bg-slate-800 text-slate-200">
                              +{meta.pontos} {meta.pontos === 1 ? 'pt' : 'pts'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white leading-snug">
                            {meta.descricao}
                          </p>

                          {/* Visual Indicators for 5S and Safety Reports */}
                          {is5SMeta && (
                            <div className="pt-1">
                              {isChecked ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                                  {has5S ? '5S com Foto Homologada' : '5S Pontuado pelo Supervisor'}
                                </span>
                              ) : has5S ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  <Camera className="w-3 h-3 text-purple-400" />
                                  {isCiceroTeam ? 'Foto Cícero Homologada' : 'Foto Auditada'} (Clique p/ Pontuar)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                                  <Camera className="w-3 h-3" />
                                  Sem Foto (Clique p/ Pontuar Direto)
                                </span>
                              )}
                            </div>
                          )}

                          {isSafetyMeta && (
                            <div className="pt-1">
                              {isChecked ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                  {hasSafety ? 'Relato Homologado' : 'Validado pelo Supervisor'}
                                </span>
                              ) : hasSafety ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                  Relato Disponível (Clique p/ Pontuar)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                                  <AlertOctagon className="w-3 h-3 text-amber-400" />
                                  Sem Relato (Clique p/ Lançar)
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="pt-3 mt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                          <span
                            className={`text-[11px] font-bold ${
                              isChecked ? 'text-emerald-400' : 'text-slate-500'
                            }`}
                          >
                            {isChecked ? 'Batida (Clique p/ despontuar)' : 'Pendente (Clique p/ pontuar)'}
                          </span>

                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-transform ${
                              isChecked
                                ? 'bg-emerald-500 text-slate-950 scale-105'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isChecked ? (
                              <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                            ) : (
                              <X className="w-3.5 h-3.5 shrink-0" />
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Disqualification Modal for Supervisor */}
      <DisqualificationModal
        isOpen={isDisqualifyModalOpen}
        onClose={() => setIsDisqualifyModalOpen(false)}
        user={selectedUserToDisqualify}
        gestorName="Gestor DPO Armazém"
        onConfirmDisqualify={handleConfirmDisqualify}
        onConfirmRequalify={handleConfirmRequalify}
      />

      {/* Modal Informativo / Validação Obrigatória de 5S e Relatos */}
      {validationAlertData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    validationAlertData.type === '5s'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {validationAlertData.type === '5s' ? (
                    <Camera className="w-5 h-5" />
                  ) : (
                    <AlertOctagon className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {validationAlertData.type === '5s'
                      ? 'Auditoria 5S Obrigatória'
                      : 'Relato de Anomalia Obrigatório'}
                  </h3>
                  <span className="text-xs text-slate-400">
                    Colaborador: {validationAlertData.user.name} ({validationAlertData.user.matricula})
                  </span>
                </div>
              </div>

              <button
                onClick={() => setValidationAlertData(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content description based on rule */}
            {validationAlertData.type === '5s' && validationAlertData.isCiceroTeam ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-purple-300">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Regra Oficial DPO: 5S da Equipe Armazém</span>
                  </div>
                  <p className="leading-relaxed">
                    O 5S dos colaboradores <strong>Eldenkleber, Luis, Natanael, Dimas, Admilton e Edilson</strong> é validado através da foto do Conferente <strong>Cícero (G1121)</strong>. Se auditada e validada, o 5S desta equipe é preenchido automaticamente!
                  </p>
                </div>

                {cicero5SSub ? (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Foto enviada por Cícero em {cicero5SSub.date}:</span>
                      <span className="text-[10px] font-black uppercase text-amber-400 px-2 py-0.5 rounded bg-amber-500/10">
                        {cicero5SSub.status}
                      </span>
                    </div>
                    <div className="h-32 rounded-xl overflow-hidden bg-slate-900">
                      <img src={cicero5SSub.photoUrl} alt="Foto Cícero" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[11px] text-slate-400 italic">"{cicero5SSub.notes}"</p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
                    Cícero ainda não submeteu evidência fotográfica para o dia {selectedDate}.
                  </div>
                )}
              </div>
            ) : validationAlertData.type === '5s' ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                <p>
                  Para pontuar a meta <strong>"{validationAlertData.metaDesc}"</strong>, é necessário submeter uma vistoria fotográfica e homologá-la na aba <strong>"Auditoria 5S"</strong>.
                </p>
                <p className="text-slate-400 text-[11px]">
                  A pontuação manual direta de 5S fica bloqueada para assegurar a conformidade visual dos 5 Sensos operacionais.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                <p>
                  Para pontuar a meta <strong>"{validationAlertData.metaDesc}"</strong>, o colaborador deve cadastrar um relato de anomalia/segurança e o gestor deve aprová-lo formalmente na aba <strong>"Relatos de Anomalia"</strong>.
                </p>
                <p className="text-slate-400 text-[11px]">
                  Relatos preventivos auditados valem pontuação diária e ativam o 1º critério oficial de desempate da Liga DPO.
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setValidationAlertData(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-all"
              >
                Entendi, Fechar
              </button>

              {validationAlertData.type === '5s' && validationAlertData.isCiceroTeam && cicero5SSub && !isCicero5SApproved && (
                <button
                  type="button"
                  onClick={handleApproveCiceroDirectly}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Aprovar Foto de Cícero Agora</span>
                </button>
              )}

              {onNavigateTab && validationAlertData.type === '5s' && (
                <button
                  type="button"
                  onClick={() => {
                    setValidationAlertData(null);
                    onNavigateTab('5s');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <span>Ir para Auditoria 5S</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}

              {onNavigateTab && validationAlertData.type === 'safety' && (
                <button
                  type="button"
                  onClick={() => {
                    setValidationAlertData(null);
                    onNavigateTab('relatos-anomalias');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <span>Ir para Relatos de Anomalia</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Prompt quando a Meta de Segurança é clicada sem relato prévio */}
      {safetyPromptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <AlertOctagon className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Relato de Anomalia / Segurança</h3>
                  <span className="text-xs text-slate-400">
                    Colaborador: {safetyPromptData.user.name} ({safetyPromptData.user.matricula})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSafetyPromptData(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="leading-relaxed">
                <strong>{safetyPromptData.user.name}</strong> ainda não possui um relato de anomalia registrado para a data <strong>{selectedDate}</strong>.
              </p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Como supervisor, você pode <strong>lançar e atribuir um novo relato</strong> diretamente a este colaborador (com ou sem foto) para contar no 1º critério de desempate, ou <strong>pontuar a meta de segurança diretamente</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSafetyPromptData(null)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleScoreSafetyDirectly}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition-all border border-amber-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Pontuar Meta Direto</span>
              </button>

              <button
                type="button"
                onClick={handleLaunchReportFromPrompt}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <AlertOctagon className="w-3.5 h-3.5 fill-slate-950" />
                <span>Lançar Relato Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Lançamento Manual de Relato de Anomalia pelo Supervisor */}
      <SupervisorCreateAnomalyModal
        isOpen={isAnomalyModalOpen}
        onClose={() => setIsAnomalyModalOpen(false)}
        users={users}
        preselectedUserId={anomalyPreselectedUserId}
        preselectedDate={selectedDate}
        onAnomalyCreated={handleAnomalyCreated}
      />
    </div>
  );
};
