"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, MapPin } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface AddFarmDialogProps {
  onFarmAdded: () => void
}

export function AddFarmDialog({ onFarmAdded }: AddFarmDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    latitude: "",
    longitude: "",
    soil_type: "",
    area_ha: "",
  })
  const { toast } = useToast()

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      })
      return
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }))
        setIsGettingLocation(false)
        toast({
          title: "Location obtained",
          description: "Your current location has been set for the farm.",
        })
      },
      (error) => {
        setIsGettingLocation(false)
        toast({
          title: "Location error",
          description: "Unable to get your current location. Please enter coordinates manually.",
          variant: "destructive",
        })
      },
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await apiClient.addFarm({
        name: formData.name,
        location: {
          lat: Number.parseFloat(formData.latitude),
          lon: Number.parseFloat(formData.longitude),
        },
        soil_type: formData.soil_type,
        area_ha: Number.parseFloat(formData.area_ha),
      })

      toast({
        title: "Farm added successfully",
        description: `${formData.name} has been added to your farms.`,
      })

      setFormData({
        name: "",
        latitude: "",
        longitude: "",
        soil_type: "",
        area_ha: "",
      })
      setOpen(false)
      onFarmAdded()
    } catch (error: any) {
      toast({
        title: "Failed to add farm",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 text-white hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Farm
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-green-100 border-green-200">
        <DialogHeader>
          <DialogTitle className="text-green-800">Add New Farm</DialogTitle>
          <DialogDescription className="text-green-700">
            Add a new farm location to start making yield predictions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-green-800">Farm Name</Label>
              <Input
                id="name"
                placeholder="e.g., North Field"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                className="border-green-300 focus:border-green-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude" className="text-green-800">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g., 40.7128"
                  value={formData.latitude}
                  onChange={(e) => setFormData((prev) => ({ ...prev, latitude: e.target.value }))}
                  required
                  className="border-green-300 focus:border-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude" className="text-green-800">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="e.g., -74.0060"
                  value={formData.longitude}
                  onChange={(e) => setFormData((prev) => ({ ...prev, longitude: e.target.value }))}
                  required
                  className="border-green-300 focus:border-green-500"
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGetLocation}
              disabled={isGettingLocation}
              className="w-full border-green-400 text-green-700 hover:bg-green-200"
            >
              {isGettingLocation ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-green-500" />
              ) : (
                <MapPin className="w-4 h-4 mr-2 text-green-500" />
              )}
              Use Current Location
            </Button>

            <div className="space-y-2">
              <Label htmlFor="soil_type" className="text-green-800">Soil Type</Label>
              <Select
                value={formData.soil_type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, soil_type: value }))}
              >
                <SelectTrigger className="border-green-300 focus:ring-green-500">
                  <SelectValue placeholder="Select soil type" />
                </SelectTrigger>
                <SelectContent className="bg-green-50 border-green-200">
                  <SelectItem value="clay">Clay</SelectItem>
                  <SelectItem value="loam">Loam</SelectItem>
                  <SelectItem value="sand">Sand</SelectItem>
                  <SelectItem value="silt">Silt</SelectItem>
                  <SelectItem value="peat">Peat</SelectItem>
                  <SelectItem value="chalk">Chalk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area_ha" className="text-green-800">Area (Hectares)</Label>
              <Input
                id="area_ha"
                type="number"
                step="0.1"
                placeholder="e.g., 2.5"
                value={formData.area_ha}
                onChange={(e) => setFormData((prev) => ({ ...prev, area_ha: e.target.value }))}
                required
                className="border-green-300 focus:border-green-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-green-400 text-green-700 hover:bg-green-200">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-green-600 text-white hover:bg-green-700">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Add Farm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}