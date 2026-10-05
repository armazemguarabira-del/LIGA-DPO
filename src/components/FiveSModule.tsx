import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  MessageSquare,
  Building2,
  UserCheck,
  Eye,
  Award,
  Filter,
} from 'lucide-react';
import { User, FiveSSubmission, JobRole, ROLE_LABELS, ROLE_BADGE_COLORS, ROLE_ICONS } from '../types/dpo';
import { storageService } from '../services/storageService';
import { compressImage } from '../services/imageCompression';
import { WebcamCapture } from './WebcamCapture';

interface FiveSModuleProps {
  currentUser: User | null;
  submissions: FiveSSubmission[];
  onSubmissionsUpdated: () => void;
  isSupervisorMode: boolean;
}

export const FiveSModule: React.FC<FiveSModuleProps> = ({
  currentUser,
  submissions,
  onSubmissionsUpdated,
  isSupervisorMode,
}) => {
  const isSupervisorOrManager =
    isSupervisorMode ||
    currentUser?.accessLevel === 'supervisor' ||
    currentUser?.accessLevel === 'gerente';

  // Form State
  const [sector, setSector] = useState('Box de Separação / Doca de Trabalho');
  const [seiri, setSeiri] = useState(true);
  const [seiton, setSeiton] = useState(true);
  const [seiso, setSeiso] = useState(true);
  const [seiketsu, setSeiketsu] = useState(true);
  const [shitsuke, setShitsuke] = useState(true);
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>(
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supervisor Validation State
  const [selectedSubForValidation, setSelectedSubForValidation] =
    useState<FiveSSubmission | null>(null);
  const [validationFeedback, setValidationFeedback] = useState('');
  const [awardedPointsInput, setAwardedPointsInput] = useState<number>(1);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'aprovado' | 'rejeitado'>(
    'all'
  );
  const [activeTab, setActiveTab] = useState<'form' | 'approvals'>(
    isSupervisorOrManager ? 'approvals' : 'form'
  );

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 640, 480, 0.82);
      setPhotoPreview(compressed);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    const newSubmission: FiveSSubmission = {
      id: `5s-${currentUser.id}-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      date: new Date().toISOString().split('T')[0],
      sector,
      photoUrl: photoPreview,
      seiri,
      seiton,
      seiso,
      seiketsu,
      shitsuke,
      notes: notes || 'Auditoria 5S realizada conforme o checklist dos 5 sensos.',
      status: 'pendente',
      pointsAwarded: currentUser.role === 'manobrista' ? 2 : 1,
    };

    storageService.addFiveSSubmission(newSubmission);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      onSubmissionsUpdated();
      setTimeout(() => setSubmitSuccess(false), 4000);
    }, 400);
  };

  const handleValidate = (status: 'aprovado' | 'rejeitado') => {
    if (!selectedSubForValidation) return;

    storageService.validateFiveSSubmission(
      selectedSubForValidation.id,
      status,
      currentUser?.name || 'Supervisão DPO',
      awardedPointsInput,
      validationFeedback || (status === 'aprovado' ? 'Conformidade 5S Armazém aprovada (+pontos computados).' : 'Reprovado.')
    );

    setSelectedSubForValidation(null);
    setValidationFeedback('');
    onSubmissionsUpdated();
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
              PILAR 5S & EXCELÊNCIA OPERACIONAL
            </span>
            <span className="text-xs text-slate-400">• Validação com Foto</span>
          </div>
          <h1 className="text-2xl font-black text-white">Auditoria 5S do Armazém</h1>
          <p className="text-xs text-slate-400">
            Envie registros fotográficos diários e cumpra os 5 Sensos para pontuar na Liga DPO.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'form'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Nova Auditoria
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'approvals'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Galeria & Validações ({submissions.length})
          </button>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Vistoria 5S submetida com sucesso! Aguardando homologação da supervisão.
        </div>
      )}

      {/* FORM TAB */}
      {activeTab === 'form' && currentUser && (
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-400" />
              Submeter Vistoria 5S: {currentUser.name} ({currentUser.matricula})
            </h2>
            <span className="text-xs text-amber-400 font-bold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              {currentUser.role === 'manobrista' ? '+2 Pontos' : '+1 Ponto'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Photo Upload with Webcam */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Evidência Fotográfica do Ambiente
              </label>

              <WebcamCapture
                previewUrl={photoPreview}
                onCapture={(dataUrl) => setPhotoPreview(dataUrl)}
                onClearPreview={() => setPhotoPreview('')}
                label="Foto da Auditoria 5S"
              />
            </div>

            {/* Right: Checklist & Sector */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Setor / Máquina / Veículo Auditado
                </label>
                <input
                  type="text"
                  required
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="Ex: Box Doca 04, Empilhadeira E-02, Pátio..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* 5 Sensos checklist */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Validação dos 5 Sensos
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'seiri', label: '1. Seiri (Utilização)', state: seiri, set: setSeiri },
                    { key: 'seiton', label: '2. Seiton (Organização)', state: seiton, set: setSeiton },
                    { key: 'seiso', label: '3. Seiso (Limpeza)', state: seiso, set: setSeiso },
                    { key: 'seiketsu', label: '4. Seiketsu (Padronização)', state: seiketsu, set: setSeiketsu },
                    { key: 'shitsuke', label: '5. Shitsuke (Autodisciplina)', state: shitsuke, set: setShitsuke },
                  ].map((s) => (
                    <label
                      key={s.key}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-colors ${
                        s.state
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={s.state}
                        onChange={(e) => s.set(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500"
                      />
                      <span className="font-bold text-[11px]">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Observações da Auditoria
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Descreva as melhorias de limpeza e organização realizadas..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                {isSubmitting ? 'Submetendo...' : 'Submeter Auditoria 5S'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* APPROVALS & GALLERY TAB */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {(['all', 'pendente', 'aprovado', 'rejeitado'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    statusFilter === filter
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {filter === 'all' ? 'Todas' : filter}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400">
              {filteredSubmissions.length} vistorias encontradas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubmissions.map((sub) => {
              const roleBadge = ROLE_BADGE_COLORS[sub.userRole];
              return (
                <div
                  key={sub.id}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg space-y-3 p-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Photo */}
                    <div className="relative h-44 rounded-xl overflow-hidden bg-slate-950">
                      <img
                        src={sub.photoUrl}
                        alt="Foto 5S"
                        className="w-full h-full object-cover"
                      />
                      <span
                        className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow ${
                          sub.status === 'aprovado'
                            ? 'bg-emerald-500 text-slate-950'
                            : sub.status === 'rejeitado'
                            ? 'bg-rose-500 text-white'
                            : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-white text-sm">{sub.userName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{sub.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}
                        >
                          {ROLE_LABELS[sub.userRole]}
                        </span>
                        <span className="text-xs text-slate-400 truncate">• {sub.sector}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-850 leading-relaxed">
                      "{sub.notes}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400">
                      +{sub.pointsAwarded || 1} {sub.pointsAwarded === 1 ? 'ponto' : 'pontos'}
                    </span>

                    {sub.status === 'pendente' && isSupervisorOrManager && (
                      <button
                        onClick={() => {
                          setSelectedSubForValidation(sub);
                          setAwardedPointsInput(sub.userRole === 'manobrista' ? 2 : 1);
                          setValidationFeedback('');
                        }}
                        className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shadow hover:bg-amber-400 transition"
                      >
                        Validar
                      </button>
                    )}

                    {sub.status !== 'pendente' && (
                      <span className="text-[10px] text-slate-400">
                        {sub.evaluatedBy} • {sub.evaluatedAt?.substring(5, 10)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUPERVISOR VALIDATION MODAL */}
      {selectedSubForValidation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                Homologação de Vistoria 5S
              </h3>
              <button
                onClick={() => setSelectedSubForValidation(null)}
                className="text-slate-400 hover:text-white shrink-0 p-1"
              >
                <X className="w-5 h-5 shrink-0" />
              </button>
            </div>

            <div className="h-44 rounded-xl overflow-hidden bg-slate-950">
              <img
                src={selectedSubForValidation.photoUrl}
                alt="5S"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-xs text-slate-300">
              Colaborador: <strong className="text-white">{selectedSubForValidation.userName}</strong> (
              {ROLE_LABELS[selectedSubForValidation.userRole]})
            </div>

            {/* Regra Cícero Highlight */}
            {(selectedSubForValidation.userId === 'u-g1121' ||
              selectedSubForValidation.userName.toLowerCase().includes('cicero') ||
              selectedSubForValidation.userName.toLowerCase().includes('cícero')) && (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-black text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Regra Oficial DPO • Validação em Equipe (Cícero)</span>
                </div>
                <p className="text-[11px] text-amber-100/90 leading-relaxed">
                  Ao aprovar a foto de Cícero, o 5S dos 6 colaboradores (<strong>Eldenkleber, Luis, Natanael, Dimas, Admilton e Edilson</strong>) será <strong>preenchido e pontuado automaticamente (+1 ponto)</strong> na Liga DPO!
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Pontos a Conceder
              </label>
              <input
                type="number"
                min={0}
                max={2}
                value={awardedPointsInput}
                onChange={(e) => setAwardedPointsInput(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Parecer do Supervisor
              </label>
              <input
                type="text"
                value={validationFeedback}
                onChange={(e) => setValidationFeedback(e.target.value)}
                placeholder="Ex: Excelente organização da doca e descarte adequado."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleValidate('rejeitado')}
                className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-xs font-bold transition"
              >
                Reprovar
              </button>
              <button
                type="button"
                onClick={() => handleValidate('aprovado')}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow transition"
              >
                Aprovar Vistoria (+{awardedPointsInput} Ponto)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
