"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { PredictionHistory } from "@/components/predictions/prediction-history"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function PredictionsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Prediction History</h1>
            <p className="text-muted-foreground mt-2">View all your crop yield predictions and their results.</p>
          </div>
          <Link href="/dashboard/predictions/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Prediction
            </Button>
          </Link>
        </div>

        {/* Prediction History */}
        <PredictionHistory />
      </div>
    </DashboardLayout>
  )
}
