"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase"

interface LocalUser {
  uid: string
  email: string | null
  displayName: string | null
}

const translations: Record<string, Record<string, string>> = {
  tamil: {
    "Dashboard": "டாஷ்போர்டு",
    "My Farms": "எனது பண்ணைகள்",
    "Predictions": "முன்னறிவிப்புகள்",
    "Profile": "சுயவிவரம்",
    "Settings": "அமைப்புகள்",
    "Welcome back": "மீண்டும் வருக",
    "Welcome back, ": "மீண்டும் வருக, ",
    "New Prediction": "புதிய முன்னறிவிப்பு",
    "Farm Management": "பண்ணை மேலாண்மை",
    "Yield Intelligence": "அறுவடை நுண்ணறிவு",
    "Community Forum": "சமூக மன்றம்",
    "Log Out": "வெளியேறு",
    "Save Changes": "மாற்றங்களைச் சேமி",
    "Delete Account": "கணக்கை நீக்கு",
    "User Settings": "பயனர் அமைப்புகள்",
    "Manage your profile and preferences": "உங்கள் சுயவிவரம் மற்றும் விருப்பங்களை நிர்வகிக்கவும்",
    "Username / Full Name": "பயனர் பெயர் / முழு பெயர்",
    "Email Address": "மின்னஞ்சல் முகவரி",
    "Notifications": "அறிவிப்புகள்",
    "Manage real-time farming alerts and updates": "நிகழ்நேர விவசாய விழிப்பூட்டல்கள் மற்றும் புதுப்பிப்புகளை நிர்வகிக்கவும்",
    "Email Notifications": "மின்னஞ்சல் அறிவிப்புகள்",
    "Weekly reports and agricultural tips straight to your inbox": "வாராந்திர அறிக்கைகள் மற்றும் விவசாய குறிப்புகள் உங்கள் மின்னஞ்சலுக்கு",
    "Weather Alerts": "வானிலை விழிப்பூட்டல்கள்",
    "Instant warnings on storm, high-temperature, or drought conditions": "புயல், அதிக வெப்பநிலை அல்லது வறட்சி நிலைகள் குறித்த உடனடி எச்சரிக்கைகள்",
    "Crop Advisory Alerts": "பயிர் ஆலோசனை விழிப்பூட்டல்கள்",
    "AI-驱动 உரமிடுதல் படிகள் மற்றும் அறுவடை அறிவிப்புகள்": "AI-உந்துதல் உரமிடுதல் படிகள் மற்றும் அறுவடை அறிவிப்புகள்",
    "Crop Advisory Alerts ": "பயிர் ஆலோசனை விழிப்பூட்டல்கள்",
    "AI-driven fertilization steps and harvest notifications": "AI-உந்துதல் உரமிடுதல் படிகள் மற்றும் அறுவடை அறிவிப்புகள்",
    "Disease Detection Alerts": "நோய் கண்டறிதல் விழிப்பூட்டல்கள்",
    "Early warning reports on local farm disease outbreaks": "உள்ளூர் பண்ணை நோய் வெடிப்புகள் பற்றிய ஆரம்ப எச்சரிக்கை அறிக்கைகள்",
    "Appearance": "தோற்றம்",
    "Switch AgriForecast visual display theme": "பார்வை காட்சி தீம் மாற்றவும்",
    "Light Mode": "பகல் முறை",
    "Dark Mode": "இரவு முறை",
    "Language & Region": "மொழி மற்றும் பகுதி",
    "Select your language settings for dashboard data": "டாஷ்போர்டு தரவுக்கான உங்கள் மொழி அமைப்புகளைத் தேர்ந்தெடுக்கவும்",
    "System Language": "கணினி மொழி",
    "Danger Zone": "அபாய பகுதி",
    "Irreversible actions for your account management": "உங்கள் கணக்கு நிர்வாகத்திற்கான மாற்ற முடியாத செயல்கள்",
    "Safely sign out from current session": "தற்போதைய அமர்விலிருந்து பாதுகாப்பாக வெளியேறவும்",
    "Permanently delete your profile and predict history": "உங்கள் சுயவிவரம் மற்றும் கணிப்பு வரலாற்றை நிரந்தரமாக நீக்கவும்",
    "Are you absolutely sure?": "நிச்சயமாக நீக்க வேண்டுமா?",
    "Cancel": "ரத்துசெய்",
    "Yes, Delete Account": "ஆம், கணக்கை நீக்கு",
    "Customize your AgriForecast experience": "உங்கள் AgriForecast அனுபவத்தைத் தனிப்பயனாக்குங்கள்",
    "Save Profile": "சுயவிவரத்தைச் சேமி",
    "Saving...": "சேமிக்கப்படுகிறது...",
    "Premium Account": "பிரீமியம் கணக்கு",
    "Search farms, predictions...": "பண்ணைகள், முன்னறிவிப்புகளைத் தேடுங்கள்...",
    "Here's what's happening on your farms today.": "இன்று உங்கள் பண்ணைகளில் நடப்பது இதோ.",
    "View History": "வரலாற்றைக் காண்க",
    "Join Discussion": "விவாதத்தில் இணையுங்கள்",
    "Recent Predictions": "சமீபத்திய முன்னறிவிப்புகள்",
    "Your latest AI-driven yield forecasts": "உங்கள் சமீபத்திய AI-உந்துதல் மகசூல் கணிப்புகள்",
    "No predictions yet": "இன்னும் கணிப்புகள் எதுவும் இல்லை",
    "View Farms": "பண்ணைகளைக் காண்க",
    "Total Farms": "மொத்த பண்ணைகள்",
    "Total Predictions": "மொத்த கணிப்புகள்",
    "Average Predicted Yield": "சராசரி கணிக்கப்பட்ட மகசூல்",
    "Last Forecast": "கடைசி முன்னறிவிப்பு",
    "No predictions yet 🌱": "இன்னும் கணிப்புகள் இல்லை 🌱",
    "kg / hectare": "கிலோ / ஹெக்டேர்"
  },
  hindi: {
    "Dashboard": "डैशबोर्ड",
    "My Farms": "मेरे खेत",
    "Predictions": "पूर्वानुमान",
    "Profile": "प्रोफ़ाइल",
    "Settings": "सेटिंग्स",
    "Welcome back": "फिर से स्वागत है",
    "Welcome back, ": "फिर से स्वागत है, ",
    "New Prediction": "नया पूर्वानुमान",
    "Farm Management": "कृषि प्रबंधन",
    "Yield Intelligence": "उपज बुद्धिमत्ता",
    "Community Forum": "सामुदायिक मंच",
    "Log Out": "लॉग आउट",
    "Save Changes": "बदलाव सहेजें",
    "Delete Account": "खाता हटाएँ",
    "User Settings": "उपयोगकर्ता सेटिंग्स",
    "Manage your profile and preferences": "अपनी प्रोफ़ाइल और प्राथमिकताओं को प्रबंधित करें",
    "Username / Full Name": "उपयोगकर्ता नाम / पूरा नाम",
    "Email Address": "ईमेल पता",
    "Notifications": "सूचनाएं",
    "Manage real-time farming alerts and updates": "वास्तविक समय कृषि अलर्ट और अपडेट प्रबंधित करें",
    "Email Notifications": "ईमेल सूचनाएं",
    "Weekly reports and agricultural tips straight to your inbox": "साप्ताहिक रिपोर्ट और कृषि युक्तियाँ सीधे आपके इनबॉक्स में",
    "Weather Alerts": "मौसम अलर्ट",
    "Instant warnings on storm, high-temperature, or drought conditions": "तूफान, उच्च तापमान, या सूखे की स्थिति पर त्वरित चेतावनी",
    "Crop Advisory Alerts": "पसलियाँ सलाहकार अलर्ट",
    "AI-driven fertilization steps and harvest notifications": "एआई-संचालित उर्वरीकरण कदम और फसल कटाई सूचनाएं",
    "Disease Detection Alerts": "रोग पहचान अलर्ट",
    "Early warning reports on local farm disease outbreaks": "स्थानीय कृषि रोग के प्रकोप पर प्रारंभिक चेतावनी रिपोर्ट",
    "Appearance": "प्रकटन",
    "Switch AgriForecast visual display theme": "दृश्य प्रदर्शन थीम बदलें",
    "Light Mode": "लाइट मोड",
    "Dark Mode": "डार्क मोड",
    "Language & Region": "भाषा और क्षेत्र",
    "Select your language settings for dashboard data": "डैशबोर्ड डेटा के लिए अपनी भाषा सेटिंग्स चुनें",
    "System Language": "सिस्टम भाषा",
    "Danger Zone": "खतरे का क्षेत्र",
    "Irreversible actions for your account management": "आपके खाता प्रबंधन के लिए अपरिवर्तनीय कार्य",
    "Safely sign out from current session": "वर्तमान सत्र से सुरक्षित रूप से लॉग आउट करें",
    "Permanently delete your profile and predict history": "अपनी प्रोफ़ाइल और पूर्वानुमान इतिहास को स्थायी रूप से हटाएं",
    "Are you absolutely sure?": "क्या आप पूरी तरह से आश्वस्त हैं?",
    "Cancel": "रद्द करें",
    "Yes, Delete Account": "हां, खाता हटाएं",
    "Customize your AgriForecast experience": "अपने AgriForecast अनुभव को अनुकूलित करें",
    "Save Profile": "प्रोफ़ाइल सहेजें",
    "Saving...": "सहेज रहा है...",
    "Premium Account": "प्रीमियम खाता",
    "Search farms, predictions...": "खेतों, पूर्वानुमानों की खोज करें...",
    "Here's what's happening on your farms today.": "आज आपके खेतों में क्या हो रहा है, यहाँ देखें।",
    "View History": "इतिहास देखें",
    "Join Discussion": "चर्चा में शामिल हों",
    "Recent Predictions": "हाल के पूर्वानुमान",
    "Your latest AI-driven yield forecasts": "आपकी नवीनतम एआई-संचालित उपज पूर्वानुमान",
    "No predictions yet": "अभी तक कोई पूर्वानुमान नहीं",
    "View Farms": "खेत देखें",
    "Total Farms": "कुल खेत",
    "Total Predictions": "कुल पूर्वानुमान",
    "Average Predicted Yield": "औसत अनुमानित उपज",
    "Last Forecast": "अंतिम पूर्वानुमान",
    "No predictions yet 🌱": "अभी तक कोई पूर्वानुमान नहीं 🌱",
    "kg / hectare": "किग्रा / हेक्टेयर"
  }
}

