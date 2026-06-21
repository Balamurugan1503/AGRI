"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import { Calendar, TrendingUp, MapPin, Loader2 } from "lucide-react"
import { format } from "date-fns"

// --- ADDED: A simple Farm type for the name lookup ---
type Farm = {
  farm_id: string;
  name?: string;
};

// This Prediction type is from your original code
type Prediction = {
  farm_id: string
  status: string
  created_at: {
    seconds: number
    nanoseconds: number
  } | string
  outputs?: {
    crop_yield_prediction?: {
      predicted_yield_kg_per_ha: number
      confidence_interval?: {
        lower: number
        upper: number
      }
    }
    fertilizer_recommendation?: {
      recommended_fertilizer: string
      confidence?: number
    }
  }
  inputs?: {
    crop: string
    area: number
    fertilizer: number
    pesticide: number
  }
  error?: string
}

export function PredictionHistory() {
  // --- MODIFIED: Added state for farms ---
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadHistoryData()
  }, [])

  // --- MODIFIED: Function now fetches both farms and predictions ---
  const loadHistoryData = async () => {
    setIsLoading(true)
    try {
      const [farmsResponse, predictionsResponse] = await Promise.all([
        apiClient.getFarms(),
        apiClient.getPredictions()
      ]);
      setFarms(farmsResponse.farms);
      setPredictions(predictionsResponse.predictions);
    } catch (error) {
      console.error("Error loading history data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function formatTimestamp(timestamp: string | { seconds: number; nanoseconds: number }) {
    if (!timestamp) return "Date not available";
    let date: Date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (typeof timestamp.seconds === 'number') {
      date = new Date(timestamp.seconds * 1000);
    } else {
      return "Invalid date";
    }
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    return format(date, "PPP");
  }

  // --- ADDED: The farm name lookup map ---
  const farmNameMap = new Map<string, string>();
  farms.forEach(farm => {
    if (farm.farm_id && farm.name) {
      farmNameMap.set(farm.farm_id, farm.name);
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (predictions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Predictions Yet</CardTitle>
          <CardDescription>You haven't made any yield predictions yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => (window.location.href = "/dashboard/predictions/new")}>
            Make First Prediction
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {predictions.map((prediction, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {/* --- MODIFIED: Use the map to display the farm name --- */}
                Farm: {farmNameMap.get(prediction.farm_id) || prediction.farm_id}
              </CardTitle>
              <Badge variant={prediction.status === "complete" ? "default" : "secondary"}>
                {prediction.status}
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatTimestamp(prediction.created_at)}
            </CardDescription>
          </CardHeader>
          {/* --- THIS SECTION IS NOW RESTORED FROM YOUR ORIGINAL CODE --- */}
          <CardContent>
            {prediction.status === "complete" && prediction.outputs ? (
              <div className="space-y-4">
                {prediction.outputs.crop_yield_prediction && (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {prediction.outputs.crop_yield_prediction.predicted_yield_kg_per_ha.toFixed(1)} kg/ha
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Range:{" "}
                        {prediction.outputs.crop_yield_prediction.confidence_interval?.lower.toFixed(1)} -{" "}
                        {prediction.outputs.crop_yield_prediction.confidence_interval?.upper.toFixed(1)} kg/ha
                      </div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}

                {prediction.outputs.fertilizer_recommendation && (
                  <div className="mt-4 p-4 bg-green-50 rounded-md">
                    <h4 className="font-medium text-lg">Fertilizer Recommendation</h4>
                    <p>
                      Recommended:{" "}
                      <span className="font-semibold">{prediction.outputs.fertilizer_recommendation.recommended_fertilizer}</span>
                    </p>
                    {prediction.outputs.fertilizer_recommendation.confidence && (
                      <p>
                        Confidence: {(prediction.outputs.fertilizer_recommendation.confidence * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                )}

                {prediction.inputs && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Crop</div>
                      <div className="text-muted-foreground">{prediction.inputs.crop}</div>
                    </div>
                    <div>
                      <div className="font-medium">Area</div>
                      <div className="text-muted-foreground">{prediction.inputs.area} ha</div>
                    </div>
                    <div>
                      <div className="font-medium">Fertilizer</div>
                      <div className="text-muted-foreground">{prediction.inputs.fertilizer} kg</div>
                    </div>
                    <div>
                      <div className="font-medium">Pesticide</div>
                      <div className="text-muted-foreground">{prediction.inputs.pesticide} kg</div>
                    </div>
                  </div>
                )}
              </div>
            ) : prediction.status === "error" ? (
              <div className="text-destructive">
                <p>Prediction failed: {prediction.error}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing prediction...</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}