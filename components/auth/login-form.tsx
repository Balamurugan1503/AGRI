"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Lock, Loader2, AlertTriangle, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

// Custom Google Icon
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { firebaseConfigured, signIn } = useAuth()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firebaseConfigured) {
      toast({
        title: "Configuration Required",
        description: "Firebase authentication is not configured. Please check your environment variables.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await signIn(email, password)
      toast({
        title: "Welcome back!",
        description: "You've been successfully signed in.",
      })
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setIsDemoLoading(true)

    try {
      toast({
        title: "Demo Mode",
        description: "Signed in as demo user. Some features may be limited.",
      })

      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)
    } catch (error) {
      toast({
        title: "Demo login failed",
        description: "Unable to access demo mode.",
        variant: "destructive",
      })
      setIsDemoLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setTimeout(() => {
      toast({
        title: "Coming Soon",
        description: "Google sign in will be available soon. Please use email/password for now.",
        variant: "default",
      })
      setIsGoogleLoading(false)
    }, 500)
  }

  if (!firebaseConfigured) {
    return (
      <div className="space-y-6">
        <Alert className="border-rose-200 bg-rose-50/80 backdrop-blur-sm rounded-xl">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <AlertDescription className="text-rose-700 text-sm">
            <strong className="block mb-1 text-sm">Firebase Configuration Required</strong>
            Authentication is currently disabled because Firebase environment variables are not configured.
            <br />
            <span className="text-xs font-medium mt-2 inline-block">Please set up your Firebase project in Project Settings.</span>
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleDemoLogin}
          disabled={isDemoLoading}
          className="w-full h-12 text-base font-medium rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-transparent hover:scale-[1.02] transition-all duration-300"
        >
          {isDemoLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2 text-slate-400" /> : <User className="w-5 h-5 mr-2 text-slate-400" />}
          Try Demo Mode
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={handleDemoLogin}
          disabled={isDemoLoading}
          type="button"
          className="w-full h-11 text-sm font-medium rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border-none hover:scale-[1.02] transition-all duration-300 shadow-sm"
        >
          {isDemoLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2 text-slate-400" /> : <User className="w-4 h-4 mr-2 text-slate-400" />}
          Demo Mode
        </Button>
        <Button
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          type="button"
          className="w-full h-11 text-sm font-medium rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:scale-[1.02] transition-all duration-300 shadow-sm"
        >
          {isGoogleLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <GoogleIcon />}
          Google
        </Button>
      </div>

      <div className="relative flex items-center py-2">
        <div className="flex-grow h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400 uppercase tracking-widest">
          OR CONTINUE WITH EMAIL
        </span>
        <div className="flex-grow h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-1.5 focus-within:text-green-600">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700 ml-1 transition-colors">
            Email address
          </Label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-green-500 transition-colors pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-white/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:bg-white"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5 focus-within:text-green-600">
          <div className="flex items-center justify-between ml-1">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700 transition-colors">
              Password
            </Label>
            <Link href="#" className="text-xs font-medium text-green-600 hover:text-green-700 hover:underline">
              Forgot?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-green-500 transition-colors pointer-events-none" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-white/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:bg-white"
              required
            />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isLoading} 
          className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white border-0 shadow-[0_5px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] hover:scale-[1.02] transition-all duration-300 mt-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          Sign In
        </Button>
      </form>

      <div className="text-center text-sm mt-4">
        <span className="text-slate-500 font-medium">New around here? </span>
        <Link href="/register" className="text-green-600 hover:text-green-700 font-semibold hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  )
}