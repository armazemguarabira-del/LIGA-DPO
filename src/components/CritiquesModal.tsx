import React, { useState } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Send,
  Clock,
  ShieldCheck,
  Calendar,
  MessageSquare,
  Sparkles,
  Check,
  Camera,
  Eye,
} from 'lucide-react';
import { User, CritiqueRequest, ROLE_LABELS } from '../types/dpo';
import { storageService } from '../services/storageService';
import { WebcamCapture } from './WebcamCapture';

interface CritiquesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onCritiqueUpdated: () => void;
  preselectedDate?: string;
  isSupervisorMode: boolean;
}

export const CritiquesModal: React.FC<CritiquesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onCritiqueUpdated,
  preselectedDate,
  isSupervisorMode,
}) => {
  const isSupervisorOrManager =
    isSupervisorMode ||
    currentUser?.accessLevel === 'supervisor' ||
    currentUser?.accessLevel === 'gerente';

  const [activeTab, setActiveTab] = useState<'nova' | 'lista'>(
    isSupervisorOrManager ? 'lista' : 'nova'
  );

  // New Critique Form State
  const [date, setDate] = useState(preselectedDate || (() => new Date().toISOString().split('T')[0]));
  const [selectedMetaDesc, setSelectedMetaDesc] = useState<string>(
    currentUser?.metas[0]?.descricao || 'EFM maior ou igual a 85%'
  );
  const [requestedPoints, setRequestedPoints] = useState<number>(
    currentUser?.metas[0]?.pontos || 2
  );
  const [justification, setJustification] = useState('');
  const [evidencePhotoUrl, setEvidencePhotoUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Supervisor Review State
  const [selectedCritiqueForReview, setSelectedCritiqueForReview] =
    useState<CritiqueRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [awardPointsInput, setAwardPointsInput] = useState<number>(2);
  const [previewEnlargedPhoto, setPreviewEnlargedPhoto] = useState<string | null>(null);

  if (!isOpen) return null;

  const critiques = storageService.getCritiques();
  const displayedCritiques = isSupervisorOrManager
    ? critiques
    : critiques.filter((c) => c.userId === currentUser?.id);

  const pendingCount = critiques.filter((c) => c.status === 'pendente').length;

  const contestEligibility = storageService.isDateContestable(date);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitError('');

    // Rule: Contestation cannot be more than 2 days old
    const check = storageService.isDateContestable(date);
    if (!check.eligible) {
      setSubmitError(check.reason || 'Prazo de contestação expirado (máximo de 2 dias).');
      return;
    }

    setIsSubmitting(true);
    const [y, m] = date.split('-').map(Number);

    const newCritique: CritiqueRequest = {
      id: `crit-${currentUser.id}-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userMatricula: currentUser.matricula,
      userRole: currentUser.role,
      date,
      month: m || 9,
      metaDescricao: selectedMetaDesc,
      justification: justification.trim(),
      evidencePhotoUrl: evidencePhotoUrl || undefined,
      requestedPoints,
      status: 'pendente',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    storageService.addCritique(newCritique);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitFeedback('Solicitação de crítica enviada com sucesso! A supervisão avaliará sua contestação e evidência.');
      setJustification('');
      setEvidencePhotoUrl('');
      onCritiqueUpdated();
      setTimeout(() => setSubmitFeedback(''), 4000);
    }, 300);
  };

  const handleResolve = (status: 'deferida' | 'indeferida') => {
    if (!selectedCritiqueForReview) return;

    storageService.resolveCritique(
      selectedCritiqueForReview.id,
      status,
      status === 'deferida' ? awardPointsInput : 0,
      reviewNotes || (status === 'deferida' ? 'Contestação aceita e pontos computados.' : 'Contestação indeferida após averiguação da evidência.'),
      currentUser?.name || 'Gestor DPO Armazém'
    );

    setSelectedCritiqueForReview(null);
    setReviewNotes('');
    onCritiqueUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <HelpCircle className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-black text-white">
                  Solicitação de Crítica / Contestação
                </h2>
                <p className="text-xs text-slate-400">
                  Canal oficial para contestar pontos de metas realizadas e não pontuadas
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('nova')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'nova'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Nova Solicitação
            </button>

            <button
              onClick={() => setActiveTab('lista')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'lista'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Histórico / Pendentes
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          <span className="text-[11px] text-slate-500">
            {isSupervisorOrManager ? 'Modo de Auditoria / Supervisão' : 'Modo Colaborador'}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {submitFeedback && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {submitFeedback}
            </div>
          )}

          {submitError && (
            <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {submitError}
            </div>
          )}

          {/* TAB 1: NEW CRITIQUE FORM */}
          {activeTab === 'nova' && currentUser && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Data da Ocorrência
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                  {/* 2-Day Deadline Indicator */}
                  <div className="mt-1">
                    {!contestEligibility.eligible ? (
                      <span className="text-[11px] text-rose-400 flex items-center gap-1 font-bold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Fora do prazo: {contestEligibility.diffDays} dias da data atual (limite: 2 dias).
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        Dentro do prazo regulamentar ({contestEligibility.diffDays === 0 ? 'hoje' : `${contestEligibility.diffDays} dia(s)`} atrás).
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Meta Reclamada (Selecione)
                  </label>
                  <select
                    value={selectedMetaDesc}
                    onChange={(e) => {
                      const desc = e.target.value;
                      setSelectedMetaDesc(desc);
                      const foundMeta = currentUser.metas.find((m) => m.descricao === desc);
                      if (foundMeta) setRequestedPoints(foundMeta.pontos);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    {currentUser.metas.map((m) => (
                      <option key={m.ordem} value={m.descricao}>
                        Meta {m.ordem}: {m.descricao} ({m.pontos} pts)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Pontos Solicitados
                </label>
                <input
                  type="number"
                  min={1}
                  max={2}
                  value={requestedPoints}
                  onChange={(e) => setRequestedPoints(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-amber-400 font-bold"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Pontuação máxima permitida por meta: 2.0 pontos.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Justificativa Operacional Detalhada
                </label>
                <textarea
                  required
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Explique o que aconteceu, horários, docas, coletores ou motivos pelos quais a pontuação não foi registrada..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
                />
              </div>

              {/* Photo Evidence via WebCam or File Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    Evidência Fotográfica (Câmera Web ou Imagem da Doca/Coletor)
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold">Critério do Gestor</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Anexe uma foto do coletor, tela do WMS ou da área para comprovação pelo Gestor.
                </p>

                <WebcamCapture
                  onCapture={(photo) => setEvidencePhotoUrl(photo)}
                  previewUrl={evidencePhotoUrl}
                  onClearPreview={() => setEvidencePhotoUrl('')}
                  label="Tirar Foto da Evidência via Webcam ou Anexar Arquivo"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !contestEligibility.eligible}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 flex items-center gap-2 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                  {isSubmitting ? 'Enviando...' : 'Submeter Contestação com Evidência'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CRITIQUES LIST & SUPERVISOR REVIEW */}
          {activeTab === 'lista' && (
            <div className="space-y-4">
              {displayedCritiques.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nenhuma solicitação de crítica registrada até o momento.
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedCritiques.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3 shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{item.userName}</span>
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 font-bold">
                              {item.userMatricula}
                            </span>
                            <span className="text-slate-500 text-xs">•</span>
                            <span className="text-xs text-slate-400">{item.date}</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-200 mt-1 block">
                            Meta: {item.metaDescricao}
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            item.status === 'deferida'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : item.status === 'indeferida'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-850 leading-relaxed">
                        "{item.justification}"
                      </p>

                      {/* Evidence Photo thumbnail */}
                      {item.evidencePhotoUrl && (
                        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <img
                            src={item.evidencePhotoUrl}
                            alt="Evidência"
                            className="w-16 h-12 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
                            onClick={() => setPreviewEnlargedPhoto(item.evidencePhotoUrl!)}
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                              <Camera className="w-3.5 h-3.5 text-amber-400" />
                              Evidência Anexada
                            </span>
                            <button
                              type="button"
                              onClick={() => setPreviewEnlargedPhoto(item.evidencePhotoUrl!)}
                              className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-bold mt-0.5"
                            >
                              <Eye className="w-3 h-3" />
                              Visualizar em tamanho grande
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                        <span className="text-slate-500 text-[11px]">
                          Solicitados: <strong className="text-amber-400">+{item.requestedPoints} pts</strong>
                        </span>

                        {item.status === 'pendente' && isSupervisorOrManager && (
                          <button
                            onClick={() => {
                              setSelectedCritiqueForReview(item);
                              setAwardPointsInput(item.requestedPoints);
                              setReviewNotes('');
                            }}
                            className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shadow-sm hover:bg-amber-400 transition cursor-pointer"
                          >
                            Avaliar Contestação (Gestor)
                          </button>
                        )}

                        {item.status !== 'pendente' && (
                          <span className="text-slate-400 text-[11px]">
                            {item.resolvedBy} • {item.pointsAwarded || 0} pts creditados
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUPERVISOR REVIEW MODAL/SUB-CARD */}
          {selectedCritiqueForReview && (
            <div className="p-5 rounded-2xl bg-slate-950 border-2 border-amber-500/60 space-y-4 animate-fade-in shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-white text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Decisão do Gestor: {selectedCritiqueForReview.userName} ({selectedCritiqueForReview.date})
                </h4>
                <button
                  onClick={() => setSelectedCritiqueForReview(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Contestation details & evidence preview */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <p className="text-slate-300">
                  <strong>Meta Contestada:</strong> {selectedCritiqueForReview.metaDescricao}
                </p>
                <p className="text-slate-400">
                  <strong>Justificativa do Colaborador:</strong> "{selectedCritiqueForReview.justification}"
                </p>

                {selectedCritiqueForReview.evidencePhotoUrl ? (
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      Evidência Fotográfica Apresentada:
                    </span>
                    <img
                      src={selectedCritiqueForReview.evidencePhotoUrl}
                      alt="Evidência para Análise"
                      className="max-h-56 rounded-xl object-contain border border-slate-700 bg-black/40"
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    Nenhuma foto anexada pelo colaborador (apenas justificativa em texto).
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Pontos a Deferir (0 a 2 pts)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={2}
                    value={awardPointsInput}
                    onChange={(e) => setAwardPointsInput(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Parecer do Gestor (Critério Decisório)
                  </label>
                  <input
                    type="text"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Ex: Evidência de WMS conferida com sucesso..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleResolve('indeferida')}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  Indeferir Contestação
                </button>

                <button
                  type="button"
                  onClick={() => handleResolve('deferida')}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 text-xs font-black shadow transition cursor-pointer"
                >
                  Deferir Contestação (+{awardPointsInput} Pontos)
                </button>
              </div>
            </div>
          )}

          {/* Modal to Preview Enlarged Photo */}
          {previewEnlargedPhoto && (
            <div
              className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setPreviewEnlargedPhoto(null)}
            >
              <div className="relative max-w-3xl max-h-[85vh] bg-slate-900 rounded-2xl p-2 border border-slate-800 shadow-2xl">
                <button
                  onClick={() => setPreviewEnlargedPhoto(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black"
                >
                  <X className="w-5 h-5" />
                </button>
                <img
                  src={previewEnlargedPhoto}
                  alt="Evidência Ampliada"
                  className="max-h-[80vh] rounded-xl object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
