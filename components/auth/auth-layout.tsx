"use client"

import React, { ReactNode } from "react"
import { motion } from "framer-motion"
import { Sprout, ShieldCheck, Leaf, Moon } from "lucide-react"
import Link from "next/link"

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  // Pre-calculated particle positions to avoid hydration mismatch
  const particles = [
    { id: 1, x: 10, y: 20, scale: 0.6, duration: 18, delay: 0 },
    { id: 2, x: 85, y: 15, scale: 0.8, duration: 22, delay: 2 },
    { id: 3, x: 25, y: 75, scale: 0.5, duration: 25, delay: 5 },
    { id: 4, x: 75, y: 80, scale: 0.7, duration: 20, delay: 1 },
    { id: 5, x: 45, y: 35, scale: 0.9, duration: 15, delay: 4 },
    { id: 6, x: 92, y: 55, scale: 0.4, duration: 17, delay: 3 },
  ]

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-gradient-to-br from-[#e6f4ed] via-[#f0f9f4] to-[#ffffff] font-sans selection:bg-green-200">
      
      {/* Background Illustration & Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Subtle Farmland Image Overlay */}
        <div 
          className="absolute inset-0 bg-[url('/indian-farmer-in-odisha-using-smartphone-in-rice-f.jpg')] bg-cover bg-center opacity-10 mix-blend-multiply" 
        />
        {/* Grain/Noise Texture */}
        <div 
          className="absolute inset-0 opacity-40 mix-blend-overlay"
          style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')" }}
        />
        {/* Soft floating glow behind card */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-300/30 rounded-full blur-[100px]"
        />
      </div>

      {/* Floating Leaves/Particles */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: `${p.y}vh`, x: `${p.x}vw`, opacity: 0 }}
            animate={{
              y: [`${p.y}vh`, `${(p.y - 15) % 100}vh`],
              x: [`${p.x}vw`, `${(p.x + 5) % 100}vw`],
              rotate: [0, 360],
              opacity: [0, 0.5, 0],
            }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
            className="absolute text-green-500/30"
          >
            <Leaf style={{ transform: `scale(${p.scale})` }} />
          </motion.div>
        ))}
      </div>

      {/* Top Right Dark Mode Toggle Placeholder */}
      <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20">
        <button className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-sm flex items-center justify-center text-slate-500 hover:text-green-600 hover:bg-white transition-all transform hover:scale-105">
          <Moon className="w-4 h-4" />
        </button>
      </div>

      {/* Glassmorphism Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[20px] shadow-[0_8px_32px_rgba(16,185,129,0.08)] p-8 relative">
          
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center mb-6 group outline-none">
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] transform transition-transform group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                  <Sprout className="w-6 h-6 text-white" />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20"></div>
                </div>
                <span className="text-2xl font-bold tracking-tight text-slate-800 drop-shadow-sm group-hover:text-slate-900 transition-colors">
                  AgriForecast
                </span>
              </div>
            </Link>
            
            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">{title}</h1>
            <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-[280px] mx-auto opacity-90">{subtitle}</p>
          </div>

          {/* Form Content */}
          <div className="relative z-10">
            {children}
          </div>
          
          {/* Trust Footer */}
          <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            <span>Secure & Private</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
