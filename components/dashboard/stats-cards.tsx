"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Leaf, BarChart3, TrendingUp, CalendarDays } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"

interface StatsCardsProps {
  totalFarms: number
  totalPredictions: number
  avgYield: number
  lastPrediction: string
}

function useCountUp(end: number, duration: number = 1000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(progress * end)
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }
    window.requestAnimationFrame(step)
  }, [end, duration])

  return count
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 15 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
} as const

export function StatsCards({ totalFarms, totalPredictions, avgYield, lastPrediction }: StatsCardsProps) {
  const { t } = useAuth()
  const animatedFarms = useCountUp(totalFarms, 1000)
  const animatedPredictions = useCountUp(totalPredictions, 1000)
  const animatedYield = useCountUp(avgYield, 1200)

  // Define stats array for mapping
  const stats = [
    {
      name: "Total Farms",
      value: Math.round(animatedFarms),
      description: "Active managed locations",
      icon: Leaf,
      iconBg: "bg-green-100/80",
      iconText: "text-green-600",
      iconBorder: "border-green-200/50",
    },
    {
      name: "Predictions",
      value: Math.round(animatedPredictions),
      description: "Total yield forecasts",
      icon: BarChart3,
      iconBg: "bg-emerald-100/80",
      iconText: "text-emerald-600",
      iconBorder: "border-emerald-200/50",
    },
    {
      name: "Avg. Yield",
      value: animatedYield.toFixed(1),
      description: "Avg kg/hectare expected",
      icon: TrendingUp,
      iconBg: "bg-lime-100/80",
      iconText: "text-lime-600",
      iconBorder: "border-lime-200/50",
    },
    {
      name: "Latest Activity",
      value: lastPrediction,
      description: "Time since last computation",
      icon: CalendarDays,
      iconBg: "bg-teal-100/80",
      iconText: "text-teal-600",
      iconBorder: "border-teal-200/50",
    },
  ]

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div 
            key={stat.name} 
            variants={cardVariants} 
            initial="hidden" 
            animate="visible" 
            transition={{ delay: i * 0.05 }}
          >
            <Card className="overflow-hidden bg-white/85 backdrop-blur-md border-white/40 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 rounded-[20px] relative">
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold tracking-tight text-slate-500">{t(stat.name)}</h3>
                  <div className={`w-10 h-10 rounded-full ${stat.iconBg} flex items-center justify-center ${stat.iconText} shadow-sm border ${stat.iconBorder} relative z-10`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold tracking-tight text-slate-900 mb-1 relative z-10">
                    {stat.value}
                  </div>
                  <p className="text-xs font-medium text-slate-400 relative z-10">{t(stat.description)}</p>
                </div>
              </CardContent>
              
              {/* Optional Decoration for the first card */}
              {i === 0 && (
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none z-0">
                  <Leaf className="w-24 h-24 -mr-8 -mt-8 text-green-500" />
                </div>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  )
}