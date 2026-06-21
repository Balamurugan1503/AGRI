"use client";

import React, { useEffect, useRef } from "react";

interface ParticlesProps {
  className?: string;
  quantity?: number;
  color?: string;
}

export function Particles({
  className = "",
  quantity = 100,
  color = "rgba(255, 255, 255, 0.5)",
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    
    // Resize handling
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle definition
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      life: number;
      maxLife: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * -1 - 0.2; // Float upwards mostly
        this.opacity = Math.random();
        this.maxLife = Math.random() * 200 + 100;
        this.life = this.maxLife;
      }

      update() {
        this.x += this.speedX + Math.sin(this.life * 0.05) * 0.5; // Wind sway
        this.y += this.speedY;
        this.life--;

        // Fade out near end of life
        if (this.life < 50) {
           this.opacity = (this.life / 50) * 0.5;
        }

        // Reset if completely faded or out of bounds
        if (this.life <= 0 || this.y < -10 || this.x < -10 || this.x > canvas!.width + 10) {
          this.x = Math.random() * canvas!.width;
          this.y = canvas!.height + 10;
          this.life = this.maxLife;
          this.opacity = Math.random() * 0.5 + 0.2;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        // Parse the color to apply individual opacity
        // Assuming format like 'rgba(255, 255, 255, 0.5)' or hex
        ctx.fillStyle = color.replace(")", `, ${this.opacity})`).replace("rgb", "rgba");
        // Fallback if replace fails (e.g. hex) 
        if (ctx.fillStyle === color) {
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = color;
        }
        
        ctx.fill();
        ctx.globalAlpha = 1.0; // Reset
      }
    }

    // Initialize particles
    const particlesArray: Particle[] = [];
    for (let i = 0; i < quantity; i++) {
      particlesArray.push(new Particle());
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [quantity, color]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ willChange: "transform" }}
    />
  );
}
