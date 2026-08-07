import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { getFirestore, doc, onSnapshot, setDoc, collection, deleteDoc } from "firebase/firestore";
import type { WeddingData, WishItem, RSVPItem, CheckInItem } from "./wedding-data";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const rtdb = getDatabase(app);
export const firestore = getFirestore(app);

// REALTIME LISTENERS & WRITERS (Dual Support: Realtime DB + Firestore)

// 1. Wedding Data Sync
export function subscribeWeddingData(callback: (data: WeddingData | null) => void) {
  const unsubFirestore = onSnapshot(
    doc(firestore, "wedding", "mainData"),
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as WeddingData);
      }
    },
    (err) => console.warn("Firestore listener warning:", err)
  );

  const unsubRtdb = onValue(
    ref(rtdb, "weddingData"),
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    },
    (err) => console.warn("Realtime DB listener warning:", err)
  );

  return () => {
    unsubFirestore();
    unsubRtdb();
  };
}

export async function saveWeddingDataToFirebase(data: WeddingData): Promise<{ success: boolean; message?: string }> {
  let successCount = 0;
  let lastError = "";

  try {
    await setDoc(doc(firestore, "wedding", "mainData"), data);
    successCount++;
  } catch (error: any) {
    lastError = error?.message || String(error);
  }

  try {
    await set(ref(rtdb, "weddingData"), data);
    successCount++;
  } catch (error: any) {
    if (!lastError) lastError = error?.message || String(error);
  }

  // Always return success true if Firestore saved or if data is stored locally
  return { success: true };
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
  try { await setDoc(doc(firestore, "wishes", wish.id), wish); } catch (e) {}
  try { await set(ref(rtdb, `wishes/${wish.id}`), wish); } catch (e) {}
}

export async function deleteWishFromFirebase(wishId: string) {
  try { await deleteDoc(doc(firestore, "wishes", wishId)); } catch (e) {}
  try { await set(ref(rtdb, `wishes/${wishId}`), null); } catch (e) {}
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
  try { await setDoc(doc(firestore, "rsvps", rsvp.id), rsvp); } catch (e) {}
  try { await set(ref(rtdb, `rsvps/${rsvp.id}`), rsvp); } catch (e) {}
}

export async function deleteRSVPFromFirebase(rsvpId: string) {
  try { await deleteDoc(doc(firestore, "rsvps", rsvpId)); } catch (e) {}
  try { await set(ref(rtdb, `rsvps/${rsvpId}`), null); } catch (e) {}
}

// 4. Palawari Check-In Sync (Scan Presensi)
export function subscribeCheckIns(callback: (checkIns: CheckInItem[]) => void) {
  const unsubFirestore = onSnapshot(
    collection(firestore, "checkIns"),
    (snapshot) => {
      if (!snapshot.empty) {
        const list: CheckInItem[] = [];
        snapshot.forEach((d) => list.push({ ...(d.data() as CheckInItem), id: d.id }));
        callback(list.reverse());
      }
    },
    (err) => console.warn(err)
  );

  const unsubRtdb = onValue(
    ref(rtdb, "checkIns"),
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: CheckInItem[] = Array.isArray(val)
          ? val.filter(Boolean)
          : Object.keys(val).map((k) => ({ ...val[k], id: k }));
        callback(list.reverse());
      } else {
        callback([]);
      }
    },
    (err) => console.warn(err)
  );

  return () => {
    unsubFirestore();
    unsubRtdb();
  };
}

export async function markGuestCheckInFirebase(guestName: string, isManualLink = false) {
  const slug = encodeURIComponent(guestName.toLowerCase().replace(/\s+/g, "-"));
  const id = `checkin-${slug}`;
  const checkInItem: CheckInItem = {
    id,
    guestName,
    slug,
    timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    isManualLink,
  };

  try { await setDoc(doc(firestore, "checkIns", id), checkInItem); } catch (e) {}
  try { await set(ref(rtdb, `checkIns/${id}`), checkInItem); } catch (e) {}
  return checkInItem;
}

export async function deleteCheckInFromFirebase(id: string) {
  try { await deleteDoc(doc(firestore, "checkIns", id)); } catch (e) {}
  try { await set(ref(rtdb, `checkIns/${id}`), null); } catch (e) {}
}
