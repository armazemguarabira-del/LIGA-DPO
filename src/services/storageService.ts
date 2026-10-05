import {
  User,
  MetaItem,
  DailyRecord,
  FiveSSubmission,
  SafetyAnomalyReport,
  CritiqueRequest,
  DPOParameters,
  RankingEntry,
  JobRole,
  LigaImportSchema,
  ROLE_LABELS,
  MONTHS_OF_YEAR,
  DPONotification,
} from '../types/dpo';
import {
  INITIAL_USERS,
  INITIAL_DAILY_RECORDS,
  INITIAL_FIVE_S,
  INITIAL_CRITIQUES,
  INITIAL_PARAMETERS,
} from '../data/initialData';
import { realtimeService } from './realtimeService';
import { firebaseService } from './firebaseService';

const KEYS = {
  USERS: 'dpo_warehouse_users_v5_clean',
  DAILY_RECORDS: 'dpo_warehouse_daily_records_v5_clean',
  FIVE_S: 'dpo_warehouse_five_s_v5_clean',
  SAFETY_REPORTS: 'dpo_warehouse_safety_reports_v5_clean',
  CRITIQUES: 'dpo_warehouse_critiques_v5_clean',
  PARAMETERS: 'dpo_warehouse_params_v5_clean',
  CURRENT_USER_ID: 'dpo_warehouse_current_user_v5_clean',
  ACTIVE_ACCESS_LEVEL: 'dpo_warehouse_access_level_v5_clean',
  NOTIFICATIONS: 'dpo_warehouse_notifications_v5_clean',
};

export const GESTOR_USER: User = {
  id: 'u-g1002',
  matricula: 'G1002',
  pin: '!Liz1105',
  name: 'Gestor DPO Armazém',
  role: 'conferente',
  roleTitle: 'Gestor Geral do Armazém',
  accessLevel: 'gerente',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  status: 'ativo',
  pontuacaoMaxima: 6,
  metas: [
    { ordem: 1, descricao: 'Gestão de Produtividade', pontos: 2, categoria: 'eficiencia' },
    { ordem: 2, descricao: 'Acuracidade de Inventário', pontos: 2, categoria: 'qualidade' },
    { ordem: 3, descricao: 'Relatos e Segurança', pontos: 1, categoria: 'seguranca' },
    { ordem: 4, descricao: 'Auditoria 5S Geral', pontos: 1, categoria: '5s' },
  ],
};

// Base zerada para relatos de anomalia (começando do zero absoluto)
const INITIAL_SAFETY_REPORTS: SafetyAnomalyReport[] = [];

// Base zerada para notificações da central
const INITIAL_NOTIFICATIONS: DPONotification[] = [];

// Safe JSON loader
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