interface AuthContextType {
  user: LocalUser | null
  profile: any | null
  loading: boolean
  refreshProfile: () => Promise<void>
  firebaseConfigured: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  language: string
  setLanguage: (lang: string) => Promise<void>
  t: (key: string) => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [firebaseConfigured, setFirebaseConfigured] = useState(false)
  const [language, setLanguageState] = useState("english")
  const router = useRouter()

  const refreshProfile = async () => {
    if (!user || !firebaseConfigured) return

    const db = getFirebaseDb()
    if (!db) return

    try {
      const docRef = db.collection("users").doc(user.uid)
      const docSnap = await docRef.get()

      if (docSnap.exists) {
        const data = docSnap.data()
        setProfile(data)
        if (data?.language) {
          setLanguageState(data.language)
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  const setLanguage = async (lang: string) => {
    setLanguageState(lang)
    try {
      const db = getFirebaseDb()
      if (db && user) {
        await db.collection("users").doc(user.uid).set({
          language: lang
        }, { merge: true })
        await refreshProfile()
      } else {
        localStorage.setItem("language", lang)
      }
    } catch (error) {
      console.error("Error saving language preference:", error)
    }
  }

  const t = (key: string): string => {
    if (!translations[language]) return key
    return translations[language][key] || key
  }

  const signIn = async (email: string, password: string) => {
    if (!firebaseConfigured) {
      throw new Error("Firebase is not configured")
    }

    const auth = getFirebaseAuth()
    if (!auth) {
      throw new Error("Firebase Auth is not available")
    }

    try {
      const result = await auth.signInWithEmailAndPassword(email, password)
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Sign in error:", error)
      throw new Error(error.message || "Failed to sign in")
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    if (!firebaseConfigured) {
      throw new Error("Firebase is not configured")
    }

    const auth = getFirebaseAuth()
    const db = getFirebaseDb()
    if (!auth || !db) {
      throw new Error("Firebase services are not available")
    }

    try {
      const result = await auth.createUserWithEmailAndPassword(email, password)

      if (result.user) {
        // Create user profile in Firestore
        await db.collection("users").doc(result.user.uid).set({
          uid: result.user.uid,
          name: name,
          email: email,
          role: "farmer",
          language: language,
          createdAt: new Date().toISOString(),
        })
      }

      router.push("/dashboard")
    } catch (error: any) {
      console.error("Sign up error:", error)
      throw new Error(error.message || "Failed to create account")
    }
  }

  const signOut = async () => {
    if (!firebaseConfigured) {
      setUser(null)
      setProfile(null)
      router.push("/login")
      return
    }

    const auth = getFirebaseAuth()
    if (!auth) return

    try {
      await auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const configured = isFirebaseConfigured()
    setFirebaseConfigured(configured)

    if (!configured) {
      setLoading(false)
      const cachedLang = localStorage.getItem("language")
      if (cachedLang) {
        setLanguageState(cachedLang)
      }
      return
    }

    const auth = getFirebaseAuth()
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const localUser: LocalUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        }
        setUser(localUser)

        // Fetch user profile
        const db = getFirebaseDb()
        if (db) {
          try {
            const docRef = db.collection("users").doc(firebaseUser.uid)
            const docSnap = await docRef.get()

            if (docSnap.exists) {
              const data = docSnap.data()
              setProfile(data)
              if (data?.language) {
                setLanguageState(data.language)
              }
            }
          } catch (error) {
            console.error("Error fetching user profile:", error)
          }
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        refreshProfile,
        firebaseConfigured,
        signIn,
        signUp,
        signOut,
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
