"use client"

import React, { useState, useEffect } from "react"
// ✅ 1. Import the useRouter hook
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Sprout, MapPin, Thermometer, Beaker } from "lucide-react"
import { DocumentUploader } from "../document-uploader"

interface PredictionFormProps {
  onPredictionComplete: (result: any) => void
}

type Farm = {
  farm_id: string
  name: string
  location: { lat: number; lon: number }
  soil_type: string
  area_ha: number
}

type WeatherData = {
  main: {
    temp: number;
    humidity: number;
  };
};

const cropTypes = [
  "Arecanut", "Arhar/Tur", "Bajra", "Banana", "Barley", "Black pepper",
  "Blackgram", "Cardamom", "Cashewnut", "Castor seed", "Coconut ",
  "Coriander", "Cotton(lint)", "Cowpea(Lobia)", "Dry chillies",
  "Dry ginger", "Garlic", "Ginger", "Gram", "Groundnut", "Guar seed",
  "Horse-gram", "Jowar", "Jute", "Khesari", "Linseed", "Maize",
  "Masoor", "Mesta", "Moong(Green Gram)", "Moth", "Niger seed",
  "Oilseeds total", "Onion", "Other  Rabi pulses", "Other Cereals",
  "Other Kharif pulses", "Other Summer Pulses", "Peas & beans (Pulses)",
  "Potato", "Ragi", "Rapeseed &Mustard", "Rice", "Safflower",
  "Sannhamp", "Sesamum", "Small millets", "Soyabean", "Sugarcane",
  "Sunflower", "Sweet potato", "Tapioca", "Tobacco", "Turmeric", "Urad",
  "Varagu", "Wheat", "other oilseeds"
];

