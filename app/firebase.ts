import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue, set, get, child } from "firebase/database";
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
export const db = getDatabase(app);

// REALTIME LISTENERS & WRITERS

// 1. Wedding Data Sync
export function subscribeWeddingData(callback: (data: WeddingData | null) => void) {
  const weddingRef = ref(db, "weddingData");
  return onValue(
    weddingRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback(null);
      }
    },
    (error) => {
      console.warn("Firebase Realtime DB read error:", error);
    }
  );
}

export async function saveWeddingDataToFirebase(data: WeddingData) {
  try {
    const weddingRef = ref(db, "weddingData");
    await set(weddingRef, data);
    return true;
  } catch (error) {
    console.error("Failed to save to Firebase:", error);
    return false;
  }
}

// 2. Wishes Sync
export function subscribeWishes(callback: (wishes: WishItem[]) => void) {
  const wishesRef = ref(db, "wishes");
  return onValue(
    wishesRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        // Convert object dictionary or array to array
        const list: WishItem[] = Array.isArray(val)
          ? val.filter(Boolean)
          : Object.keys(val).map((k) => ({ ...val[k], id: k }));
        callback(list.reverse());
      } else {
        callback([]);
      }
    },
    (error) => {
      console.warn("Firebase wishes read error:", error);
    }
  );
}

export async function addWishToFirebase(wish: WishItem) {
  try {
    const wishRef = ref(db, `wishes/${wish.id}`);
    await set(wishRef, wish);
  } catch (error) {
    console.error("Failed to add wish to Firebase:", error);
  }
}

export async function deleteWishFromFirebase(wishId: string) {
  try {
    const wishRef = ref(db, `wishes/${wishId}`);
    await set(wishRef, null);
  } catch (error) {
    console.error("Failed to delete wish from Firebase:", error);
  }
}

// 3. RSVP Sync
export function subscribeRSVPs(callback: (rsvps: RSVPItem[]) => void) {
  const rsvpRef = ref(db, "rsvps");
  return onValue(
    rsvpRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: RSVPItem[] = Array.isArray(val)
          ? val.filter(Boolean)
          : Object.keys(val).map((k) => ({ ...val[k], id: k }));
        callback(list.reverse());
      } else {
        callback([]);
      }
    },
    (error) => {
      console.warn("Firebase RSVP read error:", error);
    }
  );
}

export async function addRSVPToFirebase(rsvp: RSVPItem) {
  try {
    const rsvpRef = ref(db, `rsvps/${rsvp.id}`);
    await set(rsvpRef, rsvp);
  } catch (error) {
    console.error("Failed to add RSVP to Firebase:", error);
  }
}

export async function deleteRSVPFromFirebase(rsvpId: string) {
  try {
    const rsvpRef = ref(db, `rsvps/${rsvpId}`);
    await set(rsvpRef, null);
  } catch (error) {
    console.error("Failed to delete RSVP from Firebase:", error);
  }
}
