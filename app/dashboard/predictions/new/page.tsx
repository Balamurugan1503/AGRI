"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { PredictionForm } from "@/components/predictions/prediction-form"
import dynamic from 'next/dynamic'
const PredictionResult = dynamic(
  () => import("@/components/predictions/prediction-result").then((mod) => mod.PredictionResult),
  { ssr: false }
)
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NewPredictionPage() {
  const { user, loading } = useAuth()
  const [predictionResult, setPredictionResult] = useState(null)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }
  }, [user, loading, router])

  const handlePredictionComplete = (result: any) => {
    setPredictionResult(result)
  }

  const handleNewPrediction = () => {
    setPredictionResult(null)
  }

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
        <div className="flex items-center gap-4">
          <Link href="/dashboard/predictions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Predictions
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {predictionResult ? "Prediction Result" : "New Prediction"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {predictionResult
                ? "Your crop yield prediction has been generated successfully."
                : "Create a new crop yield prediction using AI analysis."}
            </p>
          </div>
        </div>

        {predictionResult ? (
          <div className="space-y-6">
            <PredictionResult result={predictionResult} onReset={handleNewPrediction} />
            <div className="flex gap-4">
              <Button onClick={handleNewPrediction}>Make Another Prediction</Button>
              <Link href="/dashboard/predictions">
                <Button variant="outline">View All Predictions</Button>
              </Link>
            </div>
          </div>
        ) : (
          <PredictionForm onPredictionComplete={handlePredictionComplete} />
        )}
      </div>
    </DashboardLayout>
  )
}

