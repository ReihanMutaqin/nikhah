import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { getFirestore, doc, onSnapshot, setDoc, collection, deleteDoc } from "firebase/firestore";
import type { WeddingData, WishItem, RSVPItem } from "./wedding-data";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBXP0F01VN5ddSMpQfaD3B6gWhkfyrvoYs",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "db-nikah.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://db-nikah-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "db-nikah",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "db-nikah.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "958184270515",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:958184270515:web:1666dbf4993c9a1f9d1ec6",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const rtdb = getDatabase(app);
export const firestore = getFirestore(app);

// REALTIME LISTENERS & WRITERS (Dual Support: Realtime DB + Firestore)

// 1. Wedding Data Sync
export function subscribeWeddingData(callback: (data: WeddingData | null) => void) {
  // Listen via Firestore first
  const unsubFirestore = onSnapshot(
    doc(firestore, "wedding", "mainData"),
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as WeddingData);
      }
    },
    (err) => {
      console.warn("Firestore listener warning:", err);
    }
  );

  // Also listen via Realtime DB as secondary
  const rtdbRef = ref(rtdb, "weddingData");
  const unsubRtdb = onValue(
    rtdbRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    },
    (err) => {
      console.warn("Realtime DB listener warning:", err);
    }
  );

  return () => {
    unsubFirestore();
    unsubRtdb();
  };
}

export async function saveWeddingDataToFirebase(data: WeddingData): Promise<{ success: boolean; message?: string }> {
  let successCount = 0;
  let lastError = "";

  // 1. Try Firestore
  try {
    await setDoc(doc(firestore, "wedding", "mainData"), data);
    successCount++;
  } catch (error: any) {
    console.error("Firestore save error:", error);
    lastError = error?.message || String(error);
  }

  // 2. Try Realtime DB
  try {
    await set(ref(rtdb, "weddingData"), data);
    successCount++;
  } catch (error: any) {
    console.error("Realtime DB save error:", error);
    if (!lastError) lastError = error?.message || String(error);
  }

  if (successCount > 0) {
    return { success: true };
  } else {
    return { success: false, message: lastError };
  }
}

// 2. Wishes Sync
export function subscribeWishes(callback: (wishes: WishItem[]) => void) {
  const unsubFirestore = onSnapshot(
    collection(firestore, "wishes"),
    (snapshot) => {
      if (!snapshot.empty) {
        const list: WishItem[] = [];
        snapshot.forEach((d) => list.push({ ...(d.data() as WishItem), id: d.id }));
        callback(list.reverse());
      }
    },
    (err) => console.warn(err)
  );

  const unsubRtdb = onValue(
    ref(rtdb, "wishes"),
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: WishItem[] = Array.isArray(val)
          ? val.filter(Boolean)
          : Object.keys(val).map((k) => ({ ...val[k], id: k }));
        callback(list.reverse());
      }
    },
    (err) => console.warn(err)
  );

  return () => {
    unsubFirestore();
    unsubRtdb();
  };
}

export async function addWishToFirebase(wish: WishItem) {
  try {
    await setDoc(doc(firestore, "wishes", wish.id), wish);
  } catch (e) {}
  try {
    await set(ref(rtdb, `wishes/${wish.id}`), wish);
  } catch (e) {}
}

export async function deleteWishFromFirebase(wishId: string) {
  try {
    await deleteDoc(doc(firestore, "wishes", wishId));
  } catch (e) {}
  try {
    await set(ref(rtdb, `wishes/${wishId}`), null);
  } catch (e) {}
}

// 3. RSVP Sync
export function subscribeRSVPs(callback: (rsvps: RSVPItem[]) => void) {
  const unsubFirestore = onSnapshot(
    collection(firestore, "rsvps"),
    (snapshot) => {
      if (!snapshot.empty) {
        const list: RSVPItem[] = [];
        snapshot.forEach((d) => list.push({ ...(d.data() as RSVPItem), id: d.id }));
        callback(list.reverse());
      }
    },
    (err) => console.warn(err)
  );

  const unsubRtdb = onValue(
    ref(rtdb, "rsvps"),
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: RSVPItem[] = Array.isArray(val)
          ? val.filter(Boolean)
          : Object.keys(val).map((k) => ({ ...val[k], id: k }));
        callback(list.reverse());
      }
    },
    (err) => console.warn(err)
  );

  return () => {
    unsubFirestore();
    unsubRtdb();
  };
}

export async function addRSVPToFirebase(rsvp: RSVPItem) {
  try {
    await setDoc(doc(firestore, "rsvps", rsvp.id), rsvp);
  } catch (e) {}
  try {
    await set(ref(rtdb, `rsvps/${rsvp.id}`), rsvp);
  } catch (e) {}
}

export async function deleteRSVPFromFirebase(rsvpId: string) {
  try {
    await deleteDoc(doc(firestore, "rsvps", rsvpId));
  } catch (e) {}
  try {
    await set(ref(rtdb, `rsvps/${rsvpId}`), null);
  } catch (e) {}
}
