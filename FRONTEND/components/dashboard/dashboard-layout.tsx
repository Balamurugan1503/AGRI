"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/auth-context"
import { signOutUser } from "@/lib/auth"
import { Sprout, Home, MapPin, BarChart3, Settings, User, LogOut, Menu, Bell, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "My Farms", href: "/dashboard/farms", icon: MapPin },
  { name: "Predictions", href: "/dashboard/predictions", icon: BarChart3 },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, profile, t } = useAuth()
  const typedUser = user as { photoURL?: string }
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOutUser()
      toast({
        title: t("Signed out successfully"),
        description: t("You have been signed out of your account."),
      })
      router.push("/")
    } catch (error: any) {
      toast({
        title: t("Sign out failed"),
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const userInitials = profile?.name
    ? profile.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eff7f2] via-[#f7fbf9] to-[#ffffff] text-slate-900 font-sans selection:bg-green-200 relative">
      
      {/* Tamil Kolam Pattern Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 3.333c-1.84 0-3.333 1.494-3.333 3.334 0 1.84 1.494 3.333 3.333 3.333 1.84 0 3.333-1.493 3.333-3.333 0-1.84-1.493-3.334-3.333-3.334zm0 26.667c-1.84 0-3.333 1.493-3.333 3.333 0 1.84 1.494 3.333 3.333 3.333 1.84 0 3.333-1.493 3.333-3.333 0-1.84-1.493-3.333-3.333-3.333zM3.333 20c0-1.84 1.494-3.333 3.334-3.333 1.84 0 3.333 1.493 3.333 3.333 0 1.84-1.493 3.333-3.333 3.333-1.84 0-3.334-1.493-3.334-3.333zm26.667 0c0-1.84 1.493-3.333 3.333-3.333 1.84 0 3.333 1.493 3.333 3.333 0 1.84-1.493 3.333-3.333 3.333-1.84 0-3.333-1.493-3.333-3.333zm-10 0c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5-5-2.24-5-5z' fill='%2316a34a' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Mobile sidebar using Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-white/90 backdrop-blur-2xl border-r border-slate-200">
          <SheetTitle className="sr-only">{t("Navigation Menu")}</SheetTitle>
          <div className="flex h-full flex-col">
            <div className="flex h-20 items-center gap-3 px-6 border-b border-slate-100">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-[14px] flex items-center justify-center shadow-lg shadow-green-500/20">
                <Sprout className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-800">AgriForecast</span>
            </div>
            <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                      isActive 
                        ? "bg-green-50 text-green-700 shadow-[inset_4px_0_0_#16a34a]" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "text-green-600" : "text-slate-400"}`} />
                    {t(item.name)}
                  </Link>
                )
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-6 overflow-y-auto border-r border-slate-200/60 bg-white/70 backdrop-blur-xl px-6 py-4 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="flex h-16 shrink-0 items-center gap-3 mt-2 px-2">
            <div className="w-11 h-11 bg-gradient-to-br from-green-400 to-emerald-600 rounded-[14px] flex items-center justify-center shadow-lg shadow-green-500/20 transform hover:scale-105 transition-transform cursor-pointer">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">AgriForecast</span>
          </div>
          <nav className="flex flex-1 flex-col mt-4">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-x-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-300 group ${
                        isActive 
                          ? "bg-green-50 shadow-[inset_4px_0_0_#16a34a] text-green-700" 
                          : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"
                      }`}
                    >
                      <item.icon className={`h-5 w-5 shrink-0 transition-colors ${isActive ? "text-green-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                      {t(item.name)}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
          
          {/* Bottom Trust/Version Badge */}
          <div className="mt-auto pb-4 px-2">
             <div className="bg-slate-100/50 rounded-xl p-4 border border-slate-200/50">
                <p className="text-xs font-semibold text-slate-500 mb-1 rounded-full uppercase tracking-wider">AgriForecast 🌾</p>
                <p className="text-[11px] text-slate-400 font-medium">{t("Empowering farmers with AI")}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72 flex flex-col min-h-screen relative z-10">
        {/* Main Content */}
        <main className="flex-1 overflow-auto relative z-0">
          
          {/* Subtle Background Ecosystem Layer */}
          <div className="absolute inset-0 z-[-2] pointer-events-none overflow-hidden mix-blend-multiply">
             <img 
               src="/images/dashboard-bg.jpg" 
               alt="" 
               className="w-full h-full object-cover opacity-10 blur-[10px] saturate-[0.6] min-h-[100vh] fixed inset-0" 
             />
          </div>
          
          {/* Subtle Cultural / Dot Pattern */}
          <div 
             className="absolute inset-0 z-[-1] opacity-[0.04] pointer-events-none fixed"
             style={{ 
               backgroundImage: "radial-gradient(circle, #059669 1.5px, transparent 1.5px)", 
               backgroundSize: "28px 28px" 
             }}
          />

          {/* Smooth Depth Gradient */}
          <div className="absolute inset-0 z-[-1] pointer-events-none fixed bg-gradient-to-b from-transparent via-emerald-50/60 to-emerald-900/[0.12]" />


          {/* Header */}
          <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center gap-x-4 border-b border-white/20 bg-white/60 backdrop-blur-xl px-4 sm:gap-x-6 sm:px-6 lg:px-10 shadow-sm">
          <div className="flex flex-1 items-center gap-x-4 self-stretch lg:gap-x-6 justify-between lg:justify-end">
            
            {/* Mobile Sidebar Toggle */}
            <Button variant="ghost" size="icon" className="lg:hidden text-slate-500 hover:bg-slate-100 rounded-full" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
              <span className="sr-only">{t("Open sidebar")}</span>
            </Button>

            {/* Global Search Placeholder (Desktop) */}
            <div className="hidden lg:flex flex-1 max-w-md items-center relative">
               <Search className="absolute left-3 w-4 h-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder={t("Search farms, predictions...")} 
                 className="w-full h-10 pl-10 pr-4 rounded-full bg-white/60 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all shadow-sm"
               />
            </div>

            <div className="flex items-center gap-x-3 lg:gap-x-5">
              <Button variant="ghost" size="icon" className="relative rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500 border border-white"></span>
                <span className="sr-only">{t("View notifications")}</span>
              </Button>

              <div className="hidden lg:block lg:h-8 lg:w-px lg:bg-slate-200" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden ring-2 ring-transparent transition-all focus:ring-green-400 hover:ring-green-200">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={typedUser?.photoURL ?? ""} alt={profile?.name ?? ""} />
                      <AvatarFallback className="text-sm font-semibold bg-green-100 text-green-700">{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-xl border border-slate-100 shadow-xl" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal py-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold text-slate-800 leading-none">{profile?.name}</p>
                      <p className="text-xs leading-none text-slate-500">{profile?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-slate-50">
                    <Link href="/dashboard/profile" className="flex items-center py-2">
                      <User className="mr-3 h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-700">{t("Profile")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-slate-50">
                    <Link href="/dashboard/settings" className="flex items-center py-2">
                      <Settings className="mr-3 h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-700">{t("Settings")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer focus:bg-rose-50 text-rose-600 focus:text-rose-700">
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-medium">{t("Log Out")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 py-8">
          <div className="px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
    </div>
  )
}