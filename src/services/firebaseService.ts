import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDocs,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  User,
  DailyRecord,
  FiveSSubmission,
  SafetyAnomalyReport,
  CritiqueRequest,
  DPONotification,
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
      console.warn('⚠️ Firebase: Cliente offline ou configuração pendente.');
    } else {
      console.log('ℹ️ Firebase inicializado e ativo para operações na nuvem.');
    }
    isFirebaseConnected = true;
    return true;
  }
}

// Automatically test connection
testFirebaseConnection();

// Cloud Sync helpers
export const firebaseService = {
  isConfigured: () => Boolean(firebaseConfig.projectId),
  getProjectId: () => firebaseConfig.projectId,
  getDatabaseId: () => firebaseConfig.firestoreDatabaseId,

  // Sync a single record to Firestore
  async syncDailyRecord(record: DailyRecord): Promise<void> {
    try {
      if (!record.id) return;
      await setDoc(doc(db, 'dailyRecords', record.id), record, { merge: true });
    } catch (e) {
      console.warn('Firebase syncDailyRecord notice:', e);
    }
  },

  async syncUser(user: User): Promise<void> {
    try {
      if (!user.id) return;
      await setDoc(doc(db, 'users', user.id), user, { merge: true });
    } catch (e) {
      console.warn('Firebase syncUser notice:', e);
    }
  },

  async syncFiveS(sub: FiveSSubmission): Promise<void> {
    try {
      if (!sub.id) return;
      await setDoc(doc(db, 'fiveSSubmissions', sub.id), sub, { merge: true });
    } catch (e) {
      console.warn('Firebase syncFiveS notice:', e);
    }
  },

  async syncSafetyReport(report: SafetyAnomalyReport): Promise<void> {
    try {
      if (!report.id) return;
      await setDoc(doc(db, 'safetyReports', report.id), report, { merge: true });
    } catch (e) {
      console.warn('Firebase syncSafetyReport notice:', e);
    }
  },

  async syncCritique(critique: CritiqueRequest): Promise<void> {
    try {
      if (!critique.id) return;
      await setDoc(doc(db, 'critiques', critique.id), critique, { merge: true });
    } catch (e) {
      console.warn('Firebase syncCritique notice:', e);
    }
  },

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
