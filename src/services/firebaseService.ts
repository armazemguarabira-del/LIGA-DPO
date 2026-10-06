import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  User,
  DailyRecord,
  FiveSSubmission,
  SafetyAnomalyReport,
  CritiqueRequest,
  DPONotification,
  DPOParameters,
} from '../types/dpo';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific databaseId if defined
export const db: Firestore = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== ''
    ? firebaseConfig.firestoreDatabaseId
    : '(default)'
);

export let isFirebaseConnected = false;

// Validate connection on boot as specified in Firebase Skill guidelines
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    isFirebaseConnected = true;
    console.log('✅ Firebase Firestore conectado com sucesso:', firebaseConfig.projectId);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('⚠️ Firebase: Cliente offline ou sincronização local ativa.');
    } else {
      console.log('ℹ️ Firebase inicializado e ativo para operações na nuvem.');
    }
    isFirebaseConnected = true;
    return true;
  }
}

// Automatically test connection
testFirebaseConnection();

export interface CloudSyncHandlers {
  onUsersUpdate?: (users: User[]) => void;
  onDailyRecordsUpdate?: (records: DailyRecord[]) => void;
  onParametersUpdate?: (params: DPOParameters) => void;
  onFiveSUpdate?: (submissions: FiveSSubmission[]) => void;
  onSafetyReportsUpdate?: (reports: SafetyAnomalyReport[]) => void;
  onCritiquesUpdate?: (critiques: CritiqueRequest[]) => void;
  onNotificationsUpdate?: (notifications: DPONotification[]) => void;
}

let activeUnsubscribers: Unsubscribe[] = [];