export function PredictionForm({ onPredictionComplete }: PredictionFormProps) {
  // ✅ 2. Initialize the router
  const router = useRouter();

  const [farms, setFarms] = useState<Farm[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingFarms, setIsLoadingFarms] = useState(true)
  const [isParsing, setIsParsing] = useState(false)

  const [formData, setFormData] = useState({
    farm_id: "", crop: "", area: "", N: "", P: "", K: "", ph: "",
    rainfall: "", fertilizer: "", pesticide: "", sowing_date: "",
    temperature: "", humidity: "", moisture: "",
  })
  const { toast } = useToast()

  const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  useEffect(() => {
    const loadFarms = async () => {
      try {
        const response = await apiClient.getFarms()
        setFarms(response.farms)
      } catch (error) {
        console.error("Error loading farms:", error)
        toast({
          title: "Error loading farms",
          description: "Please try refreshing the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingFarms(false)
      }
    }
    loadFarms()
  }, [toast])

  const handleFarmChange = (farmId: string) => {
    const selectedFarm = farms.find(farm => farm.farm_id === farmId)
    if (!selectedFarm) return
    setFormData(prev => ({
      ...prev,
      farm_id: farmId,
      area: selectedFarm.area_ha.toString(),
      temperature: "", humidity: "", moisture: "", N: "", P: "", K: "", ph: "",
    }))
  }

  useEffect(() => {
    if (!formData.farm_id) return
    const selectedFarm = farms.find(farm => farm.farm_id === formData.farm_id)
    if (!selectedFarm) return

    const fetchWeatherData = async () => {
      if (!OPENWEATHER_API_KEY) {
        toast({ title: "Weather API Key Missing", variant: "destructive" })
        return;
      }
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${selectedFarm.location.lat}&lon=${selectedFarm.location.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        const data = await response.json() as WeatherData;
        setFormData(prev => ({
          ...prev,
          temperature: prev.temperature || data.main.temp.toString(),
          humidity: prev.humidity || data.main.humidity.toString(),
        }))
      } catch (error) {
        console.error("Weather fetch error:", error);
        toast({ title: "Could not fetch weather.", description: "Please enter temp/humidity manually.", variant: "default" })
      }
    }

    const fetchSoilData = async () => {
      const url = `/api/soil?lat=${selectedFarm.location.lat}&lon=${selectedFarm.location.lon}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch from /api/soil");
        const data: any = await res.json();
        const props = data.properties?.layers;
        if (!props) return;

        const getValue = (name: string) => {
          const layer = props.find((p: any) => p.name === name);
          if (!layer || layer.depths?.[0]?.values?.mean === null) return "";
          const mean = layer.depths[0].values.mean;
          if (name === 'phh2o') return (mean / 10).toFixed(2);
          if (name === 'nitrogen') return (mean * 10).toFixed(2);
          if (name === 'p') return (mean * 0.1).toFixed(2);
          if (name === 'k') return (mean * 0.1).toFixed(2);
          return (mean).toFixed(2);
        };
        setFormData(prev => ({
          ...prev,
          N: prev.N || getValue("nitrogen"),
          P: prev.P || getValue("p"),
          K: prev.K || getValue("k"),
          ph: prev.ph || getValue("phh2o"),
        }));
      } catch (error) {
        console.warn("Soil data fetch error:", error);
        toast({
          title: "Could not auto-fill soil data.",
          description: "Please enter N, P, K, pH, and Moisture manually.",
          variant: "default"
        });
      }
    };

    fetchWeatherData();
    fetchSoilData();
  }, [formData.farm_id, farms, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const safeParseFloat = (value: string) => {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }

    const predictionPayload = {
      farm_id: formData.farm_id, crop: formData.crop,
      N: safeParseFloat(formData.N), P: safeParseFloat(formData.P),
      K: safeParseFloat(formData.K), ph: safeParseFloat(formData.ph),
      moisture: safeParseFloat(formData.moisture),
      temperature: safeParseFloat(formData.temperature),
      humidity: safeParseFloat(formData.humidity),
      rainfall: safeParseFloat(formData.rainfall),
      sowing_date: formData.sowing_date, area: safeParseFloat(formData.area),
      fertilizer: safeParseFloat(formData.fertilizer),
      pesticide: safeParseFloat(formData.pesticide),
    }

    try {
      const apiResult = await apiClient.predictYield(predictionPayload);
      const selectedFarm = farms.find(farm => farm.farm_id === formData.farm_id);
      const displayResult = {
        ...apiResult || {},
        inputs: {
          crop: predictionPayload.crop,
          fertilizer: predictionPayload.fertilizer,
          pesticide: predictionPayload.pesticide,
        },
        weather_data: {
          rainfall: predictionPayload.rainfall,
          temperature: predictionPayload.temperature,
          humidity: predictionPayload.humidity,
        },
        soil_data: {
          nitrogen: predictionPayload.N,
          phosphorus: predictionPayload.P,
          potassium: predictionPayload.K,
          ph: predictionPayload.ph,
          moisture: predictionPayload.moisture,
        },
        farm_name: selectedFarm?.name || "Selected Farm",
      };
      toast({ title: "Prediction completed!", description: "Yield prediction generated successfully." })
      onPredictionComplete(displayResult)
    } catch (error: any) {
      toast({ title: "Prediction failed", description: error.message || "An unknown error occurred.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingFarms) {
    return (
      <Card><CardContent className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></CardContent></Card>
    )
  }

  if (farms.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>No Farms Available</CardTitle><CardDescription>You need to add a farm before making predictions.</CardDescription></CardHeader>
        <CardContent>
          {/* ✅ 3. Use the router to navigate */}
          <Button onClick={() => router.push("/dashboard/farms")}>Add Farm</Button>
        </CardContent>
      </Card>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = (e.currentTarget as any);
    setFormData(prev => ({ ...prev, [id]: value }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sprout className="w-5 h-5" />Crop Yield Prediction</CardTitle>
        <CardDescription>Enter details manually or upload a soil report to auto-fill.</CardDescription>
      </CardHeader>
      <CardContent>
        <DocumentUploader
          setIsParsing={setIsParsing}
          onExtractedData={(updates: Partial<typeof formData>) => {
            setFormData((prev) => ({ ...prev, ...updates }));
          }}
        />

        <div className="my-6 flex items-center">
          <Separator className="flex-1" />
          <span className="px-4 text-sm text-muted-foreground">OR ENTER MANUALLY</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="farm">1. Select Your Farm</Label>
            <Select value={formData.farm_id} onValueChange={handleFarmChange}>
              <SelectTrigger><SelectValue placeholder="Choose a farm" /></SelectTrigger>
              <SelectContent>
                {farms.map((farm: Farm) => (
                  <SelectItem key={farm.farm_id} value={farm.farm_id}>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{farm.name} ({farm.area_ha} ha)</div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-medium">2. Crop Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crop">Crop</Label>
                <Select
                  value={formData.crop}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, crop: value }))}
                  required
                >
                  <SelectTrigger><SelectValue placeholder="Select a Crop" /></SelectTrigger>
                  <SelectContent>
                    {cropTypes.map(crop => (<SelectItem key={crop} value={crop}>{crop}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sowing_date">Sowing Date</Label>
                <Input id="sowing_date" type="date" value={formData.sowing_date} onChange={handleInputChange} required />
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-medium">3. Soil & Farm Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area">Cultivation Area (ha)</Label>
                <Input id="area" type="number" step="0.1" value={formData.area} required readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="N">Nitrogen (N) (kg/ha)</Label>
                <Input id="N" type="number" step="0.1" placeholder="e.g., 50.0" value={formData.N} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="P">Phosphorus (P) (kg/ha)</Label>
                <Input id="P" type="number" step="0.1" placeholder="e.g., 30.0" value={formData.P} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="K">Potassium (K) (kg/ha)</Label>
                <Input id="K" type="number" step="0.1" placeholder="e.g., 20.0" value={formData.K} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ph">Soil pH</Label>
                <Input id="ph" type="number" step="0.1" placeholder="e.g., 6.5" value={formData.ph} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moisture">Soil Moisture (%)</Label>
                <Input id="moisture" type="number" step="0.1" placeholder="e.g., 25.5" value={formData.moisture} onChange={handleInputChange} required />
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><Thermometer className="w-5 h-5" />4. Environmental Conditions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rainfall">Annual Rainfall (mm)</Label>
                <Input id="rainfall" type="number" step="0.1" placeholder="e.g., 1200" value={formData.rainfall} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Avg. Temperature (°C)</Label>
                <Input id="temperature" type="number" step="0.1" placeholder="Auto-filled" value={formData.temperature} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidity">Avg. Air Humidity (%)</Label>
                <Input id="humidity" type="number" step="0.1" placeholder="Auto-filled" value={formData.humidity} onChange={handleInputChange} required />
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><Beaker className="w-5 h-5" />5. Agricultural Inputs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fertilizer">Fertilizer Usage (kg)</Label>
                <Input id="fertilizer" type="number" step="0.1" placeholder="e.g., 150.5" value={formData.fertilizer} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pesticide">Pesticide Usage (kg)</Label>
                <Input id="pesticide" type="number" step="0.1" placeholder="e.g., 25.0" value={formData.pesticide} onChange={handleInputChange} required />
              </div>
            </div>
          </div>
          <Button type="submit" disabled={isLoading || isParsing || !formData.farm_id} className="w-full">
            {isLoading || isParsing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isParsing ? 'Processing Document...' : (isLoading ? 'Generating Prediction...' : 'Generate Prediction')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}