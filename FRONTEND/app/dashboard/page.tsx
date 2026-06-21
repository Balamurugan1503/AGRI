"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, BarChart3, MapPin, MessageSquare, ArrowRight, Sprout, ClipboardList } from "lucide-react"
import { StaticFertilizerChart } from "@/components/dashboard/static-fertilizer-chart"
import { RecentPosts } from "@/components/dashboard/RecentPosts"
import { motion } from "framer-motion"

// Types
type Farm = { farm_id: string; name?: string; location?: string }
type FirestoreTimestamp = { _seconds: number; _nanoseconds: number }
type Prediction = {
  farm_id: string
  created_at: FirestoreTimestamp
  outputs?: {
    predicted_yield_kg_per_ha?: number
    fertilizer_recommendation?: { recommended_fertilizer?: string }
  }
}
type FarmsResponse = { farms: Farm[] }
type PredictionsResponse = { predictions: Prediction[] }

// Helper function to get milliseconds from timestamp
function getMs(timestamp: any): number {
  if (!timestamp) return 0;
  if (typeof timestamp === "string") return Date.parse(timestamp);
  if (typeof timestamp === "number") return timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  if (typeof timestamp === "object") {
    if (typeof timestamp._seconds === "number") return timestamp._seconds * 1000;
    if (typeof timestamp.seconds === "number") return timestamp.seconds * 1000;
  }
  return 0;
}

// Helper function to calculate “time ago”
function getTimeAgo(timestamp: any) {
  const ms = getMs(timestamp);
  if (!ms) return "Just now";
  const now = Date.now();
  const diffMs = now - ms;

  if (diffMs < 1000) return "Just now";

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  if (diffSeconds > 0) return `${diffSeconds} second${diffSeconds > 1 ? "s" : ""} ago`;

  return "Just now";
}

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
}