export const storageService = {
  // Real-time synchronization listeners
  subscribers: new Set<() => void>(),
  isSyncing: false,
  isApplyingRemote: false,
  isNotifyingListeners: false,
  hasInitialized: false,
  pushDebounceTimer: null as any,

  subscribe(cb: () => void): () => void {
    this.subscribers.add(cb);
    return () => {
      this.subscribers.delete(cb);
    };
  },

  notifyListeners(): void {
    if (this.isNotifyingListeners) return;
    this.isNotifyingListeners = true;
    try {
      this.subscribers.forEach((cb) => {
        try {
          cb();
        } catch (err) {
          console.error('Error notifying storage subscriber:', err);
        }
      });
    } finally {
      this.isNotifyingListeners = false;
    }
  },

  getFullDatabaseState() {
    const rawUsers = loadFromStorage<User[]>(KEYS.USERS, INITIAL_USERS);
    const rawDaily = loadFromStorage<DailyRecord[]>(KEYS.DAILY_RECORDS, []);
    const rawFiveS = loadFromStorage<FiveSSubmission[]>(KEYS.FIVE_S, INITIAL_FIVE_S);
    const rawSafety = loadFromStorage<SafetyAnomalyReport[]>(KEYS.SAFETY_REPORTS, INITIAL_SAFETY_REPORTS);
    const rawCritiques = loadFromStorage<CritiqueRequest[]>(KEYS.CRITIQUES, INITIAL_CRITIQUES);
    const rawParams = loadFromStorage<DPOParameters>(KEYS.PARAMETERS, INITIAL_PARAMETERS);
    const rawNotifs = loadFromStorage<DPONotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);

    return {
      users: rawUsers && rawUsers.length > 0 ? rawUsers : INITIAL_USERS,
      dailyRecords: rawDaily || [],
      fiveSSubmissions: rawFiveS && rawFiveS.length > 0 ? rawFiveS : INITIAL_FIVE_S,
      safetyReports: rawSafety && rawSafety.length > 0 ? rawSafety : INITIAL_SAFETY_REPORTS,
      critiques: rawCritiques && rawCritiques.length > 0 ? rawCritiques : INITIAL_CRITIQUES,
      parameters: rawParams || INITIAL_PARAMETERS,
      notifications: rawNotifs && rawNotifs.length > 0 ? rawNotifs : INITIAL_NOTIFICATIONS,
      updatedAt: new Date().toISOString(),
    };
  },

  applyRemoteSync(payload: any): void {
    if (!payload || typeof payload !== 'object' || this.isApplyingRemote) return;
    this.isApplyingRemote = true;
    this.isSyncing = true;
    try {
      if (Array.isArray(payload.users) && payload.users.length > 0) saveToStorage(KEYS.USERS, payload.users);
      if (Array.isArray(payload.dailyRecords)) saveToStorage(KEYS.DAILY_RECORDS, payload.dailyRecords);
      if (Array.isArray(payload.fiveSSubmissions)) saveToStorage(KEYS.FIVE_S, payload.fiveSSubmissions);
      if (Array.isArray(payload.safetyReports)) saveToStorage(KEYS.SAFETY_REPORTS, payload.safetyReports);
      if (Array.isArray(payload.critiques)) saveToStorage(KEYS.CRITIQUES, payload.critiques);
      if (Array.isArray(payload.notifications)) saveToStorage(KEYS.NOTIFICATIONS, payload.notifications);
      if (payload.parameters) saveToStorage(KEYS.PARAMETERS, payload.parameters);
    } finally {
      this.isApplyingRemote = false;
      this.isSyncing = false;
    }

    // Defer listener notifications out of the current call stack
    setTimeout(() => {
      this.notifyListeners();
    }, 0);
  },

  broadcastChange(reason = 'Dados atualizados em tempo real'): void {
    if (this.isSyncing || this.isApplyingRemote) return;
    this.notifyListeners();
    if (typeof window !== 'undefined') {
      if (this.pushDebounceTimer) {
        clearTimeout(this.pushDebounceTimer);
      }
      this.pushDebounceTimer = setTimeout(() => {
        this.pushDebounceTimer = null;
        const fullState = this.getFullDatabaseState();
        realtimeService.pushDatabase(fullState, reason);

        // Cloud sync to Firebase Firestore
        try {
          if (Array.isArray(fullState.dailyRecords)) {
            fullState.dailyRecords.slice(0, 50).forEach((rec) => firebaseService.syncDailyRecord(rec));
          }
          if (Array.isArray(fullState.users)) {
            fullState.users.forEach((u) => firebaseService.syncUser(u));
          }
          if (Array.isArray(fullState.fiveSSubmissions)) {
            fullState.fiveSSubmissions.slice(0, 20).forEach((s) => firebaseService.syncFiveS(s));
          }
          if (Array.isArray(fullState.safetyReports)) {
            fullState.safetyReports.slice(0, 20).forEach((r) => firebaseService.syncSafetyReport(r));
          }
          if (Array.isArray(fullState.notifications)) {
            fullState.notifications.slice(0, 20).forEach((n) => firebaseService.syncNotification(n));
          }
        } catch (fbErr) {
          console.warn('Firebase async sync notice:', fbErr);
        }
      }, 200);
    }
  },

  async uploadPhoto(imageBase64: string, prefix = 'photo'): Promise<string> {
    return await realtimeService.uploadPhoto(imageBase64, prefix);
  },

  resetAllDataToZero(): void {
    const cleanUsers = INITIAL_USERS.map((u) => ({
      ...u,
      desqualificado: false,
      motivoDesqualificacao: undefined,
      dataDesqualificacao: undefined,
      desqualificadoPor: undefined,
    }));
    saveToStorage(KEYS.USERS, cleanUsers);
    saveToStorage(KEYS.DAILY_RECORDS, []);
    saveToStorage(KEYS.FIVE_S, []);
    saveToStorage(KEYS.SAFETY_REPORTS, []);
    saveToStorage(KEYS.CRITIQUES, []);
    saveToStorage(KEYS.NOTIFICATIONS, []);
    saveToStorage(KEYS.PARAMETERS, INITIAL_PARAMETERS);

    // Limpar quaisquer chaves antigas de mock do localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        ['v1', 'v2', 'v3', 'v4'].forEach((v) => {
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith('dpo_warehouse_') && k.includes(`_${v}`)) {
              localStorage.removeItem(k);
            }
          });
        });
      }
    } catch (e) {}

    // Notificar ouvintes e sincronizar com WebSocket e Firebase
    this.broadcastChange('Início do ciclo: todos os dados zerados para operação real');
  },

  init(): void {
    if (typeof window === 'undefined' || this.hasInitialized) return;
    this.hasInitialized = true;

    // Limpeza preventiva de chaves com dados inventados/antigos
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        ['v1', 'v2', 'v3', 'v4'].forEach((v) => {
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith('dpo_warehouse_') && k.includes(`_${v}`)) {
              localStorage.removeItem(k);
            }
          });
        });
      }
    } catch (e) {}

    // 1. WebSocket local/server sync (dev fallback)
    realtimeService.subscribe((event) => {
      if (event.type === 'INITIAL_SYNC') {
        if (event.payload && typeof event.payload === 'object' && Object.keys(event.payload).length > 0) {
          this.applyRemoteSync(event.payload);
        } else {
          realtimeService.pushDatabase(this.getFullDatabaseState(), 'Inicialização do banco DPO zerado');
        }
      } else if (event.type === 'DATABASE_UPDATED' && event.payload?.data) {
        this.applyRemoteSync(event.payload.data);
      }
    });

    realtimeService.pullDatabase().then((serverData) => {
      if (serverData && typeof serverData === 'object' && Object.keys(serverData).length > 0) {
        this.applyRemoteSync(serverData);
      } else {
        realtimeService.pushDatabase(this.getFullDatabaseState(), 'Carga inicial DPO zerada');
      }
    });

    // 2. Firebase Cloud Realtime Sync (Works on GitHub Pages, mobile and desktop)
    firebaseService.initRealtimeCloudSync({
      onUsersUpdate: (cloudUsers) => {
        if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
          const localUsers = this.getUsers();
          const userMap = new Map<string, User>();
          localUsers.forEach((u) => userMap.set(u.id || u.matricula, u));

          cloudUsers.forEach((cu) => {
            const key = cu.id || cu.matricula;
            const existing = userMap.get(key) || userMap.get(cu.matricula);
            if (existing) {
              userMap.set(key, {
                ...existing,
                ...cu,
                // Ensure uploaded avatar is preserved
                avatar: cu.avatar || existing.avatar,
                metas: cu.metas && cu.metas.length === 4 ? cu.metas : existing.metas,
              });
            } else {
              userMap.set(key, cu);
            }
          });

          const merged = Array.from(userMap.values());
          saveToStorage(KEYS.USERS, merged);
          this.notifyListeners();
        }
      },
      onDailyRecordsUpdate: (records) => {
        if (Array.isArray(records)) {
          saveToStorage(KEYS.DAILY_RECORDS, records);
          this.notifyListeners();
        }
      },
      onParametersUpdate: (params) => {
        if (params) {
          saveToStorage(KEYS.PARAMETERS, params);
          this.notifyListeners();
        }
      },
      onFiveSUpdate: (submissions) => {
        if (Array.isArray(submissions)) {
          saveToStorage(KEYS.FIVE_S, submissions);
          this.notifyListeners();
        }
      },
      onSafetyReportsUpdate: (reports) => {
        if (Array.isArray(reports)) {
          saveToStorage(KEYS.SAFETY_REPORTS, reports);
          this.notifyListeners();
        }
      },
      onCritiquesUpdate: (critiques) => {
        if (Array.isArray(critiques)) {
          saveToStorage(KEYS.CRITIQUES, critiques);
          this.notifyListeners();
        }
      },
      onNotificationsUpdate: (notifs) => {
        if (Array.isArray(notifs)) {
          saveToStorage(KEYS.NOTIFICATIONS, notifs);
          this.notifyListeners();
        }
      },
    });

    // Seed cloud Firestore if empty so visitors on GitHub Pages load the official data
    firebaseService.seedCloudIfEmpty(INITIAL_USERS, INITIAL_PARAMETERS);
  },

  // ================= USERS =================
  getUsers(): User[] {
    const stored = loadFromStorage<User[]>(KEYS.USERS, []);
    if (!stored || stored.length === 0) {
      saveToStorage(KEYS.USERS, INITIAL_USERS);
      return INITIAL_USERS;
    }

    const userMap = new Map<string, User>();
    stored.forEach((u) => userMap.set(u.matricula, u));

    let modified = false;
    INITIAL_USERS.forEach((initUser) => {
      if (userMap.has(initUser.matricula)) {
        const existing = userMap.get(initUser.matricula)!;
        if (!existing.metas || existing.metas.length === 0) {
          userMap.set(initUser.matricula, {
            ...existing,
            metas: initUser.metas,
            pontuacaoMaxima: 6,
          });
          modified = true;
        }
      } else {
        userMap.set(initUser.matricula, initUser);
        modified = true;
      }
    });

    const merged = Array.from(userMap.values());
    if (modified) {
      saveToStorage(KEYS.USERS, merged);
    }
    return merged;
  },

  setUsers(users: User[]): void {
    saveToStorage(KEYS.USERS, users);
    this.broadcastChange('Usuários atualizados');
  },

  saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id || u.matricula === user.matricula);

    const sanitizedUser: User = {
      ...user,
      pontuacaoMaxima: 6,
      roleTitle: ROLE_LABELS[user.role] || user.roleTitle,
    };

    if (index >= 0) {
      users[index] = sanitizedUser;
    } else {
      users.push(sanitizedUser);
    }
    this.setUsers(users);
    // Instant sync to Cloud Firestore
    firebaseService.syncUser(sanitizedUser);
  },

  deleteUser(userId: string): void {
    const users = this.getUsers().filter((u) => u.id !== userId);
    this.setUsers(users);
    // Instant delete from Cloud Firestore
    firebaseService.deleteUser(userId);
  },

  // ================= DESQUALIFICAÇÃO DE COLABORADOR (EXCLUSIVO GESTOR) =================
  disqualifyUser(userId: string, motivo: string, gestorName: string = 'Gestor DPO'): boolean {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return false;

    user.desqualificado = true;
    user.motivoDesqualificacao = motivo.trim();
    user.dataDesqualificacao = new Date().toISOString().replace('T', ' ').substring(0, 16);
    user.desqualificadoPor = gestorName;
    this.setUsers(users);

    // Enviar notificação direta para o colaborador
    this.addNotification({
      id: `notif-dq-${user.id}-${Date.now()}`,
      userId: user.id,
      type: 'colaborador_desqualificado',
      title: 'Aviso: Status Alterado para Desqualificado ⚠️',
      message: `Você foi desqualificado da Liga DPO pelo Gestor (${gestorName}). Motivo: "${motivo}". Suas metas continuam pontuando normalmente, mas sua colocação foi transferida para a última posição da tabela.`,
      date: new Date().toISOString().substring(0, 10),
      timestamp: 'Hoje',
      read: false,
    });

    // Notificação para o histórico do Gestor
    this.addNotification({
      id: `notif-dq-gestor-${user.id}-${Date.now()}`,
      userId: 'gestor',
      type: 'colaborador_desqualificado',
      title: `Colaborador Desqualificado: ${user.name} (${user.matricula})`,
      message: `Desqualificação aplicada por ${gestorName}. Motivo: "${motivo}". Colaborador movido para o último lugar do ranking.`,
      date: new Date().toISOString().substring(0, 10),
      timestamp: 'Hoje',
      read: false,
      authorName: user.name,
    });

    return true;
  },

  requalifyUser(userId: string, gestorName: string = 'Gestor DPO'): boolean {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return false;

    user.desqualificado = false;
    user.motivoDesqualificacao = undefined;
    user.dataDesqualificacao = undefined;
    user.desqualificadoPor = undefined;
    this.setUsers(users);

    // Notificação direta para o colaborador
    this.addNotification({
      id: `notif-req-${user.id}-${Date.now()}`,
      userId: user.id,
      type: 'colaborador_requalificado',
      title: 'Sua Qualificação na Liga DPO foi Restaurada! 🎯✨',
      message: `Sua desqualificação anterior foi revogada pelo Gestor (${gestorName}). Sua posição no ranking voltou a ser calculada com base na sua pontuação integral!`,
      date: new Date().toISOString().substring(0, 10),
      timestamp: 'Hoje',
      read: false,
    });

    // Notificação para o Gestor
    this.addNotification({
      id: `notif-req-gestor-${user.id}-${Date.now()}`,
      userId: 'gestor',
      type: 'colaborador_requalificado',
      title: `Qualificação Restaurada: ${user.name} (${user.matricula})`,
      message: `Desqualificação cancelada por ${gestorName}. Posição recalculada na tabela geral e por cargo.`,
      date: new Date().toISOString().substring(0, 10),
      timestamp: 'Hoje',
      read: false,
      authorName: user.name,
    });

    return true;
  },

  // ================= ACCESS LEVELS & GESTOR AUTH =================
  getActiveAccessLevel(): 'participante' | 'gestor' {
    return loadFromStorage<'participante' | 'gestor'>(KEYS.ACTIVE_ACCESS_LEVEL, 'participante');
  },

  setActiveAccessLevel(level: 'participante' | 'gestor'): void {
    saveToStorage(KEYS.ACTIVE_ACCESS_LEVEL, level);
  },

  validateGestorPin(pin: string): boolean {
    return pin === '1234' || pin === '9999' || pin === 'admin';
  },

  // ================= REPLICATE METAS BY CARGO =================
  replicateMetasToCargo(role: JobRole, metas: MetaItem[]): void {
    const users = this.getUsers();
    let updated = false;

    users.forEach((u) => {
      if (u.role === role) {
        u.metas = JSON.parse(JSON.stringify(metas));
        u.pontuacaoMaxima = 6;
        updated = true;
      }
    });

    if (updated) {
      this.setUsers(users);
    }
  },

  // ================= PARAMETERS =================
  getParameters(): DPOParameters {
    const params = loadFromStorage<DPOParameters>(KEYS.PARAMETERS, INITIAL_PARAMETERS);
    return params || INITIAL_PARAMETERS;
  },

  updateParameters(params: DPOParameters): void {
    saveToStorage(KEYS.PARAMETERS, params);
    this.broadcastChange('Parâmetros da Liga DPO atualizados');
  },

  // ================= DAILY RECORDS =================
  getDailyRecords(): DailyRecord[] {
    const records = loadFromStorage<DailyRecord[]>(KEYS.DAILY_RECORDS, []);
    return records || [];
  },

  setDailyRecords(records: DailyRecord[]): void {
    saveToStorage(KEYS.DAILY_RECORDS, records);
    this.broadcastChange('Metas e pontuações diárias atualizadas');
  },

  getDailyRecordsForUser(userId: string): DailyRecord[] {
    return this.getDailyRecords().filter((r) => r.userId === userId);
  },

  getDailyRecordsForUserAndMonth(userId: string, month: number, year: number = 2026): DailyRecord[] {
    return this.getDailyRecords().filter(
      (r) => r.userId === userId && r.month === month && r.year === year
    );
  },

  getDailyRecord(userId: string, date: string): DailyRecord | null {
    const records = this.getDailyRecords();
    return records.find((r) => r.userId === userId && r.date === date) || null;
  },

  saveDailyRecord(record: DailyRecord): void {
    const records = this.getDailyRecords();
    const existingIndex = records.findIndex(
      (r) => r.userId === record.userId && r.date === record.date
    );
    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.unshift(record);
    }
    this.setDailyRecords(records);
    // Instant sync to Cloud Firestore
    firebaseService.syncDailyRecord(record);
  },

  deleteDailyRecord(recordId: string): void {
    const records = this.getDailyRecords().filter((r) => r.id !== recordId);
    this.setDailyRecords(records);
    firebaseService.deleteDailyRecord(recordId);
  },

  // Quick helper to toggle a single meta for a user on a given date
  toggleMetaStatus(userId: string, date: string, metaOrdem: number, achieved: boolean): DailyRecord {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    let record = this.getDailyRecord(userId, date);

    const [y, m] = date.split('-').map(Number);

    if (!record) {
      record = {
        id: `rec-${userId}-${date}`,
        userId,
        date,
        month: m || 9,
        year: y || 2026,
        metaStatus: { 1: false, 2: false, 3: false, 4: false },
        calculatedScore: 0,
      };
    }

    const updatedMetaStatus = { ...record.metaStatus, [metaOrdem]: achieved };

    let newScore = 0;
    if (user && user.metas) {
      user.metas.forEach((m) => {
        if (updatedMetaStatus[m.ordem]) {
          newScore += m.pontos;
        }
      });
    }

    const updatedRecord: DailyRecord = {
      ...record,
      metaStatus: updatedMetaStatus,
      calculatedScore: Math.min(6, newScore),
      fiveSApproved: metaOrdem === 4 ? achieved : record.fiveSApproved,
    };

    this.saveDailyRecord(updatedRecord);
    return updatedRecord;
  },

  // Bulk update all 4 metas for a collaborator on a given date (from supervisor guide)
  setAllMetasStatus(userId: string, date: string, metaStatus: Record<number, boolean>): DailyRecord {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    let record = this.getDailyRecord(userId, date);

    const [y, m] = date.split('-').map(Number);

    if (!record) {
      record = {
        id: `rec-${userId}-${date}`,
        userId,
        date,
        month: m || 9,
        year: y || 2026,
        metaStatus,
        calculatedScore: 0,
      };
    }

    let newScore = 0;
    if (user && user.metas) {
      user.metas.forEach((m) => {
        if (metaStatus[m.ordem]) {
          newScore += m.pontos;
        }
      });
    }

    const updatedRecord: DailyRecord = {
      ...record,
      metaStatus,
      calculatedScore: Math.min(6, newScore),
      fiveSApproved: metaStatus[4] ?? record.fiveSApproved,
    };

    this.saveDailyRecord(updatedRecord);
    return updatedRecord;
  },

  // ================= NOTIFICATIONS =================
  getNotifications(): DPONotification[] {
    const notifs = loadFromStorage<DPONotification[]>(KEYS.NOTIFICATIONS, []);
    if (!notifs || notifs.length === 0) {
      saveToStorage(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
      return INITIAL_NOTIFICATIONS;
    }
    return notifs;
  },

  setNotifications(notifications: DPONotification[]): void {
    saveToStorage(KEYS.NOTIFICATIONS, notifications);
    this.broadcastChange('Notificações atualizadas');
  },

  getNotificationsForUser(userId: string, isGestor: boolean): DPONotification[] {
    const all = this.getNotifications();
    if (isGestor) {
      // Gestors see both their direct notifications, system alerts, and any pending items
      return all.filter((n) => n.userId === 'gestor' || n.userId === userId);
    }
    return all.filter((n) => n.userId === userId);
  },

  addNotification(notif: DPONotification): void {
    const notifs = this.getNotifications();
    notifs.unshift(notif);
    this.setNotifications(notifs);
  },

  markNotificationRead(notificationId: string): void {
    const notifs = this.getNotifications();
    const item = notifs.find((n) => n.id === notificationId);
    if (item) {
      item.read = true;
      this.setNotifications(notifs);
    }
  },

  markAllNotificationsRead(userId: string, isGestor: boolean): void {
    const notifs = this.getNotifications();
    notifs.forEach((n) => {
      if (isGestor && (n.userId === 'gestor' || n.userId === userId)) {
        n.read = true;
      } else if (n.userId === userId) {
        n.read = true;
      }
    });
    this.setNotifications(notifs);
  },

  deleteNotification(notificationId: string): void {
    const notifs = this.getNotifications();
    const updated = notifs.filter((n) => n.id !== notificationId);
    this.setNotifications(updated);
    this.broadcastChange('Notificação analisada e removida');
  },

  clearAllNotifications(userId: string, isGestor: boolean): void {
    const notifs = this.getNotifications();
    const remaining = notifs.filter((n) => {
      if (isGestor && (n.userId === 'gestor' || n.userId === userId)) return false;
      if (n.userId === userId) return false;
      return true;
    });
    this.setNotifications(remaining);
    this.broadcastChange('Todas as notificações foram analisadas e limpas');
  },

  // ================= 5S AUDITS & EXTRA AREAS =================
  getFiveSSubmissions(): FiveSSubmission[] {
    const submissions = loadFromStorage<FiveSSubmission[]>(KEYS.FIVE_S, []);
    if (!submissions || submissions.length === 0) {
      saveToStorage(KEYS.FIVE_S, INITIAL_FIVE_S);
      return INITIAL_FIVE_S;
    }
    return submissions;
  },

  setFiveSSubmissions(submissions: FiveSSubmission[]): void {
    saveToStorage(KEYS.FIVE_S, submissions);
    this.broadcastChange('Auditorias 5S atualizadas');
  },

  addFiveSSubmission(submission: FiveSSubmission): void {
    const submissions = this.getFiveSSubmissions();
    submissions.unshift(submission);
    this.setFiveSSubmissions(submissions);

    // If already approved (e.g. batch Cicero or supervisor direct), mark meta
    if (submission.status === 'aprovado') {
      this.toggleMetaStatus(submission.userId, submission.date, 4, true);
    } else {
      // Create notification for Gestor that a new 5S needs approval
      this.addNotification({
        id: `notif-5s-pending-${Date.now()}`,
        userId: 'gestor',
        type: 'pending_review',
        title: 'Nova Auditoria 5S Aguardando Validação 📸',
        message: `${submission.userName} enviou auditoria 5S com foto no setor "${submission.sector}".`,
        date: submission.date,
        timestamp: 'Agora há pouco',
        read: false,
        authorName: submission.userName,
        sector: submission.sector,
        photoUrl: submission.photoUrl,
        relatedId: submission.id,
      });
    }
  },

  hasApprovedFiveS(userId: string, date: string): boolean {
    const subs = this.getFiveSSubmissions();
    const hasDirect = subs.some(
      (s) =>
        s.userId === userId &&
        s.date === date &&
        s.status === 'aprovado'
    );
    if (hasDirect) return true;

    // REGRA DPO: Eldenkleber, Luis, Natanael, Dimas, Admilton e Edilson são validados pela foto de Cícero
    const teamMatriculas = ['G1128', 'G1147', 'G1125', 'G1161', 'G1160', 'G1154'];
    const user = this.getUsers().find((u) => u.id === userId);
    if (user && teamMatriculas.includes(user.matricula)) {
      const cicero = this.getUsers().find(
        (u) => u.matricula === 'G1121' || u.name.toLowerCase().includes('cicero')
      );
      if (cicero) {
        return subs.some(
          (s) =>
            s.userId === cicero.id &&
            s.date === date &&
            s.status === 'aprovado'
        );
      }
    }

    return false;
  },

  hasApprovedSafetyReport(userId: string, date: string): boolean {
    const reports = this.getSafetyReports();
    return reports.some(
      (r) =>
        r.userId === userId &&
        r.date === date &&
        r.status === 'aprovado'
    );
  },

  resetDailyScoresForDate(date: string): void {
    const users = this.getUsers().filter((u) => u.status === 'ativo' && u.matricula !== 'G1002');
    const records = this.getDailyRecords();
    const [y, m] = date.split('-').map(Number);

    users.forEach((u) => {
      const idx = records.findIndex((r) => r.userId === u.id && r.date === date);
      const emptyRec: DailyRecord = {
        id: `rec-${u.id}-${date}`,
        userId: u.id,
        date,
        month: m || 9,
        year: y || 2026,
        metaStatus: { 1: false, 2: false, 3: false, 4: false },
        calculatedScore: 0,
        fiveSApproved: false,
      };
      if (idx >= 0) {
        records[idx] = emptyRec;
      } else {
        records.unshift(emptyRec);
      }
    });

    this.setDailyRecords(records);
  },

  batchScoreAllForDate(date: string): { affectedCount: number; pendingAuditsCount: number } {
    const users = this.getUsers().filter((u) => u.status === 'ativo' && u.matricula !== 'G1002');
    const records = this.getDailyRecords();
    const [y, m] = date.split('-').map(Number);
    let pendingAuditsCount = 0;

    users.forEach((u) => {
      const idx = records.findIndex((r) => r.userId === u.id && r.date === date);
      let calculatedScore = 0;
      const metaStatus: Record<number, boolean> = {};
      const has5S = this.hasApprovedFiveS(u.id, date);
      const hasSafety = this.hasApprovedSafetyReport(u.id, date);

      u.metas.forEach((m) => {
        const is5S = m.categoria === '5s' || m.descricao.toLowerCase().includes('5s');
        const isSafety =
          m.categoria === 'seguranca' ||
          m.descricao.toLowerCase().includes('relato') ||
          m.descricao.toLowerCase().includes('anomalia') ||
          m.descricao.toLowerCase().includes('segurança');

        if (is5S) {
          metaStatus[m.ordem] = has5S;
          if (has5S) {
            calculatedScore += m.pontos;
          } else {
            pendingAuditsCount++;
          }
        } else if (isSafety) {
          metaStatus[m.ordem] = hasSafety;
          if (hasSafety) {
            calculatedScore += m.pontos;
          } else {
            pendingAuditsCount++;
          }
        } else {
          // Metas de produtividade, eficiência e qualidade são batidas pelo supervisor
          metaStatus[m.ordem] = true;
          calculatedScore += m.pontos;
        }
      });

      const fullRec: DailyRecord = {
        id: `rec-${u.id}-${date}`,
        userId: u.id,
        date,
        month: m || 9,
        year: y || 2026,
        metaStatus,
        calculatedScore: Math.min(6, calculatedScore),
        fiveSApproved: has5S,
      };

      if (idx >= 0) {
        records[idx] = fullRec;
      } else {
        records.unshift(fullRec);
      }
    });

    this.setDailyRecords(records);
    return { affectedCount: users.length, pendingAuditsCount };
  },

  validateFiveSSubmission(
    submissionId: string,
    status: 'aprovado' | 'rejeitado',
    supervisorName: string,
    points: number,
    feedback?: string
  ): void {
    const submissions = this.getFiveSSubmissions();
    const sub = submissions.find((s) => s.id === submissionId);
    if (sub) {
      sub.status = status;
      sub.pointsAwarded = status === 'aprovado' ? points : 0;
      sub.evaluatedBy = supervisorName;
      sub.evaluatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      sub.feedback = feedback || (status === 'aprovado' ? 'Auditoria 5S Aprovada (+pontos computados).' : 'Reprovado.');

      if (status === 'aprovado') {
        this.toggleMetaStatus(sub.userId, sub.date, 4, true);
        // Create notification for the collaborator!
        this.addNotification({
          id: `notif-5s-${sub.id}-${Date.now()}`,
          userId: sub.userId,
          type: '5s_approved',
          title: 'Auditoria 5S Aprovada pelo Gestor! 📸✨',
          message: `Sua auditoria no setor "${sub.sector}" foi validada por ${supervisorName}. Meta 4 computada (+${points} pt)!`,
          pointsAwarded: points,
          date: sub.date,
          timestamp: 'Agora há pouco',
          read: false,
          photoUrl: sub.photoUrl,
          sector: sub.sector,
          relatedId: sub.id,
        });

        // =========================================================================
        // REGRA OFICIAL DPO: O 5S dos colaboradores Eldenkleber, Luis, Natanael,
        // Dimas, Admilton e Edilson são validados através da foto do colaborador CÍCERO.
        // Se auditada e validada, o 5S desses colaboradores é preenchido automaticamente!
        // =========================================================================
        const isCicero =
          sub.userId === 'u-g1121' ||
          sub.userName.toLowerCase().includes('cicero') ||
          sub.userName.toLowerCase().includes('cícero');

        if (isCicero) {
          const teamMatriculas = ['G1128', 'G1147', 'G1125', 'G1161', 'G1160', 'G1154'];
          const allUsers = this.getUsers();
          const teamUsers = allUsers.filter((u) => teamMatriculas.includes(u.matricula));

          teamUsers.forEach((teamUser) => {
            // 1. Criar ou atualizar submissão de 5S da equipe vinculada à foto de Cícero
            const existingTeamSub = submissions.find(
              (s) => s.userId === teamUser.id && s.date === sub.date
            );

            if (existingTeamSub) {
              existingTeamSub.status = 'aprovado';
              existingTeamSub.pointsAwarded = 1;
              existingTeamSub.photoUrl = sub.photoUrl;
              existingTeamSub.evaluatedBy = `${supervisorName} (via Foto Cícero)`;
              existingTeamSub.evaluatedAt = sub.evaluatedAt;
              existingTeamSub.importedByConferente = 'Cicero (Conferente)';
              existingTeamSub.feedback = 'Validado automaticamente através da foto de 5S auditada do Conferente Cícero.';
            } else {
              const teamSub: FiveSSubmission = {
                id: `5s-cicero-auto-${teamUser.id}-${Date.now()}`,
                userId: teamUser.id,
                userName: teamUser.name,
                userRole: teamUser.role,
                date: sub.date,
                sector: sub.sector || 'Armazém / 5S Equipe Cícero',
                photoUrl: sub.photoUrl,
                seiri: true,
                seiton: true,
                seiso: true,
                seiketsu: true,
                shitsuke: true,
                notes: `5S da equipe validado automaticamente através da auditoria de foto do Conferente Cícero.`,
                status: 'aprovado',
                pointsAwarded: 1,
                evaluatedBy: `${supervisorName} (via Foto Cícero)`,
                evaluatedAt: sub.evaluatedAt,
                importedByConferente: 'Cicero (Conferente)',
                feedback: 'Validado automaticamente através da foto de 5S auditada do Conferente Cícero.',
              };
              submissions.push(teamSub);
            }

            // 2. Preencher e pontuar automaticamente a meta 4 (5S Armazém) do colaborador
            const meta5s = teamUser.metas.find(
              (m) => m.categoria === '5s' || m.descricao.toLowerCase().includes('5s')
            );
            const metaOrdem = meta5s ? meta5s.ordem : 4;
            this.toggleMetaStatus(teamUser.id, sub.date, metaOrdem, true);

            // 3. Notificar o colaborador
            this.addNotification({
              id: `notif-5s-cicero-colab-${teamUser.id}-${Date.now()}`,
              userId: teamUser.id,
              type: '5s_approved',
              title: '5S Validado via Foto do Cícero! 📸✨',
              message: `A foto do 5S enviada por Cícero foi auditada e aprovada por ${supervisorName}. Sua meta de 5S foi preenchida e pontuada automaticamente (+1 pt)!`,
              pointsAwarded: 1,
              date: sub.date,
              timestamp: 'Agora há pouco',
              read: false,
              photoUrl: sub.photoUrl,
              sector: sub.sector,
            });
          });

          // 4. Notificar a gestão da validação em equipe
          this.addNotification({
            id: `notif-5s-cicero-gestor-${Date.now()}`,
            userId: 'gestor',
            type: '5s_approved',
            title: 'Preenchimento Automático 5S Realizado (Equipe Armazém) 📋',
            message: `A aprovação da foto de Cícero validou e preencheu automaticamente o 5S dos 6 colaboradores: Eldenkleber, Luis, Natanael, Dimas, Admilton e Edilson.`,
            date: sub.date,
            timestamp: 'Hoje',
            read: false,
          });
        }
      } else {
        this.addNotification({
          id: `notif-5s-rej-${sub.id}-${Date.now()}`,
          userId: sub.userId,
          type: '5s_rejected',
          title: 'Auditoria 5S Necessita Correção ⚠️',
          message: `Sua auditoria no setor "${sub.sector}" não foi validada por ${supervisorName}. Motivo: ${feedback || 'Não atendeu aos critérios 5S'}.`,
          date: sub.date,
          timestamp: 'Agora há pouco',
          read: false,
          photoUrl: sub.photoUrl,
          sector: sub.sector,
          relatedId: sub.id,
        });
      }

      this.setFiveSSubmissions(submissions);
    }
  },

  // ================= CICERO NIGHT BATCH 5S IMPORT =================
  // Cícero (Conferente) importa o 5S do turno noturno para:
  // Luis, Eldenkleber, Edilson, Natanael, Dimas, Admilton e o Conferente Noturno
  importCiceroNightBatch5S(photoUrl: string, notes: string): { success: boolean; affectedNames: string[] } {
    const targetMatriculas = ['G1147', 'G1128', 'G1154', 'G1125', 'G1161', 'G1160', 'G1121'];
    const users = this.getUsers().filter((u) => targetMatriculas.includes(u.matricula));
    const today = '2026-09-29';

    users.forEach((user) => {
      // 1. Register approved batch 5S
      const submission: FiveSSubmission = {
        id: `5s-cicero-batch-${user.id}-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        date: today,
        sector: 'Armazém Noturno / Fechamento de Turno',
        photoUrl,
        seiri: true,
        seiton: true,
        seiso: true,
        seiketsu: true,
        shitsuke: true,
        notes: `5S Noturno importado pelo Conferente Cícero: ${notes}`,
        status: 'aprovado',
        pointsAwarded: 1,
        evaluatedBy: 'Cicero (Conferente)',
        evaluatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        importedByConferente: 'Cicero (Conferente)',
      };
      this.addFiveSSubmission(submission);

      // 2. Mark Meta 4 as achieved
      this.toggleMetaStatus(user.id, today, 4, true);

      // 3. Notify collaborator
      this.addNotification({
        id: `notif-cicero-${user.id}-${Date.now()}`,
        userId: user.id,
        type: '5s_approved',
        title: '5S Noturno Importado por Cícero (Conferente) 📋',
        message: 'Seu 5S de fechamento de turno foi importado e validado. Meta 4 computada (+1.0 pt)!',
        pointsAwarded: 1,
        date: today,
        timestamp: 'Hoje',
        read: false,
        sector: 'Armazém Noturno',
      });
    });

    return {
      success: true,
      affectedNames: users.map((u) => u.name),
    };
  },

  // ================= SAFETY & ANOMALY REPORTS (RELATOS) =================
  getSafetyReports(): SafetyAnomalyReport[] {
    const reports = loadFromStorage<SafetyAnomalyReport[]>(KEYS.SAFETY_REPORTS, []);
    if (!reports || reports.length === 0) {
      saveToStorage(KEYS.SAFETY_REPORTS, INITIAL_SAFETY_REPORTS);
      return INITIAL_SAFETY_REPORTS;
    }
    return reports;
  },

  setSafetyReports(reports: SafetyAnomalyReport[]): void {
    saveToStorage(KEYS.SAFETY_REPORTS, reports);
    this.broadcastChange('Relatos de anomalia atualizados');
  },

  addSafetyReport(report: SafetyAnomalyReport): void {
    const reports = this.getSafetyReports();
    reports.unshift(report);
    this.setSafetyReports(reports);

    // Relatos precisam ser APROVADOS por um gestor para poderem pontuar!
    // Se foi inserido já com status aprovado (ex: seed), pontua direto:
    if (report.status === 'aprovado') {
      const users = this.getUsers();
      const user = users.find((u) => u.id === report.userId);
      if (user) {
        const hasSafetyMeta = user.metas.find(
          (m) =>
            m.descricao.toLowerCase().includes('relato') ||
            m.descricao.toLowerCase().includes('anomalia') ||
            m.descricao.toLowerCase().includes('segurança')
        );
        if (hasSafetyMeta) {
          this.toggleMetaStatus(user.id, report.date, hasSafetyMeta.ordem, true);
        }
      }
    } else {
      // Create notification for Gestor that a safety report was submitted and is waiting for validation
      this.addNotification({
        id: `notif-safety-pending-${Date.now()}`,
        userId: 'gestor',
        type: 'pending_review',
        title: 'Novo Relato de Anomalia Aguardando Aprovação ⚠️',
        message: `${report.userName} (${report.userMatricula}) enviou um relato no setor "${report.sector}": "${report.description.substring(0, 80)}..."`,
        date: report.date,
        timestamp: 'Agora há pouco',
        read: false,
        authorName: report.userName,
        sector: report.sector,
        photoUrl: report.photoUrl,
        relatedId: report.id,
      });
    }
  },

  validateSafetyReport(
    reportId: string,
    status: 'aprovado' | 'rejeitado',
    supervisorName: string,
    pointsAwarded: number = 1,
    feedback?: string
  ): void {
    const reports = this.getSafetyReports();
    const rep = reports.find((r) => r.id === reportId);
    if (!rep) return;

    rep.status = status;
    rep.evaluatedBy = supervisorName;
    rep.evaluatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    rep.pointsAwarded = status === 'aprovado' ? pointsAwarded : 0;
    rep.feedback = feedback || (status === 'aprovado' ? 'Relato analisado e validado pela gestão DPO.' : 'Não validado.');
    this.setSafetyReports(reports);

    if (status === 'aprovado') {
      // Mark collaborator's safety meta in DailyRecord!
      const users = this.getUsers();
      const user = users.find((u) => u.id === rep.userId);
      if (user) {
        const hasSafetyMeta = user.metas.find(
          (m) =>
            m.descricao.toLowerCase().includes('relato') ||
            m.descricao.toLowerCase().includes('anomalia') ||
            m.descricao.toLowerCase().includes('segurança')
        );
        if (hasSafetyMeta) {
          this.toggleMetaStatus(user.id, rep.date, hasSafetyMeta.ordem, true);
        }
      }

      // Notify collaborator
      this.addNotification({
        id: `notif-safety-app-${rep.id}-${Date.now()}`,
        userId: rep.userId,
        type: 'anomaly_approved',
        title: 'Relato de Anomalia Aprovado pelo Gestor! 🎯🛡️',
        message: `Seu relato no setor "${rep.sector}" foi aprovado por ${supervisorName}. Meta computada (+${pointsAwarded} pt) e 1º critério de desempate ativo!`,
        pointsAwarded,
        date: rep.date,
        timestamp: 'Agora há pouco',
        read: false,
        photoUrl: rep.photoUrl,
        sector: rep.sector,
        relatedId: rep.id,
      });
    } else {
      // Notify collaborator about rejection
      this.addNotification({
        id: `notif-safety-rej-${rep.id}-${Date.now()}`,
        userId: rep.userId,
        type: 'anomaly_rejected',
        title: 'Relato de Anomalia Não Validado ⚠️',
        message: `Seu relato no setor "${rep.sector}" não foi validado por ${supervisorName}. Motivo: ${feedback || 'Critérios operacionais não atendidos'}.`,
        date: rep.date,
        timestamp: 'Agora há pouco',
        read: false,
        photoUrl: rep.photoUrl,
        sector: rep.sector,
        relatedId: rep.id,
      });
    }
  },

  // ================= CRITIQUES / CONTESTATIONS =================
  getCritiques(): CritiqueRequest[] {
    const critiques = loadFromStorage<CritiqueRequest[]>(KEYS.CRITIQUES, []);
    if (!critiques || critiques.length === 0) {
      saveToStorage(KEYS.CRITIQUES, INITIAL_CRITIQUES);
      return INITIAL_CRITIQUES;
    }
    return critiques;
  },

  setCritiques(critiques: CritiqueRequest[]): void {
    saveToStorage(KEYS.CRITIQUES, critiques);
    this.broadcastChange('Contestações atualizadas');
  },

  addCritique(critique: CritiqueRequest): void {
    const critiques = this.getCritiques();
    critiques.unshift(critique);
    this.setCritiques(critiques);
  },

  resolveCritique(
    id: string,
    status: 'deferida' | 'indeferida',
    pointsAwarded: number,
    supervisorNotes: string,
    supervisorName: string
  ): void {
    const critiques = this.getCritiques();
    const item = critiques.find((c) => c.id === id);
    if (item) {
      item.status = status;
      item.pointsAwarded = status === 'deferida' ? pointsAwarded : 0;
      item.supervisorNotes = supervisorNotes;
      item.resolvedBy = supervisorName;
      item.resolvedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      this.setCritiques(critiques);

      if (status === 'deferida' && pointsAwarded > 0) {
        const records = this.getDailyRecords();
        let userRec = records.find((r) => r.userId === item.userId && r.date === item.date);

        if (userRec) {
          userRec.calculatedScore = Math.min(6, userRec.calculatedScore + pointsAwarded);
          userRec.notes = `${userRec.notes || ''} [Crítica Deferida: +${pointsAwarded} pts]`;
        } else {
          const [y, m] = item.date.split('-').map(Number);
          userRec = {
            id: `rec-${item.userId}-${item.date}`,
            userId: item.userId,
            date: item.date,
            month: m || 9,
            year: y || 2026,
            metaStatus: { 1: false, 2: false, 3: false, 4: false },
            calculatedScore: pointsAwarded,
            notes: `Pontos creditados via Crítica deferida: ${supervisorNotes}`,
          };
          records.unshift(userRec);
        }
        this.setDailyRecords(records);
      }
    }
  },

  // ================= AUTH & SESSION =================
  getGestorUser(): User {
    const customAvatar = localStorage.getItem('dpo_liga_gestor_avatar');
    const gestorInUsers = this.getUsers().find((item) => item.matricula === 'G1002');
    return {
      id: 'u-gestor-g1002',
      matricula: 'G1002',
      pin: '!Liz1105',
      name: gestorInUsers?.name || 'Gestor DPO Armazém',
      role: 'conferente',
      roleTitle: 'Gestor Geral Armazém DPO',
      accessLevel: 'gerente',
      avatar:
        gestorInUsers?.avatar ||
        customAvatar ||
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      status: 'ativo',
      pontuacaoMaxima: 6,
      metas: gestorInUsers?.metas || [
        { ordem: 1, descricao: 'Controle de Acuracidade WMS', pontos: 2, categoria: 'qualidade' },
        { ordem: 2, descricao: 'Cumprimento de SLA de Expedição', pontos: 2, categoria: 'eficiencia' },
        { ordem: 3, descricao: 'Auditoria de Anomalias e Segurança', pontos: 1, categoria: 'seguranca' },
        { ordem: 4, descricao: 'Auditoria Geral de 5S no Armazém', pontos: 1, categoria: '5s' },
      ],
    };
  },

  updateGestorPhoto(photoUrl: string, userId?: string): void {
    localStorage.setItem('dpo_liga_gestor_avatar', photoUrl);
    const users = this.getUsers();
    let gestorUser = users.find((item) => item.matricula === 'G1002' || item.id === 'u-gestor-g1002');
    if (gestorUser) {
      gestorUser.avatar = photoUrl;
    } else {
      gestorUser = {
        ...this.getGestorUser(),
        avatar: photoUrl,
      };
      users.push(gestorUser);
    }
    this.setUsers(users);
    firebaseService.syncUser(gestorUser);
    this.broadcastChange('Foto do Gestor atualizada');
  },

  getCurrentUser(): User | null {
    const userId = loadFromStorage<string | null>(KEYS.CURRENT_USER_ID, null);
    if (!userId) return null;

    if (userId === 'u-gestor-g1002' || userId.toUpperCase() === 'G1002') {
      return this.getGestorUser();
    }

    const users = this.getUsers();
    return users.find((u) => u.id === userId || u.matricula.toUpperCase() === userId.toUpperCase()) || null;
  },

  setCurrentUser(userId: string): void {
    saveToStorage(KEYS.CURRENT_USER_ID, userId);
  },

  login(
    matricula: string,
    senha: string
  ): { success: boolean; user?: User; accessLevel: 'participante' | 'gestor'; message?: string } {
    const cleanMatricula = matricula.trim().toUpperCase();
    const cleanSenha = senha.trim();

    // 1. Gestor direct login G1002 / !Liz1105
    if (cleanMatricula === 'G1002' && cleanSenha === '!Liz1105') {
      const gestor = this.getGestorUser();
      this.setCurrentUser(gestor.id);
      this.setActiveAccessLevel('gestor');
      return { success: true, user: gestor, accessLevel: 'gestor' };
    }

    // 2. Collaborators from Cadastros
    const users = this.getUsers();
    const foundUser = users.find(
      (u) => u.matricula.trim().toUpperCase() === cleanMatricula
    );

    if (!foundUser) {
      return {
        success: false,
        accessLevel: 'participante',
        message: 'Usuário/Matrícula não cadastrado na Liga DPO.',
      };
    }

    // Verify PIN / Password
    const userPin = foundUser.pin ? foundUser.pin.trim() : '1234';
    if (userPin !== cleanSenha) {
      return {
        success: false,
        accessLevel: 'participante',
        message: 'Senha incorreta para a matrícula informada.',
      };
    }

    // Determine access level based on collaborator permissions
    const accessLevel: 'participante' | 'gestor' =
      foundUser.accessLevel === 'gerente' || foundUser.accessLevel === 'supervisor'
        ? 'gestor'
        : 'participante';

    this.setCurrentUser(foundUser.id);
    this.setActiveAccessLevel(accessLevel);

    return {
      success: true,
      user: foundUser,
      accessLevel,
    };
  },

  logout(): void {
    localStorage.removeItem(KEYS.CURRENT_USER_ID);
    this.setActiveAccessLevel('participante');
  },

  // Contestation validity: max 2 days from the target date to current reference date
  isDateContestable(dateStr: string): { eligible: boolean; diffDays: number; reason?: string } {
    const currentDate = new Date('2026-09-29T12:00:00Z');
    const targetDate = new Date(`${dateStr}T12:00:00Z`);
    const diffTime = currentDate.getTime() - targetDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return { eligible: false, diffDays, reason: 'Data futura não pode ser contestada.' };
    }
    if (diffDays > 2) {
      return {
        eligible: false,
        diffDays,
        reason: `Prazo limite excedido (${diffDays} dias). Contestações só podem ser feitas em até 2 dias da data da meta.`,
      };
    }
    return { eligible: true, diffDays };
  },

  // ================= RANKING CALCULATION WITH TIE-BREAKERS =================
  // CRITÉRIO DE DESEMPATE OFICIAL:
  // 1. Total de Pontos Acumulados
  // 2. Número de Relatos de Segurança / Anomalia realizados
  // 3. 5S em mais de uma área do armazém (extra 5S)
  // 4. Pontuação do Dia
  calculateRanking(selectedRole?: JobRole | 'all', selectedMonth: number = 9): RankingEntry[] {
    // Only 15 official competitors, exclude gestor G1002 from ranking
    const users = this.getUsers().filter(
      (u) => u.status === 'ativo' && u.matricula !== 'G1002' && u.accessLevel !== 'gerente'
    );
    const dailyRecords = this.getDailyRecords();
    const fiveSSubmissions = this.getFiveSSubmissions();
    const safetyReports = this.getSafetyReports();
    const today = '2026-09-29';

    const allEntries: RankingEntry[] = users.map((user) => {
      const userRecordsForMonth = dailyRecords.filter(
        (r) => r.userId === user.id && (selectedMonth === 0 || r.month === selectedMonth)
      );

      const daysWorkedCount = userRecordsForMonth.length;
      const monthPointsSum = userRecordsForMonth.reduce((acc, r) => acc + r.calculatedScore, 0);

      const todayRecord = dailyRecords.find((r) => r.userId === user.id && r.date === today);
      const todayScore = todayRecord ? Math.min(6, Math.max(0, todayRecord.calculatedScore)) : 0;

      let metasCompletedToday = 0;
      if (todayRecord && todayRecord.metaStatus) {
        Object.values(todayRecord.metaStatus).forEach((val) => {
          if (val) metasCompletedToday++;
        });
      }

      // SEM MOCK: A pontuação é EXATAMENTE a soma real dos registros lançados
      const totalScore = monthPointsSum;

      // 5S Aprovados reais
      const userFiveS = fiveSSubmissions.filter((s) => s.userId === user.id);
      const approved5s = userFiveS.filter((s) => s.status === 'aprovado').length;

      // CRITÉRIOS DE DESEMPATE OFICIAIS
      // 1. Relatos de anomalia/segurança aprovados pelo Gestor
      const safetyReportsCount = safetyReports.filter(
        (r) => r.userId === user.id && r.status === 'aprovado'
      ).length;

      // 2. 5S aprovados em mais de uma área (extra 5S além do primeiro)
      const extraFiveSCount = userFiveS.filter(
        (s) => s.status === 'aprovado' && (s.isExtraArea || s.sector.includes('Adicional'))
      ).length;

      const avgAttainment = daysWorkedCount > 0 ? Math.round((monthPointsSum / (daysWorkedCount * 6.0)) * 100) : 0;

      let todayStatus: 'excelente' | 'atingiu' | 'parcial' | 'alerta' = 'alerta';
      if (todayScore === 6) todayStatus = 'excelente';
      else if (todayScore >= 5) todayStatus = 'atingiu';
      else if (todayScore >= 4) todayStatus = 'parcial';
      else todayStatus = 'alerta';

      // Histórico real com base estrita nos registros lançados
      const historyScores = userRecordsForMonth
        .slice(-7)
        .map((r) => ({
          date: r.date.split('-').slice(1).reverse().join('/'),
          score: r.calculatedScore,
        }));

      return {
        userId: user.id,
        user,
        totalScore,
        todayScore,
        maxScore: 6,
        avgAttainment,
        metasCompletedToday,
        fiveSApprovedCount: approved5s,
        safetyReportsCount,
        extraFiveSCount,
        position: 0,
        categoryPosition: 0,
        generalPosition: 0,
        trend: todayScore >= 5 ? 'up' : todayScore >= 4 ? 'equal' : 'down',
        todayStatus,
        historyScores,
        daysWorkedCount,
        isDesqualificado: !!user.desqualificado,
        motivoDesqualificacao: user.motivoDesqualificacao,
        dataDesqualificacao: user.dataDesqualificacao,
        desqualificadoPor: user.desqualificadoPor,
      };
    });

    // Sort globally applying the official tie-breaker rules + Disqualification rule
    allEntries.sort((a, b) => {
      // REGRA: Usuário desqualificado sempre vai para o fim da tabela
      const aDisq = !!a.user.desqualificado;
      const bDisq = !!b.user.desqualificado;
      if (aDisq !== bDisq) {
        return aDisq ? 1 : -1;
      }

      // 1. Pontuação total
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      // 2. Desempate 1: Número de relatos de anomalia/segurança
      if (b.safetyReportsCount !== a.safetyReportsCount) return b.safetyReportsCount - a.safetyReportsCount;
      // 3. Desempate 2: 5S em mais de uma área do armazém
      if (b.extraFiveSCount !== a.extraFiveSCount) return b.extraFiveSCount - a.extraFiveSCount;
      // 4. Pontos do dia
      if (b.todayScore !== a.todayScore) return b.todayScore - a.todayScore;
      return a.user.matricula.localeCompare(b.user.matricula);
    });

    allEntries.forEach((e, idx) => {
      e.generalPosition = idx + 1;
      e.position = idx + 1;
    });

    // Category Positions within each cargo applying the same tie-breakers and disqualification rule
    const roles: JobRole[] = ['ajudante', 'conferente', 'empilhador', 'manobrista'];
    roles.forEach((r) => {
      const catList = allEntries.filter((e) => e.user.role === r);
      catList.sort((a, b) => {
        const aDisq = !!a.user.desqualificado;
        const bDisq = !!b.user.desqualificado;
        if (aDisq !== bDisq) {
          return aDisq ? 1 : -1;
        }

        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (b.safetyReportsCount !== a.safetyReportsCount) return b.safetyReportsCount - a.safetyReportsCount;
        if (b.extraFiveSCount !== a.extraFiveSCount) return b.extraFiveSCount - a.extraFiveSCount;
        if (b.todayScore !== a.todayScore) return b.todayScore - a.todayScore;
        return a.user.matricula.localeCompare(b.user.matricula);
      });
      catList.forEach((e, idx) => {
        e.categoryPosition = idx + 1;
      });
    });

    if (selectedRole && selectedRole !== 'all') {
      const filtered = allEntries.filter((e) => e.user.role === selectedRole);
      filtered.forEach((e) => {
        e.position = e.categoryPosition;
      });
      return filtered;
    }

    return allEntries;
  },

  // ================= IMPORT / EXPORT LIGA JSON =================
  exportLigaJSON(): LigaImportSchema {
    const users = this.getUsers();
    const params = this.getParameters();

    const roleGroups: { cargo: string; roleKey: JobRole }[] = [
      { cargo: 'Ajudante de Armazém', roleKey: 'ajudante' },
      { cargo: 'Conferente', roleKey: 'conferente' },
      { cargo: 'Empilhador', roleKey: 'empilhador' },
      { cargo: 'Manobrista', roleKey: 'manobrista' },
    ];

    let totalMetas = 0;

    const cargos = roleGroups.map((group) => {
      const roleUsers = users.filter((u) => u.role === group.roleKey);
      const colaboradores = roleUsers.map((u) => {
        totalMetas += u.metas.length;
        return {
          nome: u.name,
          matricula: u.matricula,
          pontuacao_maxima: u.pontuacaoMaxima || 6,
          metas: u.metas.map((m) => ({
            ordem: m.ordem,
            descricao: m.descricao,
            pontos: m.pontos,
          })),
        };
      });

      return {
        cargo: group.cargo,
        colaboradores,
      };
    });

    return {
      liga: params.ligaNome,
      observacao: params.observacao,
      pontuacao_maxima_por_colaborador: params.pontuacaoMaximaPorColaborador,
      resumo: {
        total_cargos: 4,
        total_colaboradores: users.length,
        total_metas: totalMetas,
      },
      cargos,
    };
  },

  importLigaJSON(data: any): { success: boolean; message: string; count: number } {
    try {
      if (!data || !data.cargos || !Array.isArray(data.cargos)) {
        return { success: false, message: 'JSON inválido: propriedade "cargos" ausente.', count: 0 };
      }

      const roleMapping: Record<string, JobRole> = {
        'ajudante de armazém': 'ajudante',
        'ajudante': 'ajudante',
        'conferente': 'conferente',
        'empilhador': 'empilhador',
        'operador de empilhadeira': 'empilhador',
        'manobrista': 'manobrista',
      };

      const existingUsers = this.getUsers();
      const updatedUsers: User[] = [];
      let importedCount = 0;

      data.cargos.forEach((cargoGroup: any) => {
        const cargoName = (cargoGroup.cargo || '').toLowerCase().trim();
        const roleKey: JobRole = roleMapping[cargoName] || 'ajudante';

        if (Array.isArray(cargoGroup.colaboradores)) {
          cargoGroup.colaboradores.forEach((colab: any) => {
            const nome = colab.nome || colab.name || 'Colaborador';
            const existing = existingUsers.find(
              (u) =>
                u.name.toLowerCase() === nome.toLowerCase() ||
                (colab.matricula && u.matricula === colab.matricula)
            );

            const matricula =
              colab.matricula ||
              existing?.matricula ||
              `G${Math.floor(1000 + Math.random() * 9000)}`;

            const metas: MetaItem[] = Array.isArray(colab.metas)
              ? colab.metas.map((m: any, idx: number) => ({
                  ordem: m.ordem || idx + 1,
                  descricao: m.descricao || m.name || `Meta ${idx + 1}`,
                  pontos: Number(m.pontos) || 1,
                  categoria: 'operacao' as const,
                }))
              : existing?.metas || [];

            const userObj: User = {
              id: existing?.id || `u-${matricula.toLowerCase()}`,
              matricula,
              pin: existing?.pin || '1234',
              name: nome,
              role: roleKey,
              roleTitle: ROLE_LABELS[roleKey],
              accessLevel: existing?.accessLevel || 'operador',
              avatar: existing?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              status: 'ativo',
              pontuacaoMaxima: 6,
              metas,
            };

            updatedUsers.push(userObj);
            importedCount++;
          });
        }
      });

      if (updatedUsers.length === 0) {
        return { success: false, message: 'Nenhum colaborador válido encontrado no JSON.', count: 0 };
      }

      this.setUsers(updatedUsers);

      if (data.liga || data.pontuacao_maxima_por_colaborador) {
        const params = this.getParameters();
        this.updateParameters({
          ...params,
          ligaNome: data.liga || params.ligaNome,
          pontuacaoMaximaPorColaborador: Number(data.pontuacao_maxima_por_colaborador) || 6,
          observacao: data.observacao || params.observacao,
        });
      }

      return {
        success: true,
        message: `Sucesso! ${importedCount} colaboradores e suas metas foram importados/atualizados sem perda de dados.`,
        count: importedCount,
      };
    } catch (e: any) {
      return { success: false, message: `Erro ao processar JSON: ${e.message}`, count: 0 };
    }
  },

  exportData(): string {
    return JSON.stringify(
      {
        system: 'LIGA DPO ARMAZEM',
        timestamp: new Date().toISOString(),
        parameters: this.getParameters(),
        users: this.getUsers(),
        dailyRecords: this.getDailyRecords(),
        fiveS: this.getFiveSSubmissions(),
        safetyReports: this.getSafetyReports(),
        critiques: this.getCritiques(),
      },
      null,
      2
    );
  },

  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.cargos && Array.isArray(data.cargos)) {
        return this.importLigaJSON(data).success;
      }
      if (data.users && Array.isArray(data.users)) this.setUsers(data.users);
      if (data.dailyRecords && Array.isArray(data.dailyRecords)) this.setDailyRecords(data.dailyRecords);
      if (data.records && Array.isArray(data.records)) this.setDailyRecords(data.records);
      if (data.fiveS && Array.isArray(data.fiveS)) this.setFiveSSubmissions(data.fiveS);
      if (data.safetyReports && Array.isArray(data.safetyReports)) this.setSafetyReports(data.safetyReports);
      if (data.critiques && Array.isArray(data.critiques)) this.setCritiques(data.critiques);
      if (data.parameters) this.updateParameters(data.parameters);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  resetAll(): void {
    localStorage.removeItem(KEYS.USERS);
    localStorage.removeItem(KEYS.DAILY_RECORDS);
    localStorage.removeItem(KEYS.FIVE_S);
    localStorage.removeItem(KEYS.SAFETY_REPORTS);
    localStorage.removeItem(KEYS.CRITIQUES);
    localStorage.removeItem(KEYS.PARAMETERS);
    localStorage.removeItem(KEYS.CURRENT_USER_ID);
    localStorage.removeItem(KEYS.ACTIVE_ACCESS_LEVEL);
    window.location.reload();
  },
};

// Auto-initialize real-time synchronization on boot
if (typeof window !== 'undefined') {
  storageService.init();
}

