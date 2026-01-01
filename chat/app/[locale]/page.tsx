"use client"

import { useEffect, useState, useContext, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { FeaturedCarousel, DraggableGallery } from "@/components/discovery"
import { PageTemplate, Footer, HeroHeader } from "@/components/layout"
import { RemrinContext } from "@/context/context"
import { IconSparkles, IconDiamond, IconArrowRight } from "@tabler/icons-react"
import { LottieLoader } from "@/components/ui/lottie-loader"


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

const SIDEBAR_WIDTH = 350

// Demo content removed


export default function HomePage() {
  const router = useRouter()
  const { workspaces, profile } = useContext(RemrinContext)
  const { resolvedTheme } = useTheme()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [defaultWorkspaceId, setDefaultWorkspaceId] = useState<string | null>(null)

  // Theme-aware heading color: #faf4ed for dark, #191724 for light
  const headingColor = resolvedTheme === "light" ? "#191724" : "#faf4ed"

  // Get default workspace when available
  useEffect(() => {
    if (workspaces && workspaces.length > 0) {
      // Use the first workspace as default
      setDefaultWorkspaceId(workspaces[0].id)
    }
  }, [workspaces])

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const supabase = createClient()

        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser()
        setIsLoggedIn(!!user)

        // If logged in, try to get their workspaces
        if (user) {
          const { data: workspaceData } = await supabase
            .from("workspaces")
            .select("id")
            .eq("user_id", user.id)
            .limit(1)

          if (workspaceData && workspaceData.length > 0) {
            setDefaultWorkspaceId(workspaceData[0].id)
          }
        }

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

        if (allPersonas && allPersonas.length > 0) {
          // Assign random rarities for demo
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
        } else {
          // No real personas, will use demo data
          setPersonas([])
        }
      } catch (error) {
        console.error("Error fetching personas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPersonas()
  }, [])

  // Featured characters - same as carousel, all legendary
  const featuredCharacters = [
    { id: "kess", name: "Kess", image_url: "/images/featured/Kess.png" },
    { id: "oma", name: "Oma", image_url: "/images/featured/Oma.png" },
    { id: "silas", name: "Silas", image_url: "/images/featured/Silas.png" },
    { id: "squee", name: "Squee", image_url: "/images/featured/Squee.png" },
    { id: "sui", name: "Sui", image_url: "/images/featured/Sui.png" },
    { id: "volt", name: "Volt", image_url: "/images/featured/Volt.png" },
    { id: "boon", name: "Boon", image_url: "/images/featured/boon.png" },
    { id: "cupcake", name: "Cupcake", image_url: "/images/featured/cupcake.png" },
    { id: "fello-fello", name: "Fello Fello", image_url: "/images/featured/fello_fello.png" },
    { id: "fen", name: "Fen", image_url: "/images/featured/fen.png" },
    { id: "fenris", name: "Fenris", image_url: "/images/featured/fenris.png" },
    { id: "kael", name: "Kael", image_url: "/images/featured/kael.png" },
    { id: "kilo", name: "Kilo", image_url: "/images/featured/kilo.png" },
    { id: "krill", name: "Krill", image_url: "/images/featured/krill.png" },
    { id: "meek", name: "Meek", image_url: "/images/featured/meek.png" },
    { id: "surge", name: "Surge", image_url: "/images/featured/surge.png" },
    { id: "vorath", name: "Vorath", image_url: "/images/featured/vorath.png" }
  ]

  // Generate gallery items - all legendary, no demo stats
  const galleryItems = useMemo(() => {
    return featuredCharacters.map(char => ({
      ...char,
      description: null,
      rarity: "legendary" as const,
      message_count: undefined,
      follower_count: undefined
    }))
  }, [])

  // Generate hero carousel items (mix of real + demo)
  // Return only real featured personas
  const carouselItems = useMemo(() => {
    return personas.filter(p => p.is_featured).slice(0, 8)
  }, [personas])

  const handlePersonaClick = (persona: { id: string }) => {
    // Only navigate for real personas (not demo)
    // Only navigate for real personas


    // Navigate to chat with proper workspace
    if (defaultWorkspaceId) {
      router.push(`/${defaultWorkspaceId}/chat?persona=${persona.id}`)
    } else if (isLoggedIn) {
      // User is logged in but we don't have workspace yet, redirect to setup
      router.push("/setup")
    } else {
      // Not logged in, redirect to login
      router.push("/login")
    }
  }



  if (loading) {
    return (
      <div className="bg-rp-base flex min-h-screen items-center justify-center">
        <LottieLoader size={64} className="text-rp-rose" />
      </div>
    )
  }

  return (
    <PageTemplate
      showHeader={false}
      showFooter={false}
      fullBleed
      className="text-rp-text"
    >
      {/* Clean background - no gradients */}

      {/* Featured Souls Section with 3D Carousel */}
      <section className="relative mt-8">
        <div className="mb-4 px-6 text-center">
          <h2 className="font-tiempos-headline inline-flex items-center gap-2 font-semibold" style={{ fontSize: '40px', color: headingColor }}>
            <IconSparkles size={24} className="text-amber-400" />
            Featured Souls
            <IconSparkles size={24} className="text-amber-400" />
          </h2>
        </div>
        <FeaturedCarousel
          characters={[
            { id: "kess", name: "Kess", imageUrl: "/images/featured/Kess.png" },
            { id: "oma", name: "Oma", imageUrl: "/images/featured/Oma.png" },
            { id: "silas", name: "Silas", imageUrl: "/images/featured/Silas.png" },
            { id: "squee", name: "Squee", imageUrl: "/images/featured/Squee.png" },
            { id: "sui", name: "Sui", imageUrl: "/images/featured/Sui.png" },
            { id: "volt", name: "Volt", imageUrl: "/images/featured/Volt.png" },
            { id: "boon", name: "Boon", imageUrl: "/images/featured/boon.png" },
            { id: "cupcake", name: "Cupcake", imageUrl: "/images/featured/cupcake.png" },
            { id: "fello-fello", name: "Fello Fello", imageUrl: "/images/featured/fello_fello.png" },
            { id: "fen", name: "Fen", imageUrl: "/images/featured/fen.png" },
            { id: "fenris", name: "Fenris", imageUrl: "/images/featured/fenris.png" },
            { id: "kael", name: "Kael", imageUrl: "/images/featured/kael.png" },
            { id: "kilo", name: "Kilo", imageUrl: "/images/featured/kilo.png" },
            { id: "krill", name: "Krill", imageUrl: "/images/featured/krill.png" },
            { id: "meek", name: "Meek", imageUrl: "/images/featured/meek.png" },
            { id: "surge", name: "Surge", imageUrl: "/images/featured/surge.png" },
            { id: "vorath", name: "Vorath", imageUrl: "/images/featured/vorath.png" }
          ]}
          onCharacterClick={handlePersonaClick}
        />
      </section>

      {/* Main Gallery */}
      <section className="relative mt-8">
        <div className="mb-4 flex flex-col items-center gap-2 px-6">
          <h2 className="font-tiempos-headline font-semibold inline-flex items-center gap-2" style={{ fontSize: '40px', color: headingColor }}>
            <IconSparkles size={24} className="text-purple-400" />
            Explore Souls
            <IconSparkles size={24} className="text-purple-400" />
          </h2>
          <Link
            href="/discover"
            className="flex items-center gap-1 text-sm text-purple-400 transition-colors hover:text-purple-300"
          >
            View all
            <IconArrowRight size={16} />
          </Link>
        </div>

        <DraggableGallery
          items={galleryItems.map(p => ({
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
      </section>

      {/* Quick Actions Section */}
      <section className="relative mt-8 border-t border-rp-highlight-med bg-rp-surface dark:bg-rp-base py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 px-6 md:grid-cols-3">
          <Link
            href="/summon"
            className="group rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 transition-colors hover:border-amber-500/40"
          >
            <IconDiamond size={32} className="mb-4 text-amber-400" />
            <h3 className="font-tiempos-headline mb-2 font-semibold text-rp-text transition-colors group-hover:text-amber-400">
              Soul Summons
            </h3>
            <p className="text-sm text-rp-muted">
              Try your luck to summon rare and legendary Souls
            </p>
          </Link>

          <Link
            href="/studio"
            className="group rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 transition-colors hover:border-purple-500/40"
          >
            <IconSparkles size={32} className="mb-4 text-purple-400" />
            <h3 className="font-tiempos-headline mb-2 font-semibold text-rp-text transition-colors group-hover:text-purple-400">
              Soul Studio
            </h3>
            <p className="text-sm text-rp-muted">
              Create and customize your own unique Souls
            </p>
          </Link>

          <Link
            href="/marketplace"
            className="group rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 transition-colors hover:border-cyan-500/40"
          >
            <svg className="mb-4 size-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <h3 className="font-tiempos-headline mb-2 font-semibold text-rp-text transition-colors group-hover:text-cyan-400">
              Soul Bazaar
            </h3>
            <p className="text-sm text-rp-muted">
              Buy and sell Souls from the community
            </p>
          </Link>
        </div>
      </section>


      {/* Footer */}
      <Footer />
    </PageTemplate>
  )
}
