// lib/firebase.ts
import firebase from "firebase/compat/app"
import "firebase/compat/auth"
import "firebase/compat/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
}

export const isFirebaseConfigured = (): boolean => {
  const requiredVars = [
    firebaseConfig.apiKey,
    firebaseConfig.authDomain,
    firebaseConfig.projectId,
    firebaseConfig.storageBucket,
    firebaseConfig.messagingSenderId,
    firebaseConfig.appId,
  ]

  return requiredVars.every((value) => value && value.trim() !== "" && value !== "undefined")
}

let firebaseInitialized = false

const initializeFirebase = () => {
  if (typeof window === "undefined" || firebaseInitialized) {
    return
  }

  if (!isFirebaseConfigured()) {
    console.warn("Firebase configuration is incomplete")
    return
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig)
      console.log("Firebase initialized successfully with compat SDK")
    }
    firebaseInitialized = true
  } catch (error) {
    console.error("Failed to initialize Firebase:", error)
  }
}

// Initialize Firebase
initializeFirebase()

export const getFirebaseAuth = (): firebase.auth.Auth | null => {
  if (typeof window === "undefined" || !firebaseInitialized) {
    return null
  }

  try {
    return firebase.auth()
  } catch (error) {
    console.error("Error getting Firebase auth:", error)
    return null
  }
}

export const getFirebaseDb = (): firebase.firestore.Firestore | null => {
  if (typeof window === "undefined" || !firebaseInitialized) {
    return null
  }

  try {
    return firebase.firestore()
  } catch (error) {
    console.error("Error getting Firebase firestore:", error)
    return null
  }
}

export const getFirebaseApp = (): firebase.app.App | null => {
  if (typeof window === "undefined" || !firebaseInitialized) {
    return null
  }

  try {
    return firebase.app()
  } catch (error) {
    console.error("Error getting Firebase app:", error)
    return null
  }
}

// Export instances (null if not initialized)
export const auth: firebase.auth.Auth | null = getFirebaseAuth()
export const db: firebase.firestore.Firestore | null = getFirebaseDb()


