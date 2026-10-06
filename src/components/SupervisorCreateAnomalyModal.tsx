import React, { useState, useEffect, useRef } from 'react';
import {
  AlertOctagon,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Upload,
  X,
  Check,
  Search,
  User as UserIcon,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Sparkles,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { User, SafetyAnomalyReport, ROLE_LABELS, ROLE_BADGE_COLORS, ROLE_ICONS } from '../types/dpo';
import { storageService } from '../services/storageService';
import { compressImage } from '../services/imageCompression';

interface SupervisorCreateAnomalyModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  preselectedUserId?: string;
  preselectedDate?: string;
  onAnomalyCreated: (report: SafetyAnomalyReport) => void;
}

const WAREHOUSE_SECTORS = [
  'Picking (Corredores)',
  'Pulmão / Aéreo',
  'Expedição / Conferência',
  'Recebimento / Descarga',
  'Docas 01 a 08',
  'Pátio de Carretas / Manobra',
  'Estação de Baterias / Empilhadeiras',
  'Área de Segregação / Avarias',
  'Vestiários / Convivência',
  'Outro Local',
];

export const SupervisorCreateAnomalyModal: React.FC<SupervisorCreateAnomalyModalProps> = ({
  isOpen,
  onClose,
  users,
  preselectedUserId,
  preselectedDate,
  onAnomalyCreated,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userSearch, setUserSearch] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [sector, setSector] = useState<string>('Picking (Corredores)');
  const [customSector, setCustomSector] = useState<string>('');
  const [anomalyType, setAnomalyType] = useState<'seguranca' | 'anomalia'>('anomalia');
  const [severity, setSeverity] = useState<'baixa' | 'media' | 'alta'>('media');
  const [description, setDescription] = useState<string>('');
  const [actionTaken, setActionTaken] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isPhotoCompressing, setIsPhotoCompressing] = useState<boolean>(false);
  const [autoApprove, setAutoApprove] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const activeUsers = users.filter((u) => u.status === 'ativo' && u.matricula !== 'G1002');
      if (preselectedUserId) {
        setSelectedUserId(preselectedUserId);
      } else if (activeUsers.length > 0) {
        setSelectedUserId(activeUsers[0].id);
      }
      setUserSearch('');
      setDate(preselectedDate || new Date().toISOString().split('T')[0]);
      
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${minutes}`);

      setSector('Picking (Corredores)');
      setCustomSector('');
      setAnomalyType('anomalia');
      setSeverity('media');
      setDescription('');
      setActionTaken('');
      setPhotoPreview('');
      setAutoApprove(true);
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen, preselectedUserId, preselectedDate, users]);

  if (!isOpen) return null;

  const activeUsers = users.filter((u) => u.status === 'ativo' && u.matricula !== 'G1002');
  const selectedUser = users.find((u) => u.id === selectedUserId);

  const filteredUsers = activeUsers.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.matricula.toLowerCase().includes(q);
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsPhotoCompressing(true);
      const compressed = await compressImage(file, 640, 480, 0.82);
      setPhotoPreview(compressed);
    } catch (err) {
      console.error('Error compressing image:', err);
    } finally {
      setIsPhotoCompressing(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedUser) {
      setErrorMsg('Selecione o colaborador ao qual atribuir este relato.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Informe a descrição detalhada da anomalia identificada.');
      return;
    }

    const effectiveSector = sector === 'Outro Local' && customSector.trim() ? customSector.trim() : sector;

    setIsSubmitting(true);

    const reportId = `safety-sup-${selectedUser.id}-${Date.now()}`;
    const newReport: SafetyAnomalyReport = {
      id: reportId,
      userId: selectedUser.id,
      userName: selectedUser.name,
      userMatricula: selectedUser.matricula,
      userRole: selectedUser.role,
      date,
      time,
      sector: effectiveSector,
      photoUrl: photoPreview || '',
      description: description.trim(),
      type: anomalyType,
      status: autoApprove ? 'aprovado' : 'pendente',
      notes: actionTaken.trim() ? `[Ação Imediata]: ${actionTaken.trim()}` : undefined,
      evaluatedBy: autoApprove ? 'Supervisor Operacional' : undefined,
      evaluatedAt: autoApprove ? new Date().toISOString().replace('T', ' ').substring(0, 16) : undefined,
      pointsAwarded: autoApprove ? 1 : 0,
      feedback: autoApprove
        ? 'Relato lançado e homologado diretamente pelo Supervisor na gestão diária.'
        : undefined,
    };

    // Save and sync
    storageService.addSafetyReport(newReport);

    // If auto-approved, ensure the collaborator's safety meta (Meta 3) is marked as achieved
    if (autoApprove) {
      const safetyMeta = selectedUser.metas.find(
        (m) =>
          m.categoria === 'seguranca' ||
          m.descricao.toLowerCase().includes('relato') ||
          m.descricao.toLowerCase().includes('anomalia') ||
          m.descricao.toLowerCase().includes('segurança')
      );
      if (safetyMeta) {
        storageService.toggleMetaStatus(selectedUser.id, date, safetyMeta.ordem, true);
      }
    }

    onAnomalyCreated(newReport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-[#121008] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header Ambient Glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Lançamento pelo Supervisor
                </span>
                <span className="text-xs text-slate-400 font-bold">• 1º Critério de Desempate DPO</span>
              </div>
              <h2 className="text-xl font-black text-white">Novo Relato de Anomalia / Segurança</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Atribua o relato diretamente ao colaborador (evidência fotográfica opcional).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 relative z-10">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. SELEÇÃO DO COLABORADOR */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                Atribuir Relato ao Colaborador:
              </span>
              <span className="text-[11px] text-amber-400 font-normal">
                {selectedUser ? `${selectedUser.name} (${selectedUser.matricula})` : 'Nenhum selecionado'}
              </span>
            </label>

            {/* Quick Collaborator Search & Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por nome ou matrícula..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.matricula}) - {ROLE_LABELS[u.role]}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected User Summary Card */}
            {selectedUser && (
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{selectedUser.name}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-400">
                        {selectedUser.matricula}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {ROLE_LABELS[selectedUser.role]} • Teto: 6.0 Pontos
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  Colaborador Selecionado
                </span>
              </div>
            )}
          </div>

          {/* 2. DATA, HORA E TIPO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Data da Ocorrência:
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Horário / Turno:
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="Ex: 09:30 ou 1º Turno"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <AlertOctagon className="w-3 h-3 text-slate-400" />
                Tipo de Relato:
              </label>
              <select
                value={anomalyType}
                onChange={(e) => setAnomalyType(e.target.value as 'seguranca' | 'anomalia')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="anomalia">Anomalia Operacional (Processo/Qualidade)</option>
                <option value="seguranca">Risco de Segurança / Quase Acidente</option>
              </select>
            </div>
          </div>

          {/* 3. SETOR / LOCAL DO ARMAZÉM */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400" />
              Setor / Local do Armazém:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                {WAREHOUSE_SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {sector === 'Outro Local' && (
                <input
                  type="text"
                  placeholder="Especifique o local exato..."
                  value={customSector}
                  onChange={(e) => setCustomSector(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              )}
            </div>
          </div>

          {/* 4. DESCRIÇÃO DETALHADA */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-400" />
                Descrição da Anomalia / Desvio:
              </span>
              <span className="text-[10px] text-slate-500">Obrigatório</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que foi identificado (ex: Pallet mal cintado na rua 14, vazamento de óleo no corredor 02, etc.)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
              required
            />
          </div>

          {/* 5. AÇÃO IMEDIATA / PROVIDÊNCIA */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Ação Imediata / Solução Adotada (Opcional):
              </span>
              <span className="text-[10px] text-slate-500">Opcional</span>
            </label>
            <input
              type="text"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="Ex: Área isolada com cones e refeita a cintagem do pallet."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* 6. IMPORTAÇÃO DE FOTO (OPCIONAL E NÃO OBRIGATÓRIA) */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Foto / Evidência Visual</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Opcional • Não Obrigatório
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              O supervisor pode anexar uma foto capturada na operação ou salvar o relato sem foto. A evidência é comprimida automaticamente.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {photoPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 max-h-48 bg-slate-900 group">
                <img
                  src={photoPreview}
                  alt="Evidência do relato"
                  className="w-full h-44 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 p-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white shadow-lg transition-all flex items-center gap-1 text-[11px] font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover Foto</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPhotoCompressing}
                className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>{isPhotoCompressing ? 'Otimizando imagem...' : 'Importar Foto da Galeria ou Câmera (Opcional)'}</span>
              </button>
            )}
          </div>

          {/* 7. HOMOLOGAÇÃO IMEDIATA (SUPERVISOR) */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Homologar e Pontuar Imediatamente
              </span>
              <p className="text-[11px] text-slate-300">
                Como este relato está sendo lançado pelo Supervisor, ele já entra com status <strong>Aprovado</strong>, pontuando a meta de segurança diária e ativando o critério de desempate.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'Salvando Relato...' : 'Registrar e Atribuir Relato'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
