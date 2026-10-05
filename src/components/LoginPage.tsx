import React, { useState } from 'react';
import { Warehouse, Lock, KeyRound, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { User } from '../types/dpo';
import { storageService } from '../services/storageService';

interface LoginPageProps {
  onLoginSuccess: (user: User, accessLevel: 'participante' | 'gestor') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedMatricula = matricula.trim();
    const trimmedSenha = senha.trim();

    if (!trimmedMatricula || !trimmedSenha) {
      setErrorMessage('Por favor, informe a matrícula e a senha de acesso.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = storageService.login(trimmedMatricula, trimmedSenha);
      if (res.success && res.user) {
        onLoginSuccess(res.user, res.accessLevel);
      } else {
        setErrorMessage(res.message || 'Matrícula ou senha inválidos. Tente novamente.');
        setIsLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-2xl shadow-amber-500/30 font-black mb-1">
            <Warehouse className="w-8 h-8 text-slate-950" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400"></span>
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              LIGA DPO <span className="text-amber-400">ARMAZÉM</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
              Excelência Operacional & Metas Diárias
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-white">Acesso ao Sistema</h2>
            <p className="text-xs text-slate-400">
              Digite seu usuário (matrícula) e senha cadastrada para entrar.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Usuário / Matrícula
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  name="dpo_user_id"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  placeholder="Ex: G1002 ou matrícula"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  name="dpo_user_pass"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white px-1.5 py-1"
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer mt-2"
            >
              <span>{isLoading ? 'Autenticando...' : 'Entrar na Plataforma'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </form>
        </div>

        {/* Footer Notice */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>Acesso restrito para colaboradores e supervisão do Armazém DPO.</p>
          <p className="text-slate-600">
            Cadastros e credenciais são administrados pelo Gestor na Guia de Cadastros.
          </p>
        </div>
      </div>
    </div>
  );
};
