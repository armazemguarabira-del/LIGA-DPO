import React, { useState, useEffect } from 'react';
import { User } from '../types/dpo';
import {
  ShieldAlert,
  AlertTriangle,
  X,
  CheckCircle2,
  Undo2,
  Info,
  Calendar,
  UserCheck
} from 'lucide-react';

interface DisqualificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  gestorName: string;
  onConfirmDisqualify: (userId: string, motivo: string) => void;
  onConfirmRequalify: (userId: string) => void;
}

const QUICK_REASONS = [
  'Infração gravíssima às normas de segurança / EPI',
  'Falta injustificada ou abandono de posto em fechamento',
  'Inconformidade grave de acuracidade no inventário WMS',
  'Descumprimento reiterado de procedimentos operacionais',
  'Avaria grave de mercadoria por negligência operacional',
  'Conduta antiética ou indisciplina no armazém',
];

export const DisqualificationModal: React.FC<DisqualificationModalProps> = ({
  isOpen,
  onClose,
  user,
  gestorName,
  onConfirmDisqualify,
  onConfirmRequalify,
}) => {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.motivoDesqualificacao) {
      setMotivo(user.motivoDesqualificacao);
    } else {
      setMotivo('');
    }
    setError('');
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const isAlreadyDisqualified = !!user.desqualificado;

  const handleSubmitDisqualify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) {
      setError('Por favor, informe o motivo da desqualificação.');
      return;
    }
    onConfirmDisqualify(user.id, motivo.trim());
    onClose();
  };

  const handleRequalify = () => {
    onConfirmRequalify(user.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                isAlreadyDisqualified
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {isAlreadyDisqualified
                  ? 'Gestão de Desqualificação'
                  : 'Desqualificar Colaborador da Liga'}
              </h2>
              <p className="text-xs text-slate-400">
                Ação restrita à supervisão e gerência da Liga DPO
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Collaborator Profile Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
            />
            <div className="min-w-0">
              <span className="text-sm font-black text-white truncate block">
                {user.name}
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="font-mono font-bold text-amber-400">
                  {user.matricula}
                </span>
                <span>•</span>
                <span className="capitalize">{user.roleTitle || user.role}</span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            {isAlreadyDisqualified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                Desqualificado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Qualificado
              </span>
            )}
          </div>
        </div>

        {/* State 1: Already Disqualified - Allows Requalification */}
        {isAlreadyDisqualified ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Colaborador atualmente desqualificado da Liga</span>
              </div>
              <p className="text-slate-300">
                <strong className="text-rose-400">Motivo registrado:</strong>{' '}
                "{user.motivoDesqualificacao || 'Sem motivo registrado'}"
              </p>
              {user.dataDesqualificacao && (
                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-rose-900/40">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Aplicado em {user.dataDesqualificacao}{' '}
                    {user.desqualificadoPor ? `por ${user.desqualificadoPor}` : ''}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                As metas e os pontos continuam sendo lançados normalmente. Se a
                situação foi normalizada, você pode restaurar a qualificação do
                colaborador para que sua pontuação volte à colocação de mérito.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleRequalify}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition"
              >
                <Undo2 className="w-4 h-4" />
                <span>Restaurar Qualificação (Remover Penalidade)</span>
              </button>
            </div>
          </div>
        ) : (
          /* State 2: Disqualify Form */
          <form onSubmit={handleSubmitDisqualify} className="space-y-4">
            {/* Informational Callout */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <Info className="w-4 h-4 shrink-0" />
                <span>Como funciona a desqualificação na Liga DPO:</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                O colaborador <strong className="text-white">continuará pontuando normalmente</strong> nas metas diárias, 5S e relatos, mas será transferido{' '}
                <strong className="text-rose-400">para o último lugar do ranking geral e do cargo</strong> com a tarja de "Desqualificado" e o motivo informado.
              </p>
            </div>

            {/* Quick Reason Suggestions */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>Motivos operacionais frequentes:</span>
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {QUICK_REASONS.map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMotivo(reason);
                      setError('');
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-amber-500/20 hover:border-amber-500/50 hover:text-amber-200 text-left transition"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Motivo Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">
                Motivo detalhado da desqualificação <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value);
                  setError('');
                }}
                rows={3}
                placeholder="Ex: Ocorrência grave de segurança no setor das docas ou conduta incompatível..."
                className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
              {error && (
                <span className="text-[11px] text-rose-400 font-bold block">
                  {error}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Registrado por: <strong className="text-slate-400">{gestorName}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-rose-950/50 transition"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Confirmar Desqualificação</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
