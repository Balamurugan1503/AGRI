import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "./firebase";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper to ensure non-null auth instance or throw
function getAuthOrThrow() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase auth not initialized");
  return auth;
}

// Helper to ensure non-null db instance or throw
function getDbOrThrow() {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore not initialized");
  return db;
}

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, name: string) => {
  try {
    const auth = getAuthOrThrow();
    const db = getDbOrThrow();

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (name && user) {
      await updateProfile(user, { displayName: name });
    }

    const userProfile = {
      name,
      email: user.email!,
      role: "farmer",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", user.uid), userProfile, { merge: true });

    return { user, profile: { ...userProfile } };
  } catch (error: any) {
    const message = typeof error === "string" ? error : error?.message ?? "Sign up failed";
    throw new Error(message);
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const auth = getAuthOrThrow();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    const message = typeof error === "string" ? error : error?.message ?? "Sign in failed";
    throw new Error(message);
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const auth = getAuthOrThrow();
    const db = getDbOrThrow();
    const provider = new GoogleAuthProvider();

    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      const userProfile = {
        name: user.displayName || "User",
        email: user.email!,
        role: "farmer",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, userProfile);
    } else {
      await setDoc(userDocRef, { updatedAt: serverTimestamp() }, { merge: true });
    }

    return user;
  } catch (error: any) {
    const message = typeof error === "string" ? error : error?.message ?? "Google sign-in failed";
    throw new Error(message);
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    const auth = getAuthOrThrow();
    await signOut(auth);
  } catch (error: any) {
    const message = typeof error === "string" ? error : error?.message ?? "Sign out failed";
    throw new Error(message);
  }
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const db = getDbOrThrow();
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as any;
      const createdAt =
        typeof data.createdAt?.toDate === "function" ? data.createdAt.toDate() : data.createdAt ?? null;
      const updatedAt =
        typeof data.updatedAt?.toDate === "function" ? data.updatedAt.toDate() : data.updatedAt ?? null;

      return {
        uid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        createdAt: createdAt ?? new Date(),
        updatedAt: updatedAt ?? new Date(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  try {
    const auth = getAuthOrThrow();
    return onAuthStateChanged(auth, callback);
  } catch (error) {
    console.error("Firebase auth not initialized for onAuthStateChanged");
    // Return noop unsubscribe function if auth not initialized to avoid runtime errors
    return () => {};
  }
};

// Get Firebase ID token
export const getIdToken = async (): Promise<string | null> => {
  try {
    const auth = getAuthOrThrow();
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  } catch (error) {
    console.error("Error getting ID token:", error);
    return null;
  }
};

