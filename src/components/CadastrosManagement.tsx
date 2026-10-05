import React, { useState, useRef } from 'react';
import {
  Users,
  UserPlus,
  Sliders,
  Settings,
  Shield,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Save,
  Lock,
  Search,
  Sparkles,
  Camera,
  Upload,
  RefreshCw,
  X,
  Target,
  Copy,
  Check,
  FileCode,
  Download,
  ShieldAlert,
  Undo2,
  AlertOctagon,
} from 'lucide-react';
import {
  User,
  MetaItem,
  DPOParameters,
  JobRole,
  AccessLevel,
  ROLE_LABELS,
  ROLE_BADGE_COLORS,
  ROLE_ICONS,
  LigaImportSchema,
} from '../types/dpo';
import { storageService } from '../services/storageService';
import { DisqualificationModal } from './DisqualificationModal';

interface CadastrosManagementProps {
  currentUser: User | null;
  users: User[];
  parameters: DPOParameters;
  onDataChanged: () => void;
  onOpenLogin: () => void;
}

export const CadastrosManagement: React.FC<CadastrosManagementProps> = ({
  currentUser,
  users,
  parameters,
  onDataChanged,
  onOpenLogin,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'colaboradores' | 'metas_cargo' | 'json_import' | 'parametros'
  >('colaboradores');

  const [searchUser, setSearchUser] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [copiedJSON, setCopiedJSON] = useState(false);

  // Disqualification Modal State
  const [isDisqualifyModalOpen, setIsDisqualifyModalOpen] = useState(false);
  const [selectedUserToDisqualify, setSelectedUserToDisqualify] = useState<User | null>(null);

  const handleOpenDisqualifyModal = (user: User) => {
    setSelectedUserToDisqualify(user);
    setIsDisqualifyModalOpen(true);
  };

  const handleConfirmDisqualify = (userId: string, motivo: string) => {
    storageService.disqualifyUser(userId, motivo, currentUser?.name || 'Gestor DPO Armazém');
    onDataChanged();
  };

  const handleConfirmRequalify = (userId: string) => {
    storageService.requalifyUser(userId, currentUser?.name || 'Gestor DPO Armazém');
    onDataChanged();
  };

  // Collaborator Modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const gestorPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleGestorPhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const photoUrl = reader.result as string;
      storageService.updateGestorPhoto(photoUrl, currentUser?.id);
      onDataChanged();
      setFeedbackMsg('Foto do Gestor atualizada com sucesso!');
      setTimeout(() => setFeedbackMsg(''), 4000);
    };
    reader.readAsDataURL(file);
  };

  const [userFormData, setUserFormData] = useState<{
    id?: string;
    name: string;
    matricula: string;
    pin: string;
    role: JobRole;
    accessLevel: AccessLevel;
    avatar: string;
    metas: MetaItem[];
  }>({
    name: '',
    matricula: '',
    pin: '1234',
    role: 'ajudante',
    accessLevel: 'operador',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    metas: [
      { ordem: 1, descricao: 'EFM maior ou igual a 85%', pontos: 2, categoria: 'eficiencia' },
      { ordem: 2, descricao: 'Erros de montagem > 2%', pontos: 2, categoria: 'qualidade' },
      { ordem: 3, descricao: 'Relato de anomalia/segurança', pontos: 1, categoria: 'seguranca' },
      { ordem: 4, descricao: '5S Armazém', pontos: 1, categoria: '5s' },
    ],
  });

  // JSON Import/Export State preloaded with user's official schema
  const [jsonText, setJsonText] = useState<string>(() => {
    return JSON.stringify(storageService.exportLigaJSON(), null, 2);
  });

  // Open modal for new collaborator
  const handleOpenNewUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: '',
      matricula: `G${Math.floor(1000 + Math.random() * 9000)}`,
      pin: '1234',
      role: 'ajudante',
      accessLevel: 'operador',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      metas: [
        { ordem: 1, descricao: 'EFM maior ou igual a 85%', pontos: 2, categoria: 'eficiencia' },
        { ordem: 2, descricao: 'Erros de montagem > 2%', pontos: 2, categoria: 'qualidade' },
        { ordem: 3, descricao: 'Relato de anomalia/segurança', pontos: 1, categoria: 'seguranca' },
        { ordem: 4, descricao: '5S Armazém', pontos: 1, categoria: '5s' },
      ],
    });
    setIsUserModalOpen(true);
  };

  // Open modal to edit existing collaborator
  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      id: user.id,
      name: user.name,
      matricula: user.matricula,
      pin: user.pin || '1234',
      role: user.role,
      accessLevel: user.accessLevel,
      avatar: user.avatar,
      metas: JSON.parse(JSON.stringify(user.metas)),
    });
    setIsUserModalOpen(true);
  };

  // Handle avatar upload
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserFormData((prev) => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Collaborator
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();

    // Sum points to ensure exactly 6 points
    const totalPoints = userFormData.metas.reduce((acc, m) => acc + Number(m.pontos), 0);
    if (totalPoints !== 6) {
      alert(`Atenção: A soma das metas deve ser exatamente 6 pontos (atualmente está em ${totalPoints} pontos). Ajuste os pontos das metas.`);
      return;
    }

    const userToSave: User = {
      id: editingUser ? editingUser.id : `u-${userFormData.matricula.toLowerCase()}`,
      name: userFormData.name.trim(),
      matricula: userFormData.matricula.trim().toUpperCase(),
      pin: userFormData.pin.trim() || '1234',
      role: userFormData.role,
      roleTitle: ROLE_LABELS[userFormData.role],
      accessLevel: userFormData.accessLevel,
      avatar: userFormData.avatar,
      status: 'ativo',
      pontuacaoMaxima: 6,
      metas: userFormData.metas,
    };

    storageService.saveUser(userToSave);
    setIsUserModalOpen(false);
    onDataChanged();
    setFeedbackMsg(`Colaborador ${userToSave.name} (${userToSave.matricula}) salvo com sucesso!`);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  // Delete Collaborator
  const handleDeleteUser = (user: User) => {
    if (confirm(`Tem certeza que deseja excluir ${user.name} (${user.matricula}) da Liga DPO?`)) {
      storageService.deleteUser(user.id);
      onDataChanged();
      setFeedbackMsg(`Colaborador ${user.name} excluído com sucesso.`);
      setTimeout(() => setFeedbackMsg(''), 4000);
    }
  };

  // Replicate metas to an entire cargo
  const handleReplicateMetas = (role: JobRole, sampleMetas: MetaItem[]) => {
    if (
      confirm(
        `Deseja replicar estas 4 metas para TODOS os colaboradores do cargo "${ROLE_LABELS[role]}"? Esta ação atualizará as metas de todos eles.`
      )
    ) {
      storageService.replicateMetasToCargo(role, sampleMetas);
      onDataChanged();
      setFeedbackMsg(`Metas replicadas com sucesso para todos os ${ROLE_LABELS[role]}!`);
      setTimeout(() => setFeedbackMsg(''), 4000);
    }
  };

  // Handle JSON Import
  const handleImportJSON = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const res = storageService.importLigaJSON(parsed);
      if (res.success) {
        onDataChanged();
        setFeedbackMsg(res.message);
        setTimeout(() => setFeedbackMsg(''), 5000);
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      alert(`Erro de sintaxe JSON: ${e.message}`);
    }
  };

  // Copy JSON to clipboard
  const handleCopyJSON = () => {
    const currentJson = JSON.stringify(storageService.exportLigaJSON(), null, 2);
    setJsonText(currentJson);
    navigator.clipboard.writeText(currentJson);
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 3000);
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    if (!searchUser.trim()) return true;
    const q = searchUser.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.matricula.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
              PAINEL ADMINISTRATIVO DPO
            </span>
            <span className="text-xs text-slate-400">• Total: {users.length} Colaboradores</span>
          </div>
          <h1 className="text-2xl font-black text-white">Cadastros & Gestão de Metas</h1>
          <p className="text-xs text-slate-400">
            Cadastre ou altere colaboradores, replique metas por cargo e importe/exporte a estrutura JSON da liga.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => gestorPhotoInputRef.current?.click()}
            title="Importar Foto dos Gestores"
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-sm"
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Foto Gestor</span>
          </button>
          <input
            type="file"
            ref={gestorPhotoInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleGestorPhotoFile}
          />

          <button
            onClick={handleOpenNewUser}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Novo Colaborador
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          {feedbackMsg}
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto scrollbar-none text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('colaboradores')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'colaboradores'
              ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Colaboradores da Liga ({users.length})
        </button>

        <button
          onClick={() => setActiveSubTab('metas_cargo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'metas_cargo'
              ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          Metas por Cargo & Replicação
        </button>

        <button
          onClick={() => setActiveSubTab('json_import')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'json_import'
              ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4" />
          Importação / Exportação JSON
        </button>

        <button
          onClick={() => setActiveSubTab('parametros')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'parametros'
              ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          Parâmetros da Liga
        </button>
      </div>

      {/* SUB-TAB 1: COLABORADORES LIST */}
      {activeSubTab === 'colaboradores' && (
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por nome ou matrícula..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <span className="text-xs text-slate-400">
              Mostrando <strong className="text-white">{filteredUsers.length}</strong> colaboradores
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {filteredUsers.map((user) => {
              const roleBadge = ROLE_BADGE_COLORS[user.role];
              return (
                <div
                  key={user.id}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 space-y-3 transition-colors shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-700"
                      />
                      <div>
                        <h3 className="font-extrabold text-white text-sm">{user.name}</h3>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span className="font-mono font-bold text-amber-400">
                            {user.matricula}
                          </span>
                          <span>•</span>
                          <span>PIN: {user.pin || '1234'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {user.desqualificado ? (
                        <button
                          onClick={() => handleOpenDisqualifyModal(user)}
                          title="Restaurar qualificação deste colaborador"
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 transition-colors"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenDisqualifyModal(user)}
                          title="Desqualificar Colaborador da Liga"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-colors"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditUser(user)}
                        title="Editar Colaborador e Metas"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        title="Excluir Colaborador"
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}
                    >
                      <span>{ROLE_ICONS[user.role]}</span>
                      <span>{ROLE_LABELS[user.role]}</span>
                    </span>

                    {user.desqualificado && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-black uppercase tracking-wider">
                        <AlertOctagon className="w-3 h-3 text-rose-400" />
                        Desqualificado
                      </span>
                    )}
                  </div>

                  {user.desqualificado && user.motivoDesqualificacao && (
                    <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[11px] space-y-0.5">
                      <strong className="text-rose-400 font-bold block">Motivo da desqualificação:</strong>
                      <p className="italic text-slate-300 line-clamp-2">
                        "{user.motivoDesqualificacao}"
                      </p>
                    </div>
                  )}

                  {/* 4 Metas summary */}
                  <div className="space-y-1 pt-1 border-t border-slate-800/60 text-[10px]">
                    <span className="text-slate-500 font-bold block uppercase tracking-wider">
                      As 4 Metas (Teto: 6.0 pts)
                    </span>
                    {user.metas.map((m) => (
                      <div
                        key={m.ordem}
                        className="flex items-center justify-between text-slate-300 truncate"
                      >
                        <span className="truncate pr-2">
                          M{m.ordem}: {m.descricao}
                        </span>
                        <span className="font-mono text-amber-400 font-bold">+{m.pontos}p</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: METAS POR CARGO & REPLICAÇÃO */}
      {activeSubTab === 'metas_cargo' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <strong className="block font-bold mb-1">Como funciona a Replicação Automática:</strong>
            Ao atualizar ou aprovar as metas padrão de um cargo, clique em <strong>"Replicar para todos os colaboradores do cargo"</strong> para sincronizar instantaneamente as metas de todos os operadores daquele cargo.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['ajudante', 'conferente', 'empilhador', 'manobrista'] as JobRole[]).map((role) => {
              const roleUsers = users.filter((u) => u.role === role);
              const sampleMetas = roleUsers[0]?.metas || [
                { ordem: 1, descricao: 'Meta 1', pontos: 2 },
                { ordem: 2, descricao: 'Meta 2', pontos: 2 },
                { ordem: 3, descricao: 'Meta 3', pontos: 1 },
                { ordem: 4, descricao: 'Meta 4', pontos: 1 },
              ];

              return (
                <div
                  key={role}
                  className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{ROLE_ICONS[role]}</span>
                      <div>
                        <h3 className="font-black text-white text-base">{ROLE_LABELS[role]}</h3>
                        <span className="text-xs text-slate-400">
                          {roleUsers.length} colaboradores neste cargo
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300">
                      Teto: 6.0 pts
                    </span>
                  </div>

                  {/* 4 Standard Metas */}
                  <div className="space-y-2">
                    {sampleMetas.map((m) => (
                      <div
                        key={m.ordem}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-800 text-amber-400 font-bold flex items-center justify-center text-[10px]">
                            {m.ordem}
                          </span>
                          <span className="text-white font-medium">{m.descricao}</span>
                        </div>
                        <span className="font-mono font-black text-amber-400">
                          {m.pontos} {m.pontos === 1 ? 'pt' : 'pts'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => handleReplicateMetas(role, sampleMetas)}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700/80 hover:border-amber-500"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Replicar Metas para todos os {roleUsers.length} {ROLE_LABELS[role]}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: JSON IMPORT / EXPORT */}
      {activeSubTab === 'json_import' && (
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-400" />
                Estrutura JSON Oficial da Liga DPO
              </h2>
              <p className="text-xs text-slate-400">
                Importe ou exporte em lote os cargos, colaboradores e as 60 metas no formato exato solicitado.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyJSON}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700/80 transition-colors"
              >
                {copiedJSON ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedJSON ? 'Copiado!' : 'Copiar JSON'}
              </button>

              <button
                onClick={handleImportJSON}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
              >
                <Download className="w-4 h-4" />
                Importar Estrutura
              </button>
            </div>
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={18}
            className="w-full font-mono text-xs p-4 rounded-2xl bg-slate-950 border border-slate-800 text-amber-200/90 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed scrollbar-none"
          />
        </div>
      )}

      {/* SUB-TAB 4: PARÂMETROS GERAIS DPO */}
      {activeSubTab === 'parametros' && (
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-6 shadow-xl max-w-3xl">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" />
              Parâmetros Oficiais da Liga DPO
            </h2>
            <p className="text-xs text-slate-400">
              Diretrizes de pontuação, temporadas e regras do pilar de excelência operacional.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Nome da Liga
              </label>
              <input
                type="text"
                value={parameters.ligaNome}
                onChange={(e) =>
                  storageService.updateParameters({ ...parameters, ligaNome: e.target.value })
                }
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Pontuação Máxima por Colaborador
              </label>
              <input
                type="number"
                disabled
                value={parameters.pontuacaoMaximaPorColaborador}
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-amber-400 font-bold opacity-75 cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Fixo em 6.0 pontos (composto pelas 4 metas individuais).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Observação / Regra Fundamental
              </label>
              <textarea
                value={parameters.observacao}
                onChange={(e) =>
                  storageService.updateParameters({ ...parameters, observacao: e.target.value })
                }
                rows={3}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Temporada Ativa
              </label>
              <input
                type="text"
                value={parameters.temporadaAtiva}
                onChange={(e) =>
                  storageService.updateParameters({ ...parameters, temporadaAtiva: e.target.value })
                }
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      'Deseja restaurar todos os dados da Liga DPO para o padrão original da especificação (15 colaboradores)?'
                    )
                  ) {
                    storageService.resetAll();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition-all"
              >
                Restaurar Padrão de Fábrica (15 Colaboradores)
              </button>

              <button
                onClick={() => {
                  onDataChanged();
                  setFeedbackMsg('Parâmetros salvos com sucesso!');
                  setTimeout(() => setFeedbackMsg(''), 3000);
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20"
              >
                Salvar Parâmetros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRO / EDIÇÃO DE COLABORADOR E SUAS 4 METAS */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  {editingUser ? `Editar: ${editingUser.name}` : 'Cadastrar Novo Colaborador'}
                </h3>
                <p className="text-xs text-slate-400">
                  Defina a matrícula (login), cargo e as 4 metas que somam 6 pontos.
                </p>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    placeholder="Ex: Edilson"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Matrícula (Login de Usuário)
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormData.matricula}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, matricula: e.target.value.toUpperCase() })
                    }
                    placeholder="Ex: G1154"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Cargo Operacional
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, role: e.target.value as JobRole })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="ajudante">Ajudante de Armazém</option>
                    <option value="conferente">Conferente</option>
                    <option value="empilhador">Empilhador</option>
                    <option value="manobrista">Manobrista</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Senha / PIN de Acesso
                  </label>
                  <input
                    type="text"
                    value={userFormData.pin}
                    onChange={(e) => setUserFormData({ ...userFormData, pin: e.target.value })}
                    placeholder="1234"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Avatar Picture */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Foto do Colaborador
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={userFormData.avatar}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover ring-1 ring-amber-500/40"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700/80"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    Alterar Foto
                  </button>
                  <input
                    type="text"
                    value={userFormData.avatar}
                    onChange={(e) => setUserFormData({ ...userFormData, avatar: e.target.value })}
                    placeholder="Ou cole a URL da foto..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 truncate"
                  />
                </div>
              </div>

              {/* The 4 Metas Definition for this user */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    As 4 Metas Individuais (Soma Obrigatória: 6 Pontos)
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    Soma Atual: {userFormData.metas.reduce((acc, m) => acc + Number(m.pontos), 0)} / 6 pts
                  </span>
                </div>

                <div className="space-y-2">
                  {userFormData.metas.map((meta, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-1 text-center font-bold text-xs text-amber-400">
                        M{meta.ordem}
                      </div>
                      <div className="sm:col-span-8">
                        <input
                          type="text"
                          required
                          value={meta.descricao}
                          onChange={(e) => {
                            const newMetas = [...userFormData.metas];
                            newMetas[idx].descricao = e.target.value;
                            setUserFormData({ ...userFormData, metas: newMetas });
                          }}
                          placeholder="Descrição da meta..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div className="sm:col-span-3 flex items-center gap-1.5 justify-end">
                        <span className="text-[10px] text-slate-400">Pontos:</span>
                        <select
                          value={meta.pontos}
                          onChange={(e) => {
                            const newMetas = [...userFormData.metas];
                            newMetas[idx].pontos = Number(e.target.value);
                            setUserFormData({ ...userFormData, metas: newMetas });
                          }}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-amber-400 font-bold focus:outline-none"
                        >
                          <option value={1}>1 ponto</option>
                          <option value={2}>2 pontos</option>
                          <option value={3}>3 pontos</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20"
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disqualification Modal */}
      <DisqualificationModal
        isOpen={isDisqualifyModalOpen}
        onClose={() => setIsDisqualifyModalOpen(false)}
        user={selectedUserToDisqualify}
        gestorName={currentUser?.name || 'Gestor DPO Armazém'}
        onConfirmDisqualify={handleConfirmDisqualify}
        onConfirmRequalify={handleConfirmRequalify}
      />
    </div>
  );
};