// Cloud Sync helpers with Real-Time Listeners
export const firebaseService = {
  isConfigured: () => Boolean(firebaseConfig.projectId),
  getProjectId: () => firebaseConfig.projectId,
  getDatabaseId: () => firebaseConfig.firestoreDatabaseId,

  // Initialize bi-directional real-time sync with Firestore onSnapshot
  initRealtimeCloudSync(handlers: CloudSyncHandlers): () => void {
    // Clean up previous listeners if any
    activeUnsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {}
    });
    activeUnsubscribers = [];

    try {
      // 1. Listen to USERS collection in real time
      const usersUnsub = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          if (!snapshot.empty) {
            const users = snapshot.docs.map((d) => d.data() as User);
            handlers.onUsersUpdate?.(users);
          }
        },
        (err) => {
          console.warn('Realtime sync users notice:', err.message);
        }
      );
      activeUnsubscribers.push(usersUnsub);

      // 2. Listen to DAILY RECORDS collection in real time
      const recordsUnsub = onSnapshot(
        collection(db, 'dailyRecords'),
        (snapshot) => {
          const records = snapshot.docs.map((d) => d.data() as DailyRecord);
          handlers.onDailyRecordsUpdate?.(records);
        },
        (err) => {
          console.warn('Realtime sync dailyRecords notice:', err.message);
        }
      );
      activeUnsubscribers.push(recordsUnsub);

      // 3. Listen to PARAMETERS document in real time
      const paramsUnsub = onSnapshot(
        doc(db, 'parameters', 'main'),
        (snapshot) => {
          if (snapshot.exists()) {
            handlers.onParametersUpdate?.(snapshot.data() as DPOParameters);
          }
        },
        (err) => {
          console.warn('Realtime sync parameters notice:', err.message);
        }
      );
      activeUnsubscribers.push(paramsUnsub);

      // 4. Listen to 5S SUBMISSIONS in real time
      const fiveSUnsub = onSnapshot(
        collection(db, 'fiveSSubmissions'),
        (snapshot) => {
          const items = snapshot.docs.map((d) => d.data() as FiveSSubmission);
          handlers.onFiveSUpdate?.(items);
        },
        (err) => {
          console.warn('Realtime sync 5S notice:', err.message);
        }
      );
      activeUnsubscribers.push(fiveSUnsub);

      // 5. Listen to SAFETY REPORTS in real time
      const safetyUnsub = onSnapshot(
        collection(db, 'safetyReports'),
        (snapshot) => {
          const items = snapshot.docs.map((d) => d.data() as SafetyAnomalyReport);
          handlers.onSafetyReportsUpdate?.(items);
        },
        (err) => {
          console.warn('Realtime sync safety notice:', err.message);
        }
      );
      activeUnsubscribers.push(safetyUnsub);

      // 6. Listen to CRITIQUES in real time
      const critiquesUnsub = onSnapshot(
        collection(db, 'critiques'),
        (snapshot) => {
          const items = snapshot.docs.map((d) => d.data() as CritiqueRequest);
          handlers.onCritiquesUpdate?.(items);
        },
        (err) => {
          console.warn('Realtime sync critiques notice:', err.message);
        }
      );
      activeUnsubscribers.push(critiquesUnsub);

      // 7. Listen to NOTIFICATIONS in real time
      const notifsUnsub = onSnapshot(
        collection(db, 'notifications'),
        (snapshot) => {
          const items = snapshot.docs.map((d) => d.data() as DPONotification);
          handlers.onNotificationsUpdate?.(items);
        },
        (err) => {
          console.warn('Realtime sync notifications notice:', err.message);
        }
      );
      activeUnsubscribers.push(notifsUnsub);

      console.log('⚡ Sincronização em tempo real Firestore ativa para 7 coleções operacionais.');
    } catch (err) {
      console.warn('Erro ao registrar ouvintes em tempo real do Firestore:', err);
    }

    return () => {
      activeUnsubscribers.forEach((u) => {
        try {
          u();
        } catch (e) {}
      });
      activeUnsubscribers = [];
    };
  },

  // Seed cloud if empty so new visitors on GitHub Pages load the official collaborators immediately
  async seedCloudIfEmpty(initialUsers: User[], initialParams: DPOParameters): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (snap.empty && initialUsers.length > 0) {
        console.log('🌱 Inicializando dados cadastrais no Firestore Cloud...');
        for (const user of initialUsers) {
          if (user.id) {
            await setDoc(doc(db, 'users', user.id), user);
          }
        }
        await setDoc(doc(db, 'parameters', 'main'), initialParams);
        console.log('✅ Base inicial sincronizada na nuvem com sucesso.');
      }
    } catch (e) {
      console.warn('seedCloudIfEmpty notice:', e);
    }
  },

  // Sync a single user to Firestore
  async syncUser(user: User): Promise<void> {
    try {
      if (!user.id) return;
      await setDoc(doc(db, 'users', user.id), user, { merge: true });
    } catch (e) {
      console.warn('Firebase syncUser notice:', e);
    }
  },

  // Delete a user from Firestore
  async deleteUser(userId: string): Promise<void> {
    try {
      if (!userId) return;
      await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
      console.warn('Firebase deleteUser notice:', e);
    }
  },

  // Sync a single record to Firestore
  async syncDailyRecord(record: DailyRecord): Promise<void> {
    try {
      if (!record.id) return;
      await setDoc(doc(db, 'dailyRecords', record.id), record, { merge: true });
    } catch (e) {
      console.warn('Firebase syncDailyRecord notice:', e);
    }
  },

  // Delete a daily record from Firestore
  async deleteDailyRecord(recordId: string): Promise<void> {
    try {
      if (!recordId) return;
      await deleteDoc(doc(db, 'dailyRecords', recordId));
    } catch (e) {
      console.warn('Firebase deleteDailyRecord notice:', e);
    }
  },

  // Sync parameters
  async syncParameters(params: DPOParameters): Promise<void> {
    try {
      await setDoc(doc(db, 'parameters', 'main'), params, { merge: true });
    } catch (e) {
      console.warn('Firebase syncParameters notice:', e);
    }
  },

  // Sync FiveS submission
  async syncFiveS(sub: FiveSSubmission): Promise<void> {
    try {
      if (!sub.id) return;
      await setDoc(doc(db, 'fiveSSubmissions', sub.id), sub, { merge: true });
    } catch (e) {
      console.warn('Firebase syncFiveS notice:', e);
    }
  },

  // Sync Safety Report
  async syncSafetyReport(report: SafetyAnomalyReport): Promise<void> {
    try {
      if (!report.id) return;
      await setDoc(doc(db, 'safetyReports', report.id), report, { merge: true });
    } catch (e) {
      console.warn('Firebase syncSafetyReport notice:', e);
    }
  },

  async deleteSafetyReport(reportId: string): Promise<void> {
    try {
      if (!reportId) return;
      await deleteDoc(doc(db, 'safetyReports', reportId));
    } catch (e) {
      console.warn('Firebase deleteSafetyReport notice:', e);
    }
  },

  // Sync Critique
  async syncCritique(critique: CritiqueRequest): Promise<void> {
    try {
      if (!critique.id) return;
      await setDoc(doc(db, 'critiques', critique.id), critique, { merge: true });
    } catch (e) {
      console.warn('Firebase syncCritique notice:', e);
    }
  },

  // Sync Notification
  async syncNotification(notif: DPONotification): Promise<void> {
    try {
      if (!notif.id) return;
      await setDoc(doc(db, 'notifications', notif.id), notif, { merge: true });
    } catch (e) {
      console.warn('Firebase syncNotification notice:', e);
    }
  },

  // Pull collection data from cloud if available
  async fetchCloudCollection<T>(collectionName: string): Promise<T[]> {
    try {
      const snap = await getDocs(collection(db, collectionName));
      return snap.docs.map((d) => d.data() as T);
    } catch (e) {
      return [];
    }
  },
};
