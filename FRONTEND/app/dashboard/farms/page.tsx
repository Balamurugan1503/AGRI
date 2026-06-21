"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AddFarmDialog } from "@/components/farms/add-farm-dialog"
import { FarmCard } from "@/components/farms/farm-card"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

// Types
type FirestoreTimestamp = { seconds: number; nanoseconds: number }
type Location = { lat: number; lon: number }

export type Farm = {
  farm_id: string
  name: string
  location: Location            // required structured location
  soil_type: string
  area_ha: number
  created_at: FirestoreTimestamp
}

// If the API may omit fields, type as Partial and normalize
type FarmsResponse = { farms: Partial<Farm>[] }

export default function FarmsPage() {
  const { user, loading } = useAuth()
  const [farms, setFarms] = useState<Farm[]>([])
  const [isLoadingFarms, setIsLoadingFarms] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }
    if (user) {
      loadFarms()
    }
  }, [user, loading, router])

  const loadFarms = async () => {
    try {
      const response = (await apiClient.getFarms()) as FarmsResponse

      const normalized: Farm[] = (response.farms ?? []).map((f) => {
        // location could arrive as object, string, or be missing; coerce to {lat, lon}
        const loc = (f.location as Location) ?? parseLocation(f) ?? { lat: 0, lon: 0 }
        return {
          farm_id: String(f.farm_id ?? crypto.randomUUID()),
          name: String(f.name ?? "Unnamed Farm"),
          location: loc,
          soil_type: String(f.soil_type ?? ""),
          area_ha: typeof f.area_ha === "number" ? f.area_ha : Number(f.area_ha ?? 0),
          created_at:
            (f.created_at as FirestoreTimestamp) ?? {
              seconds: Math.floor(Date.now() / 1000),
              nanoseconds: 0,
            },
        }
      })

      setFarms(normalized)
    } catch (error) {
      console.error("Error loading farms:", error)
    } finally {
      setIsLoadingFarms(false)
    }
  }

  // Helper to coerce various location inputs to Location
  function parseLocation(f: Partial<Farm>): Location | null {
    // If backend sends "lat,lon" string
    const raw: unknown = (f as any)?.location
    if (typeof raw === "string") {
      const [latStr, lonStr] = raw.split(",").map((s) => s.trim())
      const lat = Number(latStr)
      const lon = Number(lonStr)
      if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon }
    }
    // If backend sends separate fields
    const latAny = (f as any)?.lat
    const lonAny = (f as any)?.lon
    if (typeof latAny === "number" && typeof lonAny === "number") {
      return { lat: latAny, lon: lonAny }
    }
    return null
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Farms</h1>
            <p className="text-muted-foreground mt-2">Manage your farm locations and properties.</p>
          </div>
          <AddFarmDialog onFarmAdded={loadFarms} />
        </div>

        {/* Farms Grid */}
        {isLoadingFarms ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : farms.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {farms.map((farm) => (
              <FarmCard key={farm.farm_id} farm={farm} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No farms added yet.</p>
            <AddFarmDialog onFarmAdded={loadFarms} />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}



