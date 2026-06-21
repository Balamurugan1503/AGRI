"use client"

import React, { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ScrollSequence } from "@/components/scroll-sequence"
import { Particles } from "@/components/ui/particles"
import { LoginForm } from "@/components/auth/login-form"
import { Sprout, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // --- Background Overlay Animations ---
  // Leave the hero (0 - 0.3) almost completely transparent to showcase the natural beauty.
  // Darken and blur ONLY when approaching the Login section (0.7+).
  const blurValue = useTransform(scrollYProgress, [0.6, 0.9], ["blur(0px)", "blur(16px)"])
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5, 0.7, 0.9], [0, 0, 0.4, 0.8])

  // --- Hero Section Animations (0 - 0.3) ---
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -60])

  // --- Journey Section Animations (0.33 - 0.66) ---
  const journeyOpacity = useTransform(scrollYProgress, [0.25, 0.45, 0.55, 0.75], [0, 1, 1, 0])
  const journeyY = useTransform(scrollYProgress, [0.25, 0.45, 0.55, 0.75], [60, 0, 0, -60])
  const journeyScale = useTransform(scrollYProgress, [0.25, 0.5, 0.75], [0.97, 1, 1.03])

  // --- Login Section Animations (0.66 - 1.0) ---
  const loginOpacity = useTransform(scrollYProgress, [0.75, 0.9], [0, 1])
  const loginY = useTransform(scrollYProgress, [0.75, 0.9], [40, 0])

  const scrollToLogin = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    })
  }

  const scrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth"
    })
  }

  return (
    <div ref={containerRef} className="relative w-full bg-black text-slate-50 selection:bg-emerald-500/30 font-sans">
      {/* 1. FIXED BACKGROUND LAYER */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* The Frame Sequencer */}
        <ScrollSequence 
          frameCount={56} 
          framePath="/sequence/ezgif-frame-%03d.jpg" 
          padLength={3}
          fallbackGradientStart="#064e3b"  /* Emerald 900 */
          fallbackGradientEnd="#10b981"    /* Emerald 500 */
        />
        
        {/* Floating Atmospheric Particles - reduced quantity for elegance */}
        <Particles quantity={80} color="rgba(255, 255, 255, 0.3)" />
        
        {/* Global Dark Overlay for Login Focus (animates in later) */}
        <motion.div 
          className="absolute inset-0 bg-slate-950"
          style={{ opacity: overlayOpacity }}
        />
        <motion.div 
          className="absolute inset-0"
          style={{ backdropFilter: blurValue, WebkitBackdropFilter: blurValue }}
        />
        
        {/* Constant Subtle Gradient for Hero Text Readability (Bottom heavy) */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-emerald-950/20 via-transparent to-transparent opacity-80" />
      </div>

      {/* 2. SCROLLABLE CONTENT LAYER */}
      <div className="relative z-10 w-full">
        {/* Global sticky header for branding */}
        <header className="fixed top-0 left-0 w-full z-50 px-6 py-8 sm:px-12 pointer-events-none">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 shadow-sm">
               <Sprout className="w-4 h-4 text-white" />
             </div>
             <span className="text-lg font-medium tracking-wide text-white drop-shadow-md">AgriForecast</span>
          </div>
        </header>

        {/* SECTION 1: HERO */}
        <section className="h-[100vh] flex flex-col justify-center items-center px-6 md:px-12 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ opacity: heroOpacity, y: heroY }}
            className="flex flex-col items-center text-center max-w-3xl w-full pt-10"
          >
            {/* Very subtle overline label */}
            <div className="mb-6">
              <span className="text-xs sm:text-sm font-medium tracking-[0.2em] text-white/80 uppercase drop-shadow-sm">
                Next Generation Farming
              </span>
            </div>
            
            {/* Clean, elegant headline without harsh glows */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-light tracking-tight text-white mb-6 leading-[1.15] drop-shadow-lg">
              AI-Powered <br className="hidden sm:block" />
              <span className="font-semibold text-emerald-300">Crop Intelligence</span>
            </h1>
            
            {/* Refined subtitle with higher line-height */}
            <p className="text-lg sm:text-xl text-white/90 font-normal max-w-2xl mb-12 drop-shadow-md leading-relaxed">
              Experience the future of agriculture. Our neural networks analyze weather, soil, and historical data to predict your exact yield with stunning accuracy.
            </p>

            {/* Elegant, nature-harmonious CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-5 w-full justify-center">
               <Button 
                onClick={scrollToLogin} 
                className="w-full sm:w-auto px-8 py-6 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white text-base font-medium transition-all duration-500 hover:scale-[1.03] hover:brightness-110 shadow-[0_8px_30px_rgba(16,185,129,0.2)] border-0"
               >
                 Predict Yield
               </Button>
               <Button 
                onClick={scrollDown}
                variant="outline" 
                className="w-full sm:w-auto px-8 py-6 rounded-full bg-transparent border border-white/40 hover:bg-white/10 text-white text-base font-medium transition-all duration-500 hover:scale-[1.03]"
               >
                 Explore Sequence
               </Button>
            </div>
          </motion.div>

          {/* Minimal Animated Scroll Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            style={{ opacity: heroOpacity }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex justify-center cursor-pointer"
            onClick={scrollDown}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-10 h-10 rounded-full flex items-center justify-center border border-white/20 bg-black/10 backdrop-blur-sm"
            >
              <ChevronDown className="w-4 h-4 text-white/70" />
            </motion.div>
          </motion.div>
        </section>

        {/* SECTION 2: THE JOURNEY */}
        <section className="h-[100vh] flex flex-col justify-center items-center px-6 pointer-events-none relative">
          <motion.div 
            style={{ opacity: journeyOpacity, y: journeyY, scale: journeyScale }}
            className="text-center"
          >
             <h2 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white mb-6 drop-shadow-xl font-serif">
              விவசாயம் நம் உயிர்
             </h2>
             <p className="text-lg md:text-2xl font-normal text-emerald-100/90 drop-shadow-md max-w-3xl leading-relaxed">
               From a single seed to a golden harvest,<br className="hidden sm:block"/> every step is monitored and optimized by AI.
             </p>
          </motion.div>
        </section>

        {/* SECTION 3: LOGIN */}
        <section className="h-[100vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative z-20">
          <motion.div 
            style={{ opacity: loginOpacity, y: loginY }}
            className="w-full max-w-md"
          >
             <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 shadow-xl mx-auto mb-6">
                  <Sprout className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-light text-white mb-3 tracking-tight">Access Dashboard</h2>
                <p className="text-white/60 font-medium">Sign in to view your crop intelligence.</p>
             </div>
             
             <div className="[&>div]:bg-white/[0.03] [&>div]:backdrop-blur-2xl [&>div]:border-white/10 [&_label]:text-white/70 [&_label]:font-medium [&_h1]:text-white [&_p]:text-white/50 [&_input]:bg-white/5 [&_input]:border-white/10 [&_input]:text-white [&_input]:focus:border-emerald-500/50 [&_button[type=submit]]:bg-emerald-600 [&_button[type=submit]]:hover:bg-emerald-500 [&_button[type=submit]]:text-white [&_button[type=submit]]:shadow-lg">
               <LoginForm />
             </div>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
