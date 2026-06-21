"use client"
import React, { useState, useEffect, useRef } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "next-themes"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { signOutUser } from "@/lib/auth"
import { 
  User, 
  Mail, 
  Bell, 
  Sun, 
  Moon, 
  Globe, 
  LogOut, 
  Trash2, 
  Edit2, 
  Check, 
  Leaf,
  Settings,
  ShieldAlert,
  Loader2,
  Sparkles,
  CloudSun,
  Eye,
  Info
} from "lucide-react"
import { motion } from "framer-motion"

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut, t } = useAuth()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Profile states
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Notification states
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [weatherAlerts, setWeatherAlerts] = useState(true)
  const [cropAdvisoryAlerts, setCropAdvisoryAlerts] = useState(true)
  const [diseaseAlerts, setDiseaseAlerts] = useState(false)

  // Language state
  const [language, setLanguage] = useState("english")

  // Mounting state to handle SSR theme mismatch hydration safely
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Pre-populate fields from the authenticated user profile or localStorage fallback
  useEffect(() => {
    if (profile) {
      setUsername(profile.name || "")
      setEmail(profile.email || user?.email || "")
      if (profile.emailNotifications !== undefined) setEmailNotifications(profile.emailNotifications)
      if (profile.weatherAlerts !== undefined) setWeatherAlerts(profile.weatherAlerts)
      if (profile.cropAdvisoryAlerts !== undefined) setCropAdvisoryAlerts(profile.cropAdvisoryAlerts)
      if (profile.diseaseAlerts !== undefined) setDiseaseAlerts(profile.diseaseAlerts)
      if (profile.language !== undefined) setLanguage(profile.language)
    } else {
      if (user) {
        setEmail(user.email || "")
      }
      const cachedEmail = localStorage.getItem("emailNotifications")
      const cachedWeather = localStorage.getItem("weatherAlerts")
      const cachedCrop = localStorage.getItem("cropAdvisoryAlerts")
      const cachedDisease = localStorage.getItem("diseaseAlerts")
      const cachedLang = localStorage.getItem("language")

      if (cachedEmail !== null) setEmailNotifications(JSON.parse(cachedEmail))
      if (cachedWeather !== null) setWeatherAlerts(JSON.parse(cachedWeather))
      if (cachedCrop !== null) setCropAdvisoryAlerts(JSON.parse(cachedCrop))
      if (cachedDisease !== null) setDiseaseAlerts(JSON.parse(cachedDisease))
      if (cachedLang !== null) setLanguage(cachedLang)
    }
  }, [profile, user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    try {
      await apiClient.updateProfile({
        name: username,
        email: email,
        phone: profile?.phone || "",
        role: profile?.role || "farmer"
      })
      await refreshProfile()
      toast({
        title: t("Profile saved"),
        description: t("Your settings have been updated successfully."),
      })
    } catch (error: any) {
      toast({
        title: t("Error saving profile"),
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleToggleNotification = async (key: string, value: boolean) => {
    if (key === "emailNotifications") setEmailNotifications(value)
    if (key === "weatherAlerts") setWeatherAlerts(value)
    if (key === "cropAdvisoryAlerts") setCropAdvisoryAlerts(value)
    if (key === "diseaseAlerts") setDiseaseAlerts(value)

    try {
      const db = getFirebaseDb()
      if (db && user) {
        await db.collection("users").doc(user.uid).set({
          [key]: value
        }, { merge: true })
        await refreshProfile()
      } else {
        localStorage.setItem(key, JSON.stringify(value))
      }
      toast({
        title: t("Preference saved"),
        description: t("Notification preferences updated successfully."),
      })
    } catch (error: any) {
      toast({
        title: t("Failed to save preference"),
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleLanguageChange = async (value: string) => {
    setLanguage(value)
    try {
      const db = getFirebaseDb()
      if (db && user) {
        await db.collection("users").doc(user.uid).set({
          language: value
        }, { merge: true })
        await refreshProfile()
      } else {
        localStorage.setItem("language", value)
      }
      toast({
        title: t("Language updated"),
        description: `${t("Language set to")} ${value === "english" ? "English" : value === "tamil" ? "Tamil" : "Hindi"}.`,
      })
    } catch (error: any) {
      toast({
        title: t("Failed to update language"),
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    try {
      await signOutUser()
      toast({
        title: t("Signed out successfully"),
        description: t("You have been signed out of your account."),
      })
      window.location.href = "/login"
    } catch (error: any) {
      toast({
        title: t("Sign out failed"),
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const db = getFirebaseDb()
      if (db && user) {
        await db.collection("users").doc(user.uid).delete()
      }
      
      const auth = getFirebaseAuth()
      if (auth && auth.currentUser) {
        await auth.currentUser.delete()
      }
      
      toast({
        title: t("Account deleted"),
        description: t("Your account and data have been removed."),
        variant: "destructive",
      })
      window.location.href = "/login"
    } catch (error: any) {
      toast({
        title: t("Action failed"),
        description: t("For security, deleting your account requires recent authentication. Please sign out and sign back in before trying again."),
        variant: "destructive",
      })
    }
  }

  const userInitials = username
    ? username.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "U"

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      } 
    }
  } as const

  return (
    <DashboardLayout>
      <div className="relative max-w-[900px] mx-auto space-y-8 pb-12 z-10">
        
        {/* Subtle plant/leaf SVG decorations in the background */}
        <div className="absolute top-10 right-[-80px] pointer-events-none opacity-5 dark:opacity-[0.03] text-green-600 animate-pulse hidden xl:block z-[-1]">
          <Leaf size={140} className="rotate-[45deg]" />
        </div>
        <div className="absolute bottom-40 left-[-100px] pointer-events-none opacity-5 dark:opacity-[0.03] text-emerald-600 animate-pulse hidden xl:block z-[-1]">
          <Leaf size={180} className="rotate-[-30deg]" />
        </div>

        {/* 1. Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 p-6 sm:p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[40px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg ring-4 ring-green-100 dark:ring-green-950/40 relative">
                {userInitials}
              </div>
              <button 
                onClick={() => nameInputRef.current?.focus()}
                className="absolute -bottom-1 -right-1 p-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500 hover:text-green-600 transition-colors"
                title={t("Edit Username")}
              >
                <Edit2 size={13} />
              </button>
            </div>

            <div className="text-center sm:text-left space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {username || t("User profile")}
                </h1>
                <span className="inline-flex self-center sm:self-auto items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200/50 dark:border-green-900/30">
                  <Sparkles size={12} className="mr-1" /> {t("Premium Account")}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {email || t("Configure email address")}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t("Customize your AgriForecast experience")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Cards Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* PROFILE CARD */}
          <motion.div variants={cardVariants}>
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[24px]">
              <CardHeader className="pb-3 flex flex-row items-center gap-3 space-y-0">
                <div className="p-2.5 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-xl">
                  <User size={18} />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">{t("User Settings")}</CardTitle>
                  <CardDescription>{t("Manage your profile and preferences")}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="username" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {t("Username / Full Name")}
                      </Label>
                      <Input
                        ref={nameInputRef}
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={t("Enter your username")}
                        required
                        className="rounded-xl border-slate-200 dark:border-slate-800 focus:border-green-500 bg-white/50 dark:bg-slate-950/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {t("Email Address")}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("Enter your email")}
                        required
                        className="rounded-xl border-slate-200 dark:border-slate-800 focus:border-green-500 bg-white/50 dark:bg-slate-950/50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button 
                      type="submit" 
                      disabled={isSavingProfile}
                      className="rounded-full px-6 bg-green-600 hover:bg-green-500 text-white font-semibold transition-all duration-300 hover:shadow-md hover:shadow-green-500/10 flex items-center gap-2"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> {t("Saving...")}
                        </>
                      ) : (
                        <>{t("Save Changes")}</>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* NOTIFICATIONS CARD */}
          <motion.div variants={cardVariants}>
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[24px]">
              <CardHeader className="pb-3 flex flex-row items-center gap-3 space-y-0">
                <div className="p-2.5 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-xl">
                  <Bell size={18} />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">{t("Notifications")}</CardTitle>
                  <CardDescription>{t("Manage real-time farming alerts and updates")}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100 dark:divide-slate-800/50">
                
                {/* Toggle: Email Notifications */}
                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5 pr-4">
                    <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t("Email Notifications")}</Label>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{t("Weekly reports and agricultural tips straight to your inbox")}</p>
                  </div>
                  <Switch 
                    checked={emailNotifications}
                    onCheckedChange={(val) => handleToggleNotification("emailNotifications", val)}
                  />
                </div>

                {/* Toggle: Weather Alerts */}
                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5 pr-4">
                    <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t("Weather Alerts")}</Label>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{t("Instant warnings on storm, high-temperature, or drought conditions")}</p>
                  </div>
                  <Switch 
                    checked={weatherAlerts}
                    onCheckedChange={(val) => handleToggleNotification("weatherAlerts", val)}
                  />
                </div>

                {/* Toggle: Crop Advisory Alerts */}
                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5 pr-4">
                    <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t("Crop Advisory Alerts")}</Label>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{t("AI-driven fertilization steps and harvest notifications")}</p>
                  </div>
                  <Switch 
                    checked={cropAdvisoryAlerts}
                    onCheckedChange={(val) => handleToggleNotification("cropAdvisoryAlerts", val)}
                  />
                </div>

                {/* Toggle: Disease Detection Alerts */}
                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5 pr-4">
                    <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t("Disease Detection Alerts")}</Label>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{t("Early warning reports on local farm disease outbreaks")}</p>
                  </div>
                  <Switch 
                    checked={diseaseAlerts}
                    onCheckedChange={(val) => handleToggleNotification("diseaseAlerts", val)}
                  />
                </div>

              </CardContent>
            </Card>
          </motion.div>

          {/* APPEARANCE CARD */}
          <motion.div variants={cardVariants}>
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[24px]">
              <CardHeader className="pb-3 flex flex-row items-center gap-3 space-y-0">
                <div className="p-2.5 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-xl">
                  <Sun size={18} />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">{t("Appearance")}</CardTitle>
                  <CardDescription>{t("Switch AgriForecast visual display theme")}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {mounted ? (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Light theme option */}
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 ${
                        theme === "light"
                          ? "bg-green-50/50 dark:bg-green-950/20 border-green-500 dark:border-green-600 ring-2 ring-green-500/20 shadow-[0_0_20px_rgba(22,163,74,0.15)]"
                          : "bg-white/30 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {theme === "light" && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center">
                          <Check size={12} className="stroke-[3]" />
                        </div>
                      )}
                      <div className={`p-4 rounded-full mb-3 ${theme === "light" ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                        <Sun size={28} />
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{t("Light Mode")}</span>
                      <span className="text-[10px] text-slate-400 mt-1">Sunlit, high-contrast panels</span>
                    </button>

                    {/* Dark theme option */}
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 ${
                        theme === "dark"
                          ? "bg-green-50/50 dark:bg-green-950/20 border-green-500 dark:border-green-600 ring-2 ring-green-500/20 shadow-[0_0_20px_rgba(22,163,74,0.15)]"
                          : "bg-white/30 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {theme === "dark" && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center">
                          <Check size={12} className="stroke-[3]" />
                        </div>
                      )}
                      <div className={`p-4 rounded-full mb-3 ${theme === "dark" ? "bg-indigo-900/30 text-indigo-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                        <Moon size={28} />
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{t("Dark Mode")}</span>
                      <span className="text-[10px] text-slate-400 mt-1">Frosted, low-glare dark styling</span>
                    </button>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center">
                    <Loader2 className="animate-spin text-green-500" />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* LANGUAGE & REGION */}
          <motion.div variants={cardVariants}>
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[24px]">
              <CardHeader className="pb-3 flex flex-row items-center gap-3 space-y-0">
                <div className="p-2.5 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-xl">
                  <Globe size={18} />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">{t("Language & Region")}</CardTitle>
                  <CardDescription>{t("Select your language settings for dashboard data")}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 max-w-[280px]">
                  <Label htmlFor="language" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {t("System Language")}
                  </Label>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger id="language" className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="english" className="cursor-pointer">English</SelectItem>
                      <SelectItem value="tamil" className="cursor-pointer">Tamil (தமிழ்)</SelectItem>
                      <SelectItem value="hindi" className="cursor-pointer">Hindi (हिन्दी)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ACCOUNT & DANGER ZONE */}
          <motion.div variants={cardVariants}>
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-rose-200/50 dark:border-rose-950/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[24px]">
              <CardHeader className="pb-3 flex flex-row items-center gap-3 space-y-0">
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-rose-700 dark:text-rose-400">{t("Danger Zone")}</CardTitle>
                  <CardDescription>{t("Irreversible actions for your account management")}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t("Log Out")}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{t("Safely sign out from current session")}</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleSignOut}
                    className="rounded-full border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950 flex items-center gap-2 self-start sm:self-auto"
                  >
                    <LogOut size={16} /> {t("Log Out")}
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-rose-500/[0.03] border border-rose-200/40 dark:border-rose-950/20 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-rose-800 dark:text-rose-400">{t("Delete Account")}</p>
                    <p className="text-xs text-rose-500/70 dark:text-rose-500/50">{t("Permanently delete your profile and predict history")}</p>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        type="button" 
                        variant="destructive"
                        className="rounded-full px-5 bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-all hover:shadow-md hover:shadow-rose-500/10 flex items-center gap-2 self-start sm:self-auto"
                      >
                        <Trash2 size={16} /> {t("Delete Account")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl border-rose-200/80 dark:border-rose-950/40 max-w-md">
                      <AlertDialogHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center mb-3">
                          <Trash2 size={24} />
                        </div>
                        <AlertDialogTitle className="text-center font-extrabold text-xl text-slate-900 dark:text-white">{t("Are you absolutely sure?")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-sm text-slate-500 dark:text-slate-400 mt-2">
                          This action is irreversible. All of your crop predictions, farm details, and profile data will be permanently wiped out from AgriForecast.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-4 gap-2 sm:gap-0 justify-center">
                        <AlertDialogCancel className="rounded-full border-slate-200 hover:bg-slate-50">{t("Cancel")}</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAccount}
                          className="rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                        >
                          {t("Yes, Delete Account")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
