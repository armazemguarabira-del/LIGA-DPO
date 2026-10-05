import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle2, Sliders, Sparkles, Check, Target } from 'lucide-react';
import { User, DailyRecord, ROLE_LABELS, ROLE_BADGE_COLORS, ROLE_ICONS } from '../types/dpo';
import { storageService } from '../services/storageService';

interface EditDailyRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  existingRecord: DailyRecord | null;
  onRecordSaved: () => void;
}

export const EditDailyRecordModal: React.FC<EditDailyRecordModalProps> = ({
  isOpen,
  onClose,
  user,
  existingRecord,
  onRecordSaved,
}) => {
  const [metaStatus, setMetaStatus] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
  });
  const [fiveSApproved, setFiveSApproved] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      if (existingRecord) {
        setMetaStatus({ ...existingRecord.metaStatus });
        setFiveSApproved(existingRecord.fiveSApproved ?? true);
        setNotes(existingRecord.notes || '');
      } else {
        setMetaStatus({ 1: true, 2: true, 3: true, 4: true });
        setFiveSApproved(true);
        setNotes('');
      }
      setSavedSuccess(false);
    }
  }, [user, existingRecord, isOpen]);

  if (!isOpen || !user) return null;

  const roleBadge = ROLE_BADGE_COLORS[user.role];

  // Calculate live score
  let calculatedScore = 0;
  user.metas.forEach((m) => {
    if (metaStatus[m.ordem]) {
      calculatedScore += m.pontos;
    }
  });

  const attainment = Math.round((calculatedScore / 6.0) * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const targetDate = existingRecord ? existingRecord.date : new Date().toISOString().split('T')[0];
    const [y, m] = targetDate.split('-').map(Number);

    const updatedRecord: DailyRecord = {
      id: existingRecord ? existingRecord.id : `rec-${user.id}-${targetDate}`,
      userId: user.id,
      date: targetDate,
      month: m || 10,
      year: y || 2026,
      metaStatus,
      calculatedScore,
      fiveSApproved,
      notes,
    };

    storageService.saveDailyRecord(updatedRecord);
    setSavedSuccess(true);
    onRecordSaved();

    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-700"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-white">{user.name}</h3>
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                  {user.matricula}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <span>{ROLE_ICONS[user.role]}</span>
                <span>{ROLE_LABELS[user.role]}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Live Score Gauge Header */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Pontuação Calculada Hoje
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-emerald-400">
                  {calculatedScore.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 font-bold">/ 6.0 pontos</span>
                <span className="text-xs font-bold text-amber-400 ml-2">
                  ({attainment}% atingimento)
                </span>
              </div>
            </div>

            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-sm">
              {calculatedScore}/6
            </div>
          </div>

          {/* 4 Metas Toggles */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Auditoria das 4 Metas Individuais (Teto 6.0 pts)
            </label>

            {user.metas.map((meta) => {
              const isChecked = !!metaStatus[meta.ordem];
              return (
                <label
                  key={meta.ordem}
                  className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        setMetaStatus({ ...metaStatus, [meta.ordem]: e.target.checked })
                      }
                      className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-amber-400">Meta {meta.ordem}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                          +{meta.pontos} {meta.pontos === 1 ? 'pt' : 'pts'}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 leading-snug">{meta.descricao}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      isChecked
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isChecked ? 'Batida' : 'Não batida'}
                  </span>
                </label>
              );
            })}
          </div>

          {/* 5S Status */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Auditoria 5S Validada</span>
                <span className="text-[11px] text-slate-500">
                  Garante o ponto de 5S no fechamento do dia
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={fiveSApproved}
                  onChange={(e) => setFiveSApproved(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {['G1128', 'G1147', 'G1125', 'G1161', 'G1160', 'G1154'].includes(user.matricula) && (
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300">
                ⭐ <strong>Regra Cícero:</strong> O 5S deste colaborador é preenchido automaticamente quando a foto do Conferente Cícero é auditada e aprovada.
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Observações da Supervisão
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Auditoria validada em campo pelo supervisor de turno..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {savedSuccess ? 'Salvo!' : 'Salvar Lançamento Diário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
