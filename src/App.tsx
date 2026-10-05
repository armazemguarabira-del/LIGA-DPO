import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  UserCheck,
  Camera,
  FileText,
  Sliders,
  Shield,
  Layers,
  Sparkles,
  Warehouse,
  CheckCircle,
  HelpCircle,
  Calendar,
  Lock,
  Unlock,
  X,
  Target,
  Menu,
  Bell,
  AlertOctagon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Upload,
  ShieldCheck,
} from 'lucide-react';
import {
  User,
  JobRole,
  DailyRecord,
  FiveSSubmission,
  SafetyAnomalyReport,
  CritiqueRequest,
  DPOParameters,
  RankingEntry,
  DPONotification,
} from './types/dpo';
import { storageService } from './services/storageService';
import { SidebarGestor } from './components/SidebarGestor';
import { NavbarParticipant } from './components/NavbarParticipant';
import { NotificationModal } from './components/NotificationModal';
import { SafetyReportsManagement } from './components/SafetyReportsManagement';
import { DashboardRanking } from './components/DashboardRanking';
import { CollaboratorPersonalPanel } from './components/CollaboratorPersonalPanel';
import { SupervisorScoringGuide } from './components/SupervisorScoringGuide';
import { FiveSModule } from './components/FiveSModule';
import { SupervisorReports } from './components/SupervisorReports';
import { CadastrosManagement } from './components/CadastrosManagement';
import { LoginPage } from './components/LoginPage';
import { LoginModal } from './components/LoginModal';
import { CollaboratorDetailModal } from './components/CollaboratorDetailModal';
import { EditDailyRecordModal } from './components/EditDailyRecordModal';
import { WmsIntegrationModal } from './components/WmsIntegrationModal';
import { MonthlyHistoryModal } from './components/MonthlyHistoryModal';
import { CritiquesModal } from './components/CritiquesModal';

