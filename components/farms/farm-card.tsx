import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Ruler } from "lucide-react"

interface Farm {
  farm_id: string
  name: string
  location: { lat: number; lon: number }
  soil_type: string
  area_ha: number
  created_at: any
}

interface FarmCardProps {
  farm: Farm
}

export function FarmCard({ farm }: FarmCardProps) {
  return (
    <Card className="bg-green-100 border border-green-200 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-green-800">{farm.name}</CardTitle>
          <Badge className="bg-green-600 text-white capitalize hover:bg-green-700">
            {farm.soil_type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-green-700">
          <MapPin className="w-4 h-4 text-green-500" />
          <span>
            {farm.location.lat.toFixed(4)}, {farm.location.lon.toFixed(4)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-700">
          <Ruler className="w-4 h-4 text-green-500" />
          <span>{farm.area_ha} hectares</span>
        </div>
      </CardContent>
    </Card>
  )
}