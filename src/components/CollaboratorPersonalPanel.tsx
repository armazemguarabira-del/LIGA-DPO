import React, { useState } from 'react';
import {
  Trophy,
  Award,
  CheckCircle,
  AlertTriangle,
  Camera,
  TrendingUp,
  ArrowUpRight,
  Flame,
  Clock,
  Sparkles,
  ShieldCheck,
  Target,
  Zap,
  Check,
  X,
  Calendar,
  HelpCircle,
  Upload,
  AlertOctagon,
  Layers,
  Send,
  ShieldAlert,
} from 'lucide-react';
import {
  User,
  RankingEntry,
  DailyRecord,
  ROLE_LABELS,
  ROLE_BADGE_COLORS,
  ROLE_ICONS,
  FiveSSubmission,
  SafetyAnomalyReport,
} from '../types/dpo';
import { storageService } from '../services/storageService';
import { WebcamCapture } from './WebcamCapture';

interface CollaboratorPersonalPanelProps {
  currentUser: User;
  rankingEntry?: RankingEntry;
  dailyRecord: DailyRecord | null;
  onNavigateToRanking: () => void;
  onOpenMonthlyHistory: () => void;
  onOpenCritiques: () => void;
  onDataChanged: () => void;
  isGestor: boolean;
}

export const CollaboratorPersonalPanel: React.FC<CollaboratorPersonalPanelProps> = ({
  currentUser,
  rankingEntry,
  dailyRecord,
  onNavigateToRanking,
  onOpenMonthlyHistory,
  onOpenCritiques,
  onDataChanged,
  isGestor,
}) => {
  // 5S Webcam & Form State
  const [fiveSPhoto, setFiveSPhoto] = useState<string>(
    dailyRecord?.fiveSPhotoUrl ||
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80'
  );
  const [sector, setSector] = useState<string>(
    dailyRecord?.fiveSSector || 'Box de Separação / Doca de Trabalho'
  );
  const [isExtraArea, setIsExtraArea] = useState<boolean>(false);
  const [notes5S, setNotes5S] = useState<string>('');
  const [checklist, setChecklist] = useState({
    seiri: true,
    seiton: true,
    seiso: true,
    seiketsu: true,
    shitsuke: true,
  });
  const [isSubmitting5S, setIsSubmitting5S] = useState(false);
  const [feedback5S, setFeedback5S] = useState('');

  // Safety / Anomaly Report State
  const [safetyPhoto, setSafetyPhoto] = useState<string>('');
  const [safetySector, setSafetySector] = useState<string>('Corredor / Doca');
  const [safetyDesc, setSafetyDesc] = useState<string>('');
  const [safetyType, setSafetyType] = useState<'seguranca' | 'anomalia'>('seguranca');
  const [isSubmittingSafety, setIsSubmittingSafety] = useState(false);
  const [feedbackSafety, setFeedbackSafety] = useState('');

  // Cicero Batch 5S Night Import State
  const [ciceroBatchPhoto, setCiceroBatchPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=600&auto=format&fit=crop&q=80'
  );
  const [ciceroBatchNotes, setCiceroBatchNotes] = useState<string>(
    'Fechamento 5S do armazém noturno e docas liberadas.'
  );
  const [ciceroFeedback, setCiceroFeedback] = useState<string>('');

  const todayScore = dailyRecord ? dailyRecord.calculatedScore : rankingEntry?.todayScore || 0;
  const maxScore = currentUser.pontuacaoMaxima || 6;
  const attainmentPercent = Math.round((todayScore / maxScore) * 100);
  const roleBadge = ROLE_BADGE_COLORS[currentUser.role];

  // Collaborator has a safety/anomaly meta?
  const hasSafetyMeta = currentUser.metas.some(
    (m) =>
      m.descricao.toLowerCase().includes('relato') ||
      m.descricao.toLowerCase().includes('anomalia') ||
      m.descricao.toLowerCase().includes('segurança')
  );

  // Is Cicero (Conferente G1121)?
  const isCicero = currentUser.matricula === 'G1121';

  // Submit 5S audit
  const handleSubmit5S = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting5S(true);

    try {
      // Save photo permanently to disk
      const savedPhotoUrl = await storageService.uploadPhoto(fiveSPhoto, `5s-${currentUser.matricula}`);

      const submission: FiveSSubmission = {
        id: `5s-${currentUser.id}-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        date: new Date().toISOString().split('T')[0],
        sector: isExtraArea ? `${sector} (Área Adicional)` : sector,
        photoUrl: savedPhotoUrl,
        seiri: checklist.seiri,
        seiton: checklist.seiton,
        seiso: checklist.seiso,
        seiketsu: checklist.seiketsu,
        shitsuke: checklist.shitsuke,
        notes: notes5S || 'Auditoria 5S via Câmera Web realizada com sucesso.',
        status: 'pendente',
        pointsAwarded: currentUser.role === 'manobrista' ? 2 : 1,
        isExtraArea,
      };

      storageService.addFiveSSubmission(submission);
      setIsSubmitting5S(false);
      setFeedback5S(
        isExtraArea
          ? '5S de Área Adicional enviado com sucesso! Sincronizado em tempo real para a gestão.'
          : '5S diário enviado! Aguardando aprovação do Gestor para pontuar (+1.0 pt).'
      );
      onDataChanged();
      setTimeout(() => setFeedback5S(''), 5000);
    } catch (err) {
      console.error('Erro ao enviar 5S:', err);
      setIsSubmitting5S(false);
    }
  };

  // Submit Safety / Anomaly Report
  const handleSubmitSafetyReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!safetyPhoto) {
      alert('Por favor, tire a foto da anomalia/segurança com a câmera web antes de enviar.');
      return;
    }

    setIsSubmittingSafety(true);

    try {
      // Save photo permanently to disk
      const savedPhotoUrl = await storageService.uploadPhoto(safetyPhoto, `anomalia-${currentUser.matricula}`);

      const report: SafetyAnomalyReport = {
        id: `rep-${currentUser.id}-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userMatricula: currentUser.matricula,
        userRole: currentUser.role,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        sector: safetySector,
        photoUrl: savedPhotoUrl,
        description: safetyDesc,
        type: safetyType,
        status: 'pendente',
      };

      storageService.addSafetyReport(report);
      setIsSubmittingSafety(false);
      setFeedbackSafety(
        'Relato de anomalia registrado e sincronizado em tempo real! Aguardando aprovação do Gestor para pontuar na meta e validar o 1º critério de desempate.'
      );
      setSafetyDesc('');
      setSafetyPhoto('');
      onDataChanged();
      setTimeout(() => setFeedbackSafety(''), 5000);
    } catch (err) {
      console.error('Erro ao enviar relato:', err);
      setIsSubmittingSafety(false);
    }
  };

  // Cicero Batch 5S Execution
  const handleCiceroBatchImport = async () => {
    const savedPhoto = await storageService.uploadPhoto(ciceroBatchPhoto, 'cicero-noturno');
    const result = storageService.importCiceroNightBatch5S(savedPhoto, ciceroBatchNotes);
    setCiceroFeedback(
      `Sucesso! 5S noturno importado e sincronizado em tempo real para 7 colaboradores (${result.affectedNames.join(', ')}). Eles ainda podem adicionar 5S extra para critério de desempate.`
    );
    onDataChanged();
    setTimeout(() => setCiceroFeedback(''), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Greeting */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c1222] via-[#090e1a] to-[#1a1306] border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-amber-500/60 shadow-xl"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border} flex items-center gap-1.5`}
                >
                  <span>{ROLE_ICONS[currentUser.role]}</span>
                  <span>{ROLE_LABELS[currentUser.role]}</span>
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Matrícula: {currentUser.matricula}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold">
                  {isGestor ? 'Acesso Gestor' : 'Acesso Participante'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Olá, {currentUser.name}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Acompanhe suas metas de hoje, registre fotos do 5S via câmera web e envie relatos de anomalia.
              </p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenMonthlyHistory}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700/80 transition-colors"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              Meu Histórico Mensal
            </button>

            <button
              onClick={onOpenCritiques}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700/80 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-blue-400" />
              Contestar Pontos
            </button>

            <button
              onClick={onNavigateToRanking}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
            >
              <Trophy className="w-4 h-4" />
              Ver Ranking Geral
            </button>
          </div>
        </div>
      </div>

      {/* Disqualification Status Banner if Applicable */}
      {currentUser.desqualificado && (
        <div className="p-5 rounded-3xl bg-rose-950/40 border border-rose-500/40 text-rose-200 shadow-xl space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 font-black text-rose-400 text-sm sm:text-base">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
              <span>Status Atual: Desqualificado da Classificação da Liga DPO</span>
            </div>
            {currentUser.dataDesqualificacao && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-900/60 border border-rose-700/60 font-mono text-rose-300">
                Aplicado em: {currentUser.dataDesqualificacao}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            <strong className="text-rose-400 font-bold">Motivo informado pela gestão:</strong>{' '}
            "{currentUser.motivoDesqualificacao || 'Ocorrência operacional registrada pela supervisão'}"
          </p>
          <div className="text-[11px] text-slate-400 pt-1.5 border-t border-rose-900/50 flex items-center justify-between flex-wrap gap-2">
            <span>
              ℹ️ Suas metas diárias, pontuações e relatos continuam sendo registrados e computados normalmente, mas sua colocação permanece na última posição do ranking enquanto vigorar a penalidade.
            </span>
            {currentUser.desqualificadoPor && (
              <span className="text-slate-400">
                Gestor: <strong className="text-slate-300">{currentUser.desqualificadoPor}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards Row (including tie-breakers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Score Card */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>PONTUAÇÃO DE HOJE</span>
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">
              {todayScore.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-slate-500">/ {maxScore}.0 pts</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${attainmentPercent}%` }}
            ></div>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block font-medium">
            {attainmentPercent}% da pontuação máxima diária
          </span>
        </div>

        {/* Tie-breaker 1: Relatos de Segurança / Anomalia */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>1º DESEMPATE (RELATOS)</span>
            <AlertOctagon className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">
              {rankingEntry?.safetyReportsCount || 0}
            </span>
            <span className="text-xs text-slate-400 font-bold">relatos registrados</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Critério nº 1 de desempate no ranking da liga
          </p>
        </div>

        {/* Tie-breaker 2: 5S em Mais de uma Área */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>2º DESEMPATE (5S EXTRA)</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-400">
              {rankingEntry?.extraFiveSCount || 0}
            </span>
            <span className="text-xs text-slate-400 font-bold">áreas adicionais</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            5S em múltiplas áreas do armazém
          </p>
        </div>

        {/* Ranking Position */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>SUA POSIÇÃO NO RANKING</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              #{rankingEntry?.generalPosition || 1}
            </span>
            <span className="text-xs text-slate-400 font-bold">de 15 colaboradores</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Total acumulado: <strong className="text-white">{rankingEntry?.totalScore || 140} pts</strong>
          </p>
        </div>
      </div>

      {/* SPECIAL SECTION FOR CONFERENTE CICERO (5S NOTURNO BATCH IMPORT) */}
      {(isCicero || isGestor) && (
        <div className="rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border-2 border-blue-500/40 p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                ATRIBUIÇÃO EXCLUSIVA DO CONFERENTE CÍCERO
              </span>
              <h2 className="text-lg font-black text-white mt-1">
                Importação do 5S Noturno do Armazém em Lote
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl">
                Cícero importa o 5S do turno noturno para os ajudantes (Luis, Eldenkleber, Edilson, Natanael, Dimas, Admilton) e o conferente noturno. O 5S importado pontua para eles, e os mesmos ainda podem adicionar um 5S extra como critério de desempate!
              </p>
            </div>

            <button
              type="button"
              onClick={handleCiceroBatchImport}
              className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 self-start sm:self-auto transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Importar 5S Noturno em Lote
            </button>
          </div>

          {ciceroFeedback && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {ciceroFeedback}
            </div>
          )}
        </div>
      )}

      {/* The 4 Individual Metas of the Collaborator */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-400" />
              Suas 4 Metas Individuais de Hoje
            </h2>
            <p className="text-xs text-slate-400">
              Pontuação máxima de 6.0 pontos (as metas são avaliadas pelo supervisor).
            </p>
          </div>
          <span className="text-xs font-bold text-amber-400 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
            Teto: 6.0 Pontos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentUser.metas.map((meta) => {
            const isCompleted = dailyRecord?.metaStatus
              ? !!dailyRecord.metaStatus[meta.ordem]
              : false;

            return (
              <div
                key={meta.ordem}
                className={`p-5 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-amber-400 font-black text-xs flex items-center justify-center">
                        {meta.ordem}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Meta {meta.ordem}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-black bg-amber-500/20 text-amber-300">
                        {meta.pontos} {meta.pontos === 1 ? 'ponto' : 'pontos'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white pt-1">
                      {meta.descricao}
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Clock className="w-3.5 h-3.5" />}
                    {isCompleted ? 'Batida' : 'Pendente'}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Status:{' '}
                    <strong className={isCompleted ? 'text-emerald-400' : 'text-slate-400'}>
                      {isCompleted ? 'Concluída e Pontuada' : 'Em andamento'}
                    </strong>
                  </span>
                  <span className="font-mono text-slate-400">
                    +{isCompleted ? meta.pontos : 0} / {meta.pontos} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WEBCAM MODULE 1: 5S DIÁRIO & ÁREA ADICIONAL COM CÂMERA WEB */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-400" />
              Retirada da Foto do 5S Diário com Câmera Web
            </h2>
            <p className="text-xs text-slate-400">
              Tire a foto da sua área de trabalho pelo navegador para garantir sua pontuação de 5S.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={isExtraArea}
                onChange={(e) => setIsExtraArea(e.target.checked)}
                className="rounded border-slate-700 text-purple-500 focus:ring-purple-500"
              />
              <span>5S em Área Adicional (Critério de Desempate)</span>
            </label>
          </div>
        </div>

        {feedback5S && (
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4" />
            {feedback5S}
          </div>
        )}

        <form onSubmit={handleSubmit5S} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Webcam Capture */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Câmera Web para Evidência do 5S
            </label>
            <WebcamCapture
              previewUrl={fiveSPhoto}
              onCapture={(dataUrl) => setFiveSPhoto(dataUrl)}
              onClearPreview={() => setFiveSPhoto('')}
              label="Tirar Foto do 5S Diário"
            />
          </div>

          {/* Right: Sector, Checklist & Notes */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Área / Box / Equipamento
              </label>
              <input
                type="text"
                required
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="Ex: Box Doca 03, Empilhadeira E-12, Corredor 05..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Checklist */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Checklist dos 5 Sensos
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'seiri', label: '1. Seiri (Utilização)' },
                  { key: 'seiton', label: '2. Seiton (Organização)' },
                  { key: 'seiso', label: '3. Seiso (Limpeza)' },
                  { key: 'seiketsu', label: '4. Seiketsu (Padronização)' },
                  { key: 'shitsuke', label: '5. Shitsuke (Disciplina/EPI)' },
                ].map((s) => (
                  <label
                    key={s.key}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={(checklist as any)[s.key]}
                      onChange={(e) =>
                        setChecklist({ ...checklist, [s.key]: e.target.checked })
                      }
                      className="rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="font-medium text-[11px]">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Observation field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Campo de Observações do 5S
              </label>
              <textarea
                rows={2}
                value={notes5S}
                onChange={(e) => setNotes5S(e.target.value)}
                placeholder="Informe as condições da área, descarte efetuado ou detalhes das melhorias..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting5S}
              className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {isSubmitting5S ? 'Gravando...' : 'Salvar Registro do 5S'}
            </button>
          </div>
        </form>
      </div>

      {/* WEBCAM MODULE 2: RELATO DE SEGURANÇA OU ANOMALIA COM CÂMERA WEB */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                1º CRITÉRIO OFICIAL DE DESEMPATE
              </span>
              {hasSafetyMeta && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Conta como sua Meta
                </span>
              )}
            </div>
            <h2 className="text-lg font-black text-white mt-1 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-amber-400" />
              Relato de Segurança / Anomalia Operacional (Câmera Web)
            </h2>
            <p className="text-xs text-slate-400">
              Fotografe anomalias ou riscos e informe os detalhes para pontuar e garantir a segurança do armazém.
            </p>
          </div>
        </div>

        {feedbackSafety && (
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4" />
            {feedbackSafety}
          </div>
        )}

        <form onSubmit={handleSubmitSafetyReport} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Camera Web for Safety/Anomaly */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Foto da Anomalia / Condição de Risco (Câmera Web)
            </label>
            <WebcamCapture
              previewUrl={safetyPhoto}
              onCapture={(dataUrl) => setSafetyPhoto(dataUrl)}
              onClearPreview={() => setSafetyPhoto('')}
              label="Tirar Foto da Anomalia / Segurança"
            />
          </div>

          {/* Right: Sector, Type & Detailed Description */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Tipo de Relato
                </label>
                <select
                  value={safetyType}
                  onChange={(e) => setSafetyType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="seguranca">Relato de Segurança (Quase-Acidente / EPI)</option>
                  <option value="anomalia">Relato de Anomalia (Avaria / Equipamento / Piso)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Setor / Localização
                </label>
                <input
                  type="text"
                  required
                  value={safetySector}
                  onChange={(e) => setSafetySector(e.target.value)}
                  placeholder="Ex: Doca 04, Rua 07, Pátio..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Detailed Observation Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Campo de Observações da Anomalia / Segurança
              </label>
              <textarea
                required
                rows={4}
                value={safetyDesc}
                onChange={(e) => setSafetyDesc(e.target.value)}
                placeholder="Descreva detalhadamente o ocorrido, condições do material ou equipamento, ações preventivas adotadas e medidas corretivas necessárias..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingSafety}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmittingSafety ? 'Registrando...' : 'Registrar Relato de Segurança / Anomalia'}
            </button>
          </div>
        </form>
      </div>

      {/* WEBCAM MODULE 3: HISTÓRICO DE VALIDAÇÕES & APROVAÇÕES DO GESTOR */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              Status de Aprovação das Suas Submissões
            </h2>
            <p className="text-xs text-slate-400">
              Acompanhe em tempo real se o gestor já validou seus relatos e fotos 5S para pontuar na Liga.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-400 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
            Validação Obrigatória DPO
          </span>
        </div>

        {/* Dynamic fetch of user's submissions */}
        {(() => {
          const userFiveS = storageService
            .getFiveSSubmissions()
            .filter((s) => s.userId === currentUser.id);
          const userSafety = storageService
            .getSafetyReports()
            .filter((r) => r.userId === currentUser.id);

          const totalSubmissions = userFiveS.length + userSafety.length;

          if (totalSubmissions === 0) {
            return (
              <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800/80 text-slate-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600 shrink-0" />
                <p className="text-xs font-semibold text-slate-400">Nenhum envio registrado ainda hoje.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ao enviar o 5S ou um relato nas seções acima, seu status aparecerá aqui.
                </p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 5S list */}
              {userFiveS.map((sub) => {
                const isApproved = sub.status === 'aprovado';
                const isPending = sub.status === 'pendente';

                return (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex gap-3.5 items-start"
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                      <img src={sub.photoUrl} alt="5S" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[9px] text-center font-bold text-slate-300 py-0.5">
                        5S
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-white truncate">{sub.sector}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                            isApproved
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isApproved
                            ? `Aprovado (+${sub.pointsAwarded || 1} pt)`
                            : isPending
                            ? 'Aguardando Gestor'
                            : 'Reprovado'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-1.5">{sub.notes}</p>

                      {sub.feedback && (
                        <p className="text-[10px] text-slate-300 italic bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                          Gestor: "{sub.feedback}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Safety Reports list */}
              {userSafety.map((rep) => {
                const isApproved = rep.status === 'aprovado';
                const isPending = rep.status === 'pendente';

                return (
                  <div
                    key={rep.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex gap-3.5 items-start"
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                      <img src={rep.photoUrl} alt="Anomalia" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[9px] text-center font-bold text-slate-300 py-0.5 capitalize">
                        {rep.type}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-white truncate">{rep.sector}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                            isApproved
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isApproved
                            ? `Aprovado (+${rep.pointsAwarded || 1} pt)`
                            : isPending
                            ? 'Aguardando Gestor'
                            : 'Não Validado'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-1.5">
                        {rep.description}
                      </p>

                      {rep.feedback && (
                        <p className="text-[10px] text-slate-300 italic bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                          Gestor: "{rep.feedback}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