export default function DashboardPage() {
  const { user, profile, loading, t } = useAuth()
  const [farms, setFarms] = useState<Farm[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [lastPredictionTime, setLastPredictionTime] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }
    if (user) {
      loadDashboardData()
    }
  }, [user, loading, router])

  const loadDashboardData = async () => {
    try {
      const [farmsResponse, predictionsResponse] = await Promise.all([
        apiClient.getFarms() as Promise<FarmsResponse>,
        apiClient.getPredictions() as Promise<PredictionsResponse>,
      ])
      setFarms(farmsResponse.farms)
      setPredictions(predictionsResponse.predictions)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    if (!predictions.length) {
      setLastPredictionTime(null)
      return
    }
    const updateTime = () => {
      const latestPrediction = [...predictions].sort(
        (a, b) => getMs(b.created_at) - getMs(a.created_at)
      )[0]
      setLastPredictionTime(getTimeAgo(latestPrediction.created_at))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [predictions])

  if (loading || isLoadingData) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-green-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
            <Sprout className="absolute inset-0 m-auto w-6 h-6 text-green-600 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-slate-500 animate-pulse tracking-widest uppercase">{t("Loading workspace...")}</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) return null
  
  const farmNameMap = new Map<string, string>();
  farms.forEach(farm => {
    if (farm.farm_id && farm.name) {
      farmNameMap.set(farm.farm_id, farm.name);
    }
  });

  const getFarmName = (farmId: string) => {
    return farmNameMap.get(farmId) || `${t("Farm ID")}: ${farmId}`;
  };
  
  const avgYield =
    predictions.length > 0
      ? predictions.reduce((sum, pred) => sum + (pred.outputs?.predicted_yield_kg_per_ha ?? 0), 0) / predictions.length
      : 0

  return (
    <DashboardLayout>
      <motion.div 
        className="space-y-8 sm:space-y-10"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header with Tamil Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold tracking-widest uppercase mb-3 border border-green-200 shadow-sm">
              <span>வணக்கம் 👋</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
              {t("Welcome back, ")}{profile?.name?.split(' ')[0]} 🌾
            </h1>
            <p className="text-slate-500 font-medium text-base">
              {t("Here's what's happening on your farms today.")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/predictions/new">
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 transition-all duration-300 rounded-full px-6">
                <Plus className="w-4 h-4 mr-2" />
                {t("New Prediction")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards Layout */}
        <StatsCards
          totalFarms={farms.length}
          totalPredictions={predictions.length}
          avgYield={avgYield}
          lastPrediction={lastPredictionTime ?? t("No predictions yet")}
        />

        {/* Quick Actions Grid - Glassmorphism UI */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(22,163,74,0.08)] transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-amber-100/80 rounded-2xl flex items-center justify-center mb-4 border border-amber-200/50 shadow-inner">
                <MapPin className="w-6 h-6 text-amber-600" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">{t("Farm Management")}</CardTitle>
              <CardDescription className="text-slate-500 font-medium mt-1.5">{t("Map your fields and add details for accurate soil tracking.")}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3 pt-2">
              <Link href="/dashboard/farms" className="w-full">
                <Button variant="outline" className="w-full rounded-xl bg-white/50 border-slate-200 hover:bg-white text-slate-700 font-semibold shadow-sm">{t("View Farms")}</Button>
              </Link>
              <Link href="/dashboard/farms/new">
                <Button className="rounded-xl bg-amber-500 hover:bg-amber-400 text-white shadow-md border-0"><Plus className="w-4 h-4" /></Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(22,163,74,0.08)] transition-all duration-300 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-green-500/10 blur-[40px] rounded-full pointer-events-none"></div>
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-green-100/80 rounded-2xl flex items-center justify-center mb-4 border border-green-200/50 shadow-inner">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">{t("Yield Intelligence")}</CardTitle>
              <CardDescription className="text-slate-500 font-medium mt-1.5">{t("Compute future harvests with our neural network models.")}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3 pt-2">
              <Link href="/dashboard/predictions" className="w-full">
                <Button variant="outline" className="w-full rounded-xl bg-white/50 border-slate-200 hover:bg-white text-slate-700 font-semibold shadow-sm">{t("View History")}</Button>
              </Link>
              <Link href="/dashboard/predictions/new">
                 <Button className="rounded-xl bg-green-500 hover:bg-green-400 text-white shadow-md border-0"><Plus className="w-4 h-4" /></Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(22,163,74,0.08)] transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-blue-100/80 rounded-2xl flex items-center justify-center mb-4 border border-blue-200/50 shadow-inner">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">{t("Community Forum")}</CardTitle>
              <CardDescription className="text-slate-500 font-medium mt-1.5">{t("Ask questions and share village insights with other farmers.")}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3 pt-2">
              <Link href="/dashboard/community" className="w-full">
                <Button variant="outline" className="w-full rounded-xl bg-white/50 border-slate-200 hover:bg-white text-slate-700 font-semibold shadow-sm">{t("Join Discussion")}</Button>
              </Link>
              <Link href="/dashboard/community/new">
                <Button className="rounded-xl bg-blue-500 hover:bg-blue-400 text-white shadow-md border-0"><Plus className="w-4 h-4" /></Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Chart & Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/60 bg-white/50 backdrop-blur-xl">
             <StaticFertilizerChart />
          </div>

          <div className="rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/60 bg-white/70 backdrop-blur-xl flex flex-col">
            <div className="p-6 border-b border-slate-100/60 pb-4">
                <h3 className="text-xl font-bold text-slate-900">{t("Recent Predictions")}</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">{t("Your latest AI-driven yield forecasts")}</p>
            </div>
            
            <div className="flex-1 p-6 flex flex-col justify-center">
              {predictions.length > 0 ? (
                <div className="space-y-4">
                  {predictions.slice(0, 3).map((prediction, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/60 border border-slate-100/80 rounded-[16px] hover:shadow-sm hover:border-green-100 transition-all cursor-default group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{getFarmName(prediction.farm_id)}</p>
                          <p className="text-sm font-medium text-green-600 mt-0.5">
                            {(prediction.outputs?.predicted_yield_kg_per_ha ?? 0).toFixed(1)} {t("kg / hectare")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {new Date(getMs(prediction.created_at)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {predictions.length > 3 && (
                    <Link href="/dashboard/predictions" className="inline-flex items-center text-sm font-semibold text-green-600 hover:text-green-700 mt-2">
                       {t("View all predictions")} <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-green-100">
                     <Sprout className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{t("No predictions yet")}</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">{t("Start your first prediction 🌱 to forecast your upcoming harvest yield and get AI suggestions.")}</p>
                  <Link href="/dashboard/predictions/new">
                    <Button className="rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-md font-semibold px-6 hover:scale-105 transition-transform">
                      {t("New Prediction")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Community Posts Section */}
        <div className="rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/60 bg-white/70 backdrop-blur-xl pb-2">
           <RecentPosts />
        </div>

      </motion.div>
    </DashboardLayout>
  )
}
