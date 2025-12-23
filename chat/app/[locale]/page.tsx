"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { HeroCarousel, DraggableGallery } from "@/components/discovery"
import { IconSparkles, IconDiamond, IconArrowRight, IconLoader2 } from "@tabler/icons-react"

interface Persona {
  id: string
  name: string
  description: string | null
  image_url: string | null
  rarity?: "common" | "rare" | "epic" | "legendary"
  is_featured?: boolean
  message_count?: number
  follower_count?: number
}

export default function HomePage() {
  const router = useRouter()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [featuredPersonas, setFeaturedPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const supabase = createClient()

        // Fetch all public personas
        const { data: allPersonas } = await supabase
          .from("personas")
          .select(`
                        id, 
                        name, 
                        description, 
                        image_url,
                        is_featured
                    `)
          .eq("visibility", "PUBLIC")
          .order("created_at", { ascending: false })
          .limit(50)

        if (allPersonas) {
          // Assign random rarities for demo (in production this would come from gacha_pool_items)
          const withRarity = allPersonas.map((p, i) => ({
            ...p,
            rarity: i === 0 ? "legendary" as const :
              i < 3 ? "epic" as const :
                i < 8 ? "rare" as const :
                  "common" as const,
            message_count: Math.floor(Math.random() * 50000),
            follower_count: Math.floor(Math.random() * 10000)
          }))

          setPersonas(withRarity)
          setFeaturedPersonas(withRarity.filter(p => p.is_featured).slice(0, 5))
        }
      } catch (error) {
        console.error("Error fetching personas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPersonas()
  }, [])

  const handlePersonaClick = (persona: { id: string }) => {
    router.push(`/character/${persona.id}`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <IconLoader2 className="h-12 w-12 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Ethereal background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-pink-500/5 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-amber-500/5 blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 flex items-center justify-between px-6 py-4 glass-dark">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <IconSparkles size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Remrin
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/summon"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-colors"
          >
            <IconDiamond size={18} />
            <span className="text-sm font-medium">Soul Summons</span>
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section with Carousel */}
      {featuredPersonas.length > 0 && (
        <section className="relative z-10 mt-8">
          <div className="px-6 mb-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white/80">
              <IconSparkles size={20} className="text-amber-400" />
              Featured Souls
            </h2>
          </div>
          <HeroCarousel
            items={featuredPersonas.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description,
              imageUrl: p.image_url,
              rarity: p.rarity,
              isFeatured: true
            }))}
            onItemClick={handlePersonaClick}
          />
        </section>
      )}

      {/* Main Gallery */}
      <section className="relative z-10 mt-8">
        <div className="px-6 mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white/80">
            Explore Souls
          </h2>
          <Link
            href="/discover"
            className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            View all
            <IconArrowRight size={16} />
          </Link>
        </div>

        {personas.length > 0 ? (
          <DraggableGallery
            items={personas.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description,
              imageUrl: p.image_url,
              rarity: p.rarity,
              messageCount: p.message_count,
              followersCount: p.follower_count
            }))}
            onItemClick={handlePersonaClick}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
              <IconSparkles size={48} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Souls Yet
            </h3>
            <p className="text-white/50 mb-6 max-w-sm">
              Be the first to create a Soul and bring it to life!
            </p>
            <Link
              href="/studio"
              className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-500 hover:to-pink-500 transition-all"
            >
              Create Your First Soul
            </Link>
          </div>
        )}
      </section>

      {/* Quick Actions Footer */}
      <section className="relative z-10 py-12 mt-8 glass-dark">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/summon"
            className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-colors group"
          >
            <IconDiamond size={32} className="text-amber-400 mb-4" />
            <h3 className="font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors">
              Soul Summons
            </h3>
            <p className="text-sm text-white/50">
              Try your luck to summon rare and legendary Souls
            </p>
          </Link>

          <Link
            href="/studio"
            className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-colors group"
          >
            <IconSparkles size={32} className="text-purple-400 mb-4" />
            <h3 className="font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
              Soul Studio
            </h3>
            <p className="text-sm text-white/50">
              Create and customize your own unique Souls
            </p>
          </Link>

          <Link
            href="/marketplace"
            className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors group"
          >
            <svg className="w-8 h-8 text-cyan-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <h3 className="font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
              Soul Bazaar
            </h3>
            <p className="text-sm text-white/50">
              Buy and sell Souls from the community
            </p>
          </Link>
        </div>
      </section>
    </div>
  )
}