export default function App() {
  // Global Data State
  const [currentUser, setCurrentUser] = useState<User | null>(() => storageService.getCurrentUser());
  const [users, setUsers] = useState<User[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [fiveSSubmissions, setFiveSSubmissions] = useState<FiveSSubmission[]>([]);
  const [safetyReports, setSafetyReports] = useState<SafetyAnomalyReport[]>([]);
  const [critiques, setCritiques] = useState<CritiqueRequest[]>([]);
  const [notifications, setNotifications] = useState<DPONotification[]>([]);
  const [parameters, setParameters] = useState<DPOParameters>(storageService.getParameters());
  const [rankings, setRankings] = useState<RankingEntry[]>([]);

  // Access Level: 'participante' (default) vs 'gestor'
  const [accessLevel, setAccessLevel] = useState<'participante' | 'gestor'>(
    storageService.getActiveAccessLevel()
  );
  const [isGestorSessionAuthenticated, setIsGestorSessionAuthenticated] = useState<boolean>(
    () => storageService.getActiveAccessLevel() === 'gestor' || storageService.getCurrentUser()?.matricula === 'G1002'
  );
  const [isGestorPinModalOpen, setIsGestorPinModalOpen] = useState(false);
  const [gestorPinInput, setGestorPinInput] = useState('');
  const [gestorPinError, setGestorPinError] = useState('');

  // Sidebar Controls for Gestor
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // Notification Modal State
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Gestor Photo Upload Ref & Handler
  const topGestorPhotoRef = useRef<HTMLInputElement>(null);

  const handleTopGestorPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const photoUrl = reader.result as string;
      storageService.updateGestorPhoto(photoUrl, currentUser?.id);
      reloadAllData();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.2 },
        colors: ['#f59e0b', '#10b981'],
      });
    };
    reader.readAsDataURL(file);
  };

  // Navigation & Filter State
  const [activeTab, setActiveTab] = useState<string>('ranking');
  const [selectedRoleTab, setSelectedRoleTab] = useState<JobRole | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // Setembro (default current month)

  // Modal Visibility State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isWmsModalOpen, setIsWmsModalOpen] = useState(false);
  const [isMonthlyHistoryOpen, setIsMonthlyHistoryOpen] = useState(false);
  const [isCritiquesModalOpen, setIsCritiquesModalOpen] = useState(false);
  const [critiquePreselectedDate, setCritiquePreselectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const [selectedCollaboratorDetail, setSelectedCollaboratorDetail] =
    useState<RankingEntry | null>(null);
  const [editingUserDaily, setEditingUserDaily] = useState<User | null>(null);

  const isGestor = accessLevel === 'gestor';

  // Reload all data from local storage
  const reloadAllData = () => {
    const loadedUsers = storageService.getUsers();
    const loadedRecords = storageService.getDailyRecords();
    const loadedFiveS = storageService.getFiveSSubmissions();
    const loadedSafety = storageService.getSafetyReports();
    const loadedCritiques = storageService.getCritiques();
    const loadedParams = storageService.getParameters();
    const currentLogged = storageService.getCurrentUser();
    const activeAccess = storageService.getActiveAccessLevel();
    const loadedNotifs = storageService.getNotificationsForUser(
      currentLogged?.id || '',
      activeAccess === 'gestor'
    );
    const calculatedRankings = storageService.calculateRanking(selectedRoleTab, selectedMonth);

    setUsers(loadedUsers);
    setDailyRecords(loadedRecords);
    setFiveSSubmissions(loadedFiveS);
    setSafetyReports(loadedSafety);
    setCritiques(loadedCritiques);
    setNotifications(loadedNotifs);
    setParameters(loadedParams);
    setRankings(calculatedRankings);
    setCurrentUser(currentLogged);
  };

  useEffect(() => {
    reloadAllData();
    const unsubscribe = storageService.subscribe(() => {
      reloadAllData();
    });
    return () => {
      unsubscribe();
    };
  }, [selectedRoleTab, selectedMonth]);

  const handleLoginSuccess = (user: User, access: 'participante' | 'gestor') => {
    storageService.setCurrentUser(user.id);
    storageService.setActiveAccessLevel(access);
    setCurrentUser(user);
    setAccessLevel(access);
    if (access === 'participante') {
      setActiveTab('meu-painel');
    } else {
      setActiveTab('ranking');
    }
    reloadAllData();

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#f59e0b', '#10b981', '#3b82f6'],
    });
  };

  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(null);
    setAccessLevel('participante');
    setActiveTab('ranking');
  };

  const handleSelectUser = (user: User) => {
    storageService.setCurrentUser(user.id);
    setCurrentUser(user);
    reloadAllData();

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#f59e0b', '#10b981', '#3b82f6'],
    });
  };

  const handleToggleGestorMode = () => {
    if (accessLevel === 'gestor') {
      // Revert to participante while remembering gestor was authenticated
      setIsGestorSessionAuthenticated(true);
      setAccessLevel('participante');
      storageService.setActiveAccessLevel('participante');
      if (
        activeTab === 'pontuacao-supervisor' ||
        activeTab === '5s' ||
        activeTab === 'relatos-anomalias' ||
        activeTab === 'relatorios' ||
        activeTab === 'cadastros'
      ) {
        setActiveTab('ranking');
      }
      reloadAllData();
    } else {
      // Return to gestor: if already authenticated in this session or user is Gestor G1002/supervisor, switch instantly!
      if (
        isGestorSessionAuthenticated ||
        currentUser?.matricula === 'G1002' ||
        currentUser?.accessLevel === 'supervisor' ||
        currentUser?.accessLevel === 'gerente'
      ) {
        setAccessLevel('gestor');
        storageService.setActiveAccessLevel('gestor');
        reloadAllData();
      } else {
        // Ask for Gestor PIN
        setGestorPinInput('');
        setGestorPinError('');
        setIsGestorPinModalOpen(true);
      }
    }
  };

  const handleConfirmGestorPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (storageService.validateGestorPin(gestorPinInput.trim())) {
      setIsGestorSessionAuthenticated(true);
      setAccessLevel('gestor');
      storageService.setActiveAccessLevel('gestor');
      setIsGestorPinModalOpen(false);
      setGestorPinError('');
      reloadAllData();
    } else {
      setGestorPinError('PIN incorreto. (Dica padrão: 1234)');
    }
  };

  // Uma vez analisada a notificação no sininho ela deve sumir da lista/contador
  const handleMarkNotificationRead = (id: string) => {
    storageService.deleteNotification(id);
    reloadAllData();
  };

  const handleMarkAllNotificationsRead = () => {
    if (currentUser) {
      storageService.clearAllNotifications(currentUser.id, isGestor);
      reloadAllData();
    }
  };

  // Pending counts
  const pendingFiveSCount = fiveSSubmissions.filter((s) => s.status === 'pendente').length;
  const pendingSafetyCount = safetyReports.filter((r) => r.status === 'pendente').length;
  const pendingCritiquesCount = critiques.filter((c) => c.status === 'pendente').length;
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const todayDateStr = new Date().toISOString().split('T')[0];

  const currentLoggedDailyRecord =
    dailyRecords.find((r) => r.userId === currentUser?.id && r.date === todayDateStr) || null;
  const currentLoggedRankingEntry = rankings.find((r) => r.userId === currentUser?.id);

  // If no user is logged in, show the clean LoginPage
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Restrict participant access strictly to ranking and meu-painel
  if (!isGestor && activeTab !== 'ranking' && activeTab !== 'meu-painel') {
    setActiveTab('meu-painel');
  }

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'ranking':
        return { title: 'Ranking Geral da Liga DPO', icon: Trophy };
      case 'meu-painel':
        return { title: 'Meu Progresso Diário', icon: UserCheck };
      case 'pontuacao-supervisor':
        return { title: 'Lançamento de Pontuação do Supervisor', icon: Target };
      case '5s':
        return { title: 'Auditoria 5S com Foto', icon: Camera };
      case 'relatos-anomalias':
        return { title: 'Validação de Relatos de Anomalia & Segurança', icon: AlertOctagon };
      case 'relatorios':
        return { title: 'Relatórios do Supervisor em PDF', icon: FileText };
      case 'cadastros':
        return { title: 'Cadastros e Parâmetros de Metas', icon: Sliders };
      default:
        return { title: 'Liga DPO do Armazém', icon: Warehouse };
    }
  };

  const activeTabMeta = getActiveTabTitle();
  const ActiveTabIcon = activeTabMeta.icon;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 1. SE PARTICIPANTE: CABEÇALHO NA PARTE DE CIMA (TOP BAR) COM APENAS OS BOTÕES PEDIDOS */}
      {!isGestor && (
        <NavbarParticipant
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNotifications={() => setIsNotificationModalOpen(true)}
          onLogout={handleLogout}
          unreadNotificationsCount={unreadNotificationsCount}
          onToggleGestorMode={handleToggleGestorMode}
          isGestorSession={
            isGestorSessionAuthenticated ||
            currentUser.matricula === 'G1002' ||
            currentUser.accessLevel === 'supervisor' ||
            currentUser.accessLevel === 'gerente'
          }
        />
      )}

      {/* 2. SE GESTOR: CABEÇALHO NA BARRA LATERAL (SIDEBAR) QUE PODE SER OCULTADA */}
      {isGestor && (
        <>
          <SidebarGestor
            currentUser={currentUser}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenWmsModal={() => setIsWmsModalOpen(true)}
            onOpenMonthlyHistory={() => setIsMonthlyHistoryOpen(true)}
            onOpenCritiques={() => {
              setCritiquePreselectedDate(todayDateStr);
              setIsCritiquesModalOpen(true);
            }}
            onOpenNotifications={() => setIsNotificationModalOpen(true)}
            onLogout={handleLogout}
            onToggleGestorMode={handleToggleGestorMode}
            pendingFiveSCount={pendingFiveSCount}
            pendingSafetyCount={pendingSafetyCount}
            pendingCritiquesCount={pendingCritiquesCount}
            unreadNotificationsCount={unreadNotificationsCount}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
            isMobileOpen={isSidebarMobileOpen}
            setIsMobileOpen={setIsSidebarMobileOpen}
            onGestorPhotoUpdated={reloadAllData}
          />

          {/* Top Helper Bar for Gestor on Mobile & Desktop to allow toggling/unhiding */}
          <div
            className={`sticky top-0 z-30 bg-[#070b14]/90 backdrop-blur-md border-b border-slate-800/80 transition-all duration-300 ${
              isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
              {/* Left: Mobile hamburger & Current active view */}
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => setIsSidebarMobileOpen(true)}
                  className="lg:hidden w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white flex items-center justify-center shrink-0 border border-slate-700/60"
                  title="Abrir Menu Lateral de Gestor"
                >
                  <Menu className="w-4 h-4 shrink-0" />
                </button>

                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                    <ActiveTabIcon className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-extrabold text-white truncate block">
                      {activeTabMeta.title}
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:block truncate">
                      Visão Gestor • Acesso Total Operacional
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: DEIXE APENAS O SININHO NO CABEÇALHO */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Notification Bell */}
                <button
                  onClick={() => setIsNotificationModalOpen(true)}
                  title="Central de Notificações"
                  className="relative w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center shrink-0 cursor-pointer transition-colors shadow-sm"
                >
                  <Bell className="w-4 h-4 shrink-0" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-black text-[9px] shadow-sm animate-pulse">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 sm:pb-8 space-y-6 transition-all duration-300 ${
          isGestor
            ? `${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-76'} max-w-full lg:pr-8`
            : 'max-w-7xl'
        }`}
      >
        {/* TAB 1: RANKING DA LIGA (GERAL & POR CARGOS) */}
        {activeTab === 'ranking' && (
          <DashboardRanking
            rankings={rankings}
            selectedRoleTab={selectedRoleTab}
            setSelectedRoleTab={setSelectedRoleTab}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            onSelectCollaborator={(entry) => setSelectedCollaboratorDetail(entry)}
            onEditCollaboratorMetas={(user) => setEditingUserDaily(user)}
            canEdit={isGestor}
            activeSeason={parameters.temporadaAtiva}
          />
        )}

        {/* TAB 2: MEU PROGRESSO DIÁRIO (PAINEL DO COLABORADOR) */}
        {activeTab === 'meu-painel' && currentUser && (
          <CollaboratorPersonalPanel
            currentUser={currentUser}
            rankingEntry={currentLoggedRankingEntry}
            dailyRecord={currentLoggedDailyRecord}
            onNavigateToRanking={() => setActiveTab('ranking')}
            onOpenMonthlyHistory={() => setIsMonthlyHistoryOpen(true)}
            onOpenCritiques={() => {
              setCritiquePreselectedDate(todayDateStr);
              setIsCritiquesModalOpen(true);
            }}
            onDataChanged={reloadAllData}
            isGestor={isGestor}
          />
        )}

        {/* TAB 3: PONTUAÇÃO DO SUPERVISOR (GUIA EXCLUSIVA DO GESTOR) */}
        {activeTab === 'pontuacao-supervisor' && isGestor && (
          <SupervisorScoringGuide
            users={users}
            dailyRecords={dailyRecords}
            onDataChanged={reloadAllData}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* TAB 4: AUDITORIA 5S COM FOTO (EXCLUSIVO GESTOR) */}
        {activeTab === '5s' && isGestor && (
          <FiveSModule
            currentUser={currentUser}
            submissions={fiveSSubmissions}
            onSubmissionsUpdated={reloadAllData}
            isSupervisorMode={isGestor}
          />
        )}

        {/* TAB 5: RELATOS DE ANOMALIA & SEGURANÇA (EXCLUSIVO GESTOR - APROVAÇÃO PARA PONTUAR) */}
        {activeTab === 'relatos-anomalias' && isGestor && (
          <SafetyReportsManagement
            reports={safetyReports}
            onReportsUpdated={reloadAllData}
            supervisorName={currentUser.name}
          />
        )}

        {/* TAB 6: RELATÓRIOS DO SUPERVISOR EM PDF (EXCLUSIVO GESTOR) */}
        {activeTab === 'relatorios' && isGestor && (
          <SupervisorReports
            currentUser={currentUser}
            rankings={rankings}
            users={users}
          />
        )}

        {/* TAB 7: CADASTROS & METAS (EXCLUSIVO GESTOR) */}
        {activeTab === 'cadastros' && isGestor && (
          <CadastrosManagement
            currentUser={currentUser}
            users={users}
            parameters={parameters}
            onDataChanged={reloadAllData}
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        )}
      </main>

      {/* 3. BARRA DE NAVEGAÇÃO INFERIOR MOBILE - SEMPRE VISÍVEL NO SMARTPHONE (NÃO OCULTA ÍCONES) */}
      <nav
        aria-label="Navegação Rápida Mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080d1a]/95 backdrop-blur-md border-t border-slate-800 shadow-[0_-4px_25px_rgba(0,0,0,0.6)] px-2 py-1.5"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1 items-center">
          {isGestor ? (
            <>
              {/* Ranking */}
              <button
                type="button"
                onClick={() => setActiveTab('ranking')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'ranking'
                    ? 'text-amber-400 bg-amber-500/10 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy className="w-5 h-5 shrink-0" />
                <span className="text-[10px] mt-0.5 leading-none">Ranking</span>
              </button>

              {/* Pontuação Supervisor */}
              <button
                type="button"
                onClick={() => setActiveTab('pontuacao-supervisor')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'pontuacao-supervisor'
                    ? 'text-amber-400 bg-amber-500/10 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Target className="w-5 h-5 shrink-0" />
                <span className="text-[10px] mt-0.5 leading-none">Pontuar</span>
              </button>

              {/* 5S com Foto */}
              <button
                type="button"
                onClick={() => setActiveTab('5s')}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === '5s'
                    ? 'text-amber-400 bg-amber-500/10 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-5 h-5 shrink-0" />
                <span className="text-[10px] mt-0.5 leading-none">5S Foto</span>
                {pendingFiveSCount > 0 && (
                  <span className="absolute top-0.5 right-2 w-4 h-4 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center shadow-sm">
                    {pendingFiveSCount}
                  </span>
                )}
              </button>

              {/* Relatos de Anomalia */}
              <button
                type="button"
                onClick={() => setActiveTab('relatos-anomalias')}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'relatos-anomalias'
                    ? 'text-amber-400 bg-amber-500/10 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <AlertOctagon className="w-5 h-5 shrink-0" />
                <span className="text-[10px] mt-0.5 leading-none">Relatos</span>
                {pendingSafetyCount > 0 && (
                  <span className="absolute top-0.5 right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center shadow-sm">
                    {pendingSafetyCount}
                  </span>
                )}
              </button>

              {/* Menu Lateral / Mais Opções */}
              <button
                type="button"
                onClick={() => setIsSidebarMobileOpen(true)}
                className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <Menu className="w-5 h-5 shrink-0" />
                <span className="text-[10px] mt-0.5 leading-none">Menu</span>
              </button>
            </>
          ) : (
            <>
              {/* Ranking */}
              <button
                type="button"
                onClick={() => setActiveTab('ranking')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'ranking'
                    ? 'text-amber-400 bg-amber-500/10 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy className="w-5 h-5 shrink-0" />
                <span className="text-[10px] mt-0.5 leading-none">Ranking</span>
              </button>

              {/* Meu Progresso */}
              <button
                type="button"
                onClick={() => setActiveTab('meu-painel')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'meu-painel'
                    ? 'text-amber-400 bg-amber-500/10 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-5 h-5 shrink-0" />
                <span className="text-[10px] mt-0.5 leading-none">Meu Painel</span>
              </button>

              {/* Sininho Notificações */}
              <button
                type="button"
                onClick={() => setIsNotificationModalOpen(true)}
                className="relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <Bell className="w-5 h-5 shrink-0" />
                <span className="text-[10px] mt-0.5 leading-none">Avisos</span>
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0.5 right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center shadow-sm animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Alternar / Voltar ao Gestor */}
              <button
                type="button"
                onClick={handleToggleGestorMode}
                className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-amber-400 hover:text-amber-300 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span className="text-[10px] mt-0.5 leading-none font-bold">Gestor</span>
              </button>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span className="text-[10px] mt-0.5 leading-none">Sair</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Footer */}
      <footer
        className={`mt-auto border-t border-slate-800/80 bg-slate-950/80 py-5 text-center text-xs text-slate-500 transition-all duration-300 ${
          isGestor ? (isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72') : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-bold text-slate-300">Liga DPO do Armazém</span>
            <span className="text-slate-600">•</span>
            <span>4 Cargos • 15 Colaboradores • 60 Metas • Teto: 6.0 Pontos</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>{parameters.temporadaAtiva}</span>
            <span>•</span>
            <span>Desempates: 1º Relatos de Anomalia • 2º 5S em mais de uma área</span>
          </div>
        </div>
      </footer>

      {/* MODAL: Sininho de Notificação (Para 5S e Relatos Aprovados/Reprovados) */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onNavigateToTab={(tab) => setActiveTab(tab)}
        isGestor={isGestor}
      />

      {/* MODAL: Autenticação Segura & Troca de Perfil */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
      />

      {/* MODAL: Desbloquear Modo Gestor com PIN */}
      {isGestorPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Lock className="w-4 h-4 shrink-0" />
                </div>
                <h3 className="text-sm font-black text-white">Desbloqueio de Acesso Gestor</h3>
              </div>
              <button
                onClick={() => setIsGestorPinModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              O acesso de Gestor concede a barra lateral completa para pontuações, aprovações de 5S
              e relatos, relatórios e auditorias. Digite o PIN de segurança para continuar:
            </p>

            {gestorPinError && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold">
                {gestorPinError}
              </div>
            )}

            <form onSubmit={handleConfirmGestorPin} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="PIN do Gestor (Ex: 1234)"
                  value={gestorPinInput}
                  onChange={(e) => setGestorPinInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white text-center font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-amber-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGestorPinModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20"
                >
                  Confirmar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detalhes Completos do Colaborador */}
      <CollaboratorDetailModal
        isOpen={!!selectedCollaboratorDetail}
        onClose={() => setSelectedCollaboratorDetail(null)}
        entry={selectedCollaboratorDetail}
        dailyRecord={
          selectedCollaboratorDetail
            ? dailyRecords.find(
                (r) =>
                  r.userId === selectedCollaboratorDetail.userId &&
                  r.date === todayDateStr
              ) || null
            : null
        }
        canEdit={isGestor}
        onOpenEditMetas={(user) => setEditingUserDaily(user)}
      />

      {/* MODAL: Lançamento / Edição de Metas Diárias pelo Supervisor */}
      <EditDailyRecordModal
        isOpen={!!editingUserDaily}
        onClose={() => setEditingUserDaily(null)}
        user={editingUserDaily}
        existingRecord={
          editingUserDaily
            ? dailyRecords.find(
                (r) => r.userId === editingUserDaily.id && r.date === todayDateStr
              ) || null
            : null
        }
        onRecordSaved={reloadAllData}
      />

      {/* MODAL: Histórico Anual por Meses */}
      {currentUser && (
        <MonthlyHistoryModal
          isOpen={isMonthlyHistoryOpen}
          onClose={() => setIsMonthlyHistoryOpen(false)}
          user={currentUser}
          onOpenCritiqueForDate={(targetDate) => {
            setCritiquePreselectedDate(targetDate);
            setIsCritiquesModalOpen(true);
          }}
        />
      )}

      {/* MODAL: Solicitação de Crítica & Contestação de Pontos */}
      <CritiquesModal
        isOpen={isCritiquesModalOpen}
        onClose={() => setIsCritiquesModalOpen(false)}
        currentUser={currentUser}
        preselectedDate={critiquePreselectedDate}
        onCritiqueUpdated={reloadAllData}
        isSupervisorMode={isGestor}
      />

      {/* MODAL: Integração WMS / ERP & Sincronização */}
      <WmsIntegrationModal
        isOpen={isWmsModalOpen}
        onClose={() => setIsWmsModalOpen(false)}
        onDataImported={reloadAllData}
      />
    </div>
  );
}
