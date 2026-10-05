import React, { useState } from 'react';
import {
  X,
  Lock,
  User as UserIcon,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
} from 'lucide-react';
import { User, ROLE_LABELS, ROLE_BADGE_COLORS, ROLE_ICONS, JobRole } from '../types/dpo';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User | null;
  onSelectUser: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSelectUser,
}) => {
  const [matriculaInput, setMatriculaInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedMatricula = matriculaInput.trim().toUpperCase();
    const trimmedPin = pinInput.trim();

    if (!trimmedMatricula || !trimmedPin) {
      setErrorMsg('Por favor, informe a matrícula e o PIN de acesso.');
      return;
    }

    const matchedUser = users.find(
      (u) =>
        u.matricula.toUpperCase() === trimmedMatricula &&
        (u.pin === trimmedPin || trimmedPin === '1234')
    );

    if (!matchedUser) {
      setErrorMsg('Matrícula ou PIN incorretos. (PIN padrão: 1234)');
      return;
    }

    setSuccessMsg(`Bem-vindo, ${matchedUser.name}! Autenticado com sucesso.`);
    setTimeout(() => {
      onSelectUser(matchedUser);
      onClose();
    }, 500);
  };

  const handleQuickSelect = (user: User) => {
    onSelectUser(user);
    onClose();
  };

  const rolesOrder: { role: JobRole; label: string }[] = [
    { role: 'ajudante', label: 'Ajudante de Armazém' },
    { role: 'conferente', label: 'Conferente' },
    { role: 'empilhador', label: 'Empilhador' },
    { role: 'manobrista', label: 'Manobrista' },
  ];

  const filteredUsers = users.filter((u) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.matricula.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Autenticação de Acesso Individual</h2>
              <p className="text-xs text-slate-400">
                Acesse seu painel personalizado com suas 4 metas e ranking em tempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Manual Login Form */}
          <form
            onSubmit={handleManualLogin}
            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              Entrar com Matrícula & PIN
            </h3>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {successMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Matrícula
                </label>
                <input
                  type="text"
                  placeholder="Ex: G1154"
                  value={matriculaInput}
                  onChange={(e) => setMatriculaInput(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Senha / PIN (Padrão: 1234)
                </label>
                <input
                  type="password"
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all"
              >
                Acessar Meu Painel
              </button>
            </div>
          </form>

          {/* Quick Collaborator Switcher (Grouped by Cargo) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-amber-400" />
                Ou Selecione o Colaborador da Liga (15 Colaboradores)
              </h3>

              <div className="relative w-44">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-[11px] text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              {rolesOrder.map(({ role, label }) => {
                const roleUsers = filteredUsers.filter((u) => u.role === role);
                if (roleUsers.length === 0) return null;

                return (
                  <div key={role} className="space-y-2">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>{ROLE_ICONS[role]}</span>
                      <span>
                        {label} ({roleUsers.length})
                      </span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {roleUsers.map((user) => {
                        const isCurrent = currentUser?.id === user.id;
                        return (
                          <div
                            key={user.id}
                            onClick={() => handleQuickSelect(user)}
                            className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                              isCurrent
                                ? 'bg-amber-500/20 border-amber-500 text-white shadow-md shadow-amber-500/10'
                                : 'bg-slate-950/80 border-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-700"
                            />
                            <div className="truncate">
                              <span className="font-bold text-xs block truncate">{user.name}</span>
                              <span className="font-mono text-[10px] text-amber-400/90 block">
                                {user.matricula}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
