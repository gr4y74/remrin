"use client"

import { useEffect, useRef } from "react"

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    alpha: number
}

interface ParticleFieldProps {
    className?: string
    particleCount?: number
    speed?: number
    baseColor?: string
}

export function ParticleField({
    className = "",
    particleCount = 50,
    speed = 0.2,
    baseColor = "255, 255, 255" // RGB format
}: ParticleFieldProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let animationFrameId: number
        let particles: Particle[] = []

        const resize = () => {
            if (!canvas) return
            const parent = canvas.parentElement
            if (parent) {
                canvas.width = parent.clientWidth
                canvas.height = parent.clientHeight
            }
        }

        const initParticles = () => {
            particles = []
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * speed,
                    vy: (Math.random() - 0.5) * speed,
                    size: Math.random() * 2 + 0.5,
                    alpha: Math.random() * 0.5 + 0.1
                })
            }
        }

        const animate = () => {
            if (!canvas || !ctx) return

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            particles.forEach(p => {
                // Move
                p.x += p.vx
                p.y += p.vy

                // Wrap around
                if (p.x < 0) p.x = canvas.width
                if (p.x > canvas.width) p.x = 0
                if (p.y < 0) p.y = canvas.height
                if (p.y > canvas.height) p.y = 0

                // Draw
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(${baseColor}, ${p.alpha})`
                ctx.fill()
            })

            animationFrameId = requestAnimationFrame(animate)
        }

        window.addEventListener("resize", resize)
        resize()
        initParticles()
        animate()

        return () => {
            window.removeEventListener("resize", resize)
            cancelAnimationFrame(animationFrameId)
        }
    }, [particleCount, speed, baseColor])

    return (
        <canvas
            ref={canvasRef}
            className={`pointer-events-none absolute inset-0 size-full ${className}`}
        />
    )
}
