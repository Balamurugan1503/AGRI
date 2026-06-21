"use client";

import React, { useEffect, useRef, useState } from "react";
import { useScroll, useTransform } from "framer-motion";

interface ScrollSequenceProps {
  frameCount: number;
  framePath: string; // e.g. "/frames/frame_%04d.jpg"
  padLength?: number;
  className?: string;
  fallbackGradientStart?: string;
  fallbackGradientEnd?: string;
}

export function ScrollSequence({
  frameCount,
  framePath,
  padLength = 4,
  className = "",
  fallbackGradientStart = "#000000",
  fallbackGradientEnd = "#16a34a",
}: ScrollSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const { scrollYProgress } = useScroll();
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [useFallback, setUseFallback] = useState(false);

  // Map scroll progress to a frame index (1 to frameCount)
  const currentFrame = useTransform(scrollYProgress, [0, 1], [1, frameCount], {
    clamp: true,
  });

  // 1. Preload Images
  useEffect(() => {
    let loadedCount = 0;
    let failedCount = 0;
    const loadImages = async () => {
      imagesRef.current = [];
      for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        const paddedIndex = i.toString().padStart(padLength, "0");
        const pattern = `%0${padLength}d`;
        const src = framePath.replace(pattern, paddedIndex);

        img.onload = () => {
          loadedCount++;
          setImagesLoaded(loadedCount);
        };

        img.onerror = () => {
          failedCount++;
          // If the very first frame fails, we assume frames aren't available and flip to fallback
          if (i === 1) {
            setUseFallback(true);
          }
        };

        img.src = src;
        imagesRef.current.push(img);
      }
    };

    loadImages();
  }, [frameCount, framePath]);

  // 2. Draw Frame on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false }); // alpha false for performance
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Resize canvas to window size for fullscreen sharp rendering
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const frameIndex = Math.min(
        frameCount - 1,
        Math.max(0, Math.floor(currentFrame.get()) - 1)
      );
      
      const img = imagesRef.current[frameIndex];

      if (!useFallback && img && img.complete && img.naturalWidth !== 0) {
        // Draw image covering the canvas (object-fit: cover logic)
        const canvasRatio = canvas.width / canvas.height;
        const imgRatio = img.width / img.height;

        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;

        if (canvasRatio > imgRatio) {
          // Canvas is wider than image (crop top/bottom)
          drawHeight = canvas.width / imgRatio;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          // Canvas is taller than image (crop left/right)
          drawWidth = canvas.height * imgRatio;
          offsetX = (canvas.width - drawWidth) / 2;
        }

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      } else {
        // FALLBACK: Draw a cinematic gradient that transitions as we scroll
        // This simulates a day-to-evening or seed-to-harvest color tone transition
        const progress = currentFrame.get() / frameCount;
        
        const r1 = parseInt(fallbackGradientStart.slice(1, 3), 16);
        const g1 = parseInt(fallbackGradientStart.slice(3, 5), 16);
        const b1 = parseInt(fallbackGradientStart.slice(5, 7), 16);

        const r2 = parseInt(fallbackGradientEnd.slice(1, 3), 16);
        const g2 = parseInt(fallbackGradientEnd.slice(3, 5), 16);
        const b2 = parseInt(fallbackGradientEnd.slice(5, 7), 16);

        // Interpolate background color
        const r = Math.round(r1 + (r2 - r1) * progress);
        const g = Math.round(g1 + (g2 - g1) * progress);
        const b = Math.round(b1 + (b2 - b1) * progress);

        // Draw deep base background
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw a simulated "sun/light" gradient
        const grd = ctx.createRadialGradient(
          canvas.width / 2, canvas.height * 0.3 + (progress * canvas.height * 0.3), // Sun moves down slightly
          0,
          canvas.width / 2, canvas.height * 0.5,
          canvas.width
        );
        grd.addColorStop(0, `rgba(255, 230, 150, ${0.4 + (progress * 0.2)})`); // Sun gets warmer
        grd.addColorStop(1, "transparent");
        
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw simulated "ground"
        ctx.fillStyle = `rgba(10, 40, 20, ${0.5 + progress * 0.4})`;
        ctx.fillRect(0, canvas.height * 0.8 - (progress * canvas.height * 0.1), canvas.width, canvas.height);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Kick off render loop
    render();

    // Subscribe to framer motion changes so we know when to redraw immediately 
    // (though requestAnimationFrame loop handles it anyway, this ensures we don't sleep)
    const unsubscribe = currentFrame.on("change", () => {
      // Intentionally left blank: loop is running
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      unsubscribe();
    };
  }, [currentFrame, frameCount, useFallback, fallbackGradientStart, fallbackGradientEnd]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover block"
        style={{ willChange: "transform" }}
      />
      
      {/* Loading Indicator (only if we have frames to load) */}
      {!useFallback && imagesLoaded < frameCount * 0.2 && (
         <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-50 transition-opacity duration-1000">
           <div className="text-center">
             <div className="w-16 h-16 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-green-500 font-mono text-sm tracking-widest font-semibold">LOADING SEQUENCE</p>
           </div>
         </div>
      )}
    </div>
  );
}
