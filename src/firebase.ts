import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc,
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  UserProfile, 
  RoutineStep, 
  CartItem, 
  SkinAssessmentHistoryRecord, 
  OrderRecord, 
  RoutineReminders,
  QuestionnaireHistoryRecord 
} from './types';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Validate connection to Firestore as required by Firebase skill
(async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore offline check:", error.message);
    }
  }
})();

export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
};
export type { User };

// --- Per-User Firestore Persistence Services ---

export interface UserPersistedData {
  profile: UserProfile | null;
  morningSteps: RoutineStep[];
  eveningSteps: RoutineStep[];
  routineName: string;
  routineReminders: RoutineReminders;
  checkInHistory: string[];
  cartItems: CartItem[];
  assessmentHistory: SkinAssessmentHistoryRecord[];
  questionnaireHistory: QuestionnaireHistoryRecord[];
  orders: OrderRecord[];
}

/**
 * Fetch all user personal data from Firestore strictly separated by userId
 */
export async function loadUserDataFromFirestore(userId: string): Promise<UserPersistedData> {
  const result: UserPersistedData = {
    profile: null,
    morningSteps: [],
    eveningSteps: [],
    routineName: '我的护肤方案',
    routineReminders: {
      morning: { enabled: false, time: '08:00' },
      evening: { enabled: false, time: '22:00' }
    },
    checkInHistory: [],
    cartItems: [],
    assessmentHistory: [],
    questionnaireHistory: [],
    orders: []
  };

  try {
    // 1. Profile
    const profileSnap = await getDoc(doc(db, `users/${userId}/profile/data`));
    if (profileSnap.exists()) {
      result.profile = profileSnap.data() as UserProfile;
    }

    // 2. Routine
    const routineSnap = await getDoc(doc(db, `users/${userId}/routine/current`));
    if (routineSnap.exists()) {
      const data = routineSnap.data();
      if (Array.isArray(data.morningSteps)) result.morningSteps = data.morningSteps;
      if (Array.isArray(data.eveningSteps)) result.eveningSteps = data.eveningSteps;
      if (data.routineName) result.routineName = data.routineName;
      if (data.routineReminders) result.routineReminders = data.routineReminders;
      if (Array.isArray(data.checkInHistory)) result.checkInHistory = data.checkInHistory;
    }

    // 3. Cart
    const cartSnap = await getDoc(doc(db, `users/${userId}/cart/current`));
    if (cartSnap.exists()) {
      const data = cartSnap.data();
      if (Array.isArray(data.items)) result.cartItems = data.items;
    }

    // 4. Assessment History
    const assessmentsSnap = await getDocs(collection(db, `users/${userId}/assessment_history`));
    const assessments: SkinAssessmentHistoryRecord[] = [];
    assessmentsSnap.forEach((docSnap) => {
      assessments.push(docSnap.data() as SkinAssessmentHistoryRecord);
    });
    // Sort newest first
    assessments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    result.assessmentHistory = assessments;

    // 5. Questionnaire History
    const qSnap = await getDocs(collection(db, `users/${userId}/questionnaire_history`));
    const questionnaires: QuestionnaireHistoryRecord[] = [];
    qSnap.forEach((docSnap) => {
      questionnaires.push(docSnap.data() as QuestionnaireHistoryRecord);
    });
    questionnaires.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    result.questionnaireHistory = questionnaires;

    // 6. Orders
    const ordersSnap = await getDocs(collection(db, `users/${userId}/orders`));
    const orders: OrderRecord[] = [];
    ordersSnap.forEach((docSnap) => {
      orders.push(docSnap.data() as OrderRecord);
    });
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    result.orders = orders;

  } catch (err) {
    console.error(`Error loading user data for ${userId}:`, err);
  }

  return result;
}

export async function saveUserProfileToFirestore(userId: string, profile: UserProfile): Promise<void> {
  try {
    await setDoc(doc(db, `users/${userId}/profile/data`), profile, { merge: true });
  } catch (err) {
    console.error('Error saving profile:', err);
  }
}

export async function saveUserRoutineToFirestore(
  userId: string, 
  data: {
    morningSteps: RoutineStep[];
    eveningSteps: RoutineStep[];
    routineName: string;
    routineReminders: RoutineReminders;
    checkInHistory: string[];
  }
): Promise<void> {
  try {
    await setDoc(doc(db, `users/${userId}/routine/current`), data, { merge: true });
  } catch (err) {
    console.error('Error saving routine:', err);
  }
}

export async function saveUserCartToFirestore(userId: string, items: CartItem[]): Promise<void> {
  try {
    await setDoc(doc(db, `users/${userId}/cart/current`), { items }, { merge: true });
  } catch (err) {
    console.error('Error saving cart:', err);
  }
}

export async function saveAssessmentRecordToFirestore(userId: string, record: SkinAssessmentHistoryRecord): Promise<void> {
  try {
    await setDoc(doc(db, `users/${userId}/assessment_history/${record.id}`), record);
  } catch (err) {
    console.error('Error saving assessment record:', err);
  }
}

export async function deleteAssessmentRecordFromFirestore(userId: string, recordId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, `users/${userId}/assessment_history/${recordId}`));
  } catch (err) {
    console.error('Error deleting assessment record:', err);
  }
}

export async function clearAssessmentHistoryFromFirestore(userId: string): Promise<void> {
  try {
    const snap = await getDocs(collection(db, `users/${userId}/assessment_history`));
    const promises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(promises);
  } catch (err) {
    console.error('Error clearing assessment history:', err);
  }
}

export async function saveOrderToFirestore(userId: string, order: OrderRecord): Promise<void> {
  try {
    await setDoc(doc(db, `users/${userId}/orders/${order.id}`), order);
  } catch (err) {
    console.error('Error saving order:', err);
  }
}

export async function saveQuestionnaireRecordToFirestore(userId: string, record: QuestionnaireHistoryRecord): Promise<void> {
  try {
    await setDoc(doc(db, `users/${userId}/questionnaire_history/${record.id}`), record);
  } catch (err) {
    console.error('Error saving questionnaire record:', err);
  }
}
