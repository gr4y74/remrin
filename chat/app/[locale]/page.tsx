"use client"

import { useEffect, useState, useContext, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { HeroCarousel, DraggableGallery } from "@/components/discovery"
import { SidebarSwitcher } from "@/components/sidebar/sidebar-switcher"
import { Sidebar } from "@/components/sidebar/sidebar"
import { Tabs } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RemrinContext } from "@/context/context"
import { IconSparkles, IconDiamond, IconArrowRight, IconLoader2, IconChevronCompactRight } from "@tabler/icons-react"
import { ContentType } from "@/types"
import { cn } from "@/lib/utils"

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

// Demo names for generating extra cards
const DEMO_NAMES = [
  "Crystal Moonweaver", "Shadow Drifter", "Ember Phoenix", "Frost Whisper",
  "Storm Caller", "Velvet Dream", "Thunder Strike", "Mystic Rose",
  "Dark Knight", "Silver Star", "Golden Sun", "Ruby Heart",
  "Sapphire Wave", "Jade Dragon", "Onyx Shadow", "Pearl Mist",
  "Diamond Edge", "Amethyst Glow", "Topaz Flash", "Opal Shimmer",
  "Celestia Dawn", "Midnight Raven", "Aurora Sky", "Crimson Wolf",
  "Emerald Forest", "Violet Storm", "Azure Wind", "Scarlet Flame"
]

const DEMO_DESCRIPTIONS = [
  "A mysterious wanderer with ancient wisdom",
  "Master of the arcane arts",
  "Guardian of the eternal flame",
  "Keeper of forgotten secrets",
  "Born from starlight and shadow",
  "Traveler between worlds",
  "Wielder of elemental power",
  "Protector of the innocent"
]

export default function HomePage() {
  const router = useRouter()
  const { workspaces, profile } = useContext(RemrinContext)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const [contentType, setContentType] = useState<ContentType>("chats")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [defaultWorkspaceId, setDefaultWorkspaceId] = useState<string | null>(null)

  useEffect(() => {
    // Check if sidebar preference exists
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("showSidebar")
      setShowSidebar(saved === "true")
    }
  }, [])

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

  // Generate demo cards to fill the gallery
  const galleryItems = useMemo(() => {
    if (personas.length >= 20) return personas

    // Start with real personas
    const items = [...personas]

    // Add demo cards to reach at least 30 items
    const demoCount = Math.max(30 - personas.length, 0)
    for (let i = 0; i < demoCount; i++) {
      const rarityRoll = Math.random()
      const rarity: "common" | "rare" | "epic" | "legendary" =
        rarityRoll < 0.02 ? "legendary" :
          rarityRoll < 0.10 ? "epic" :
            rarityRoll < 0.30 ? "rare" : "common"

      items.push({
        id: `demo-${i}`,
        name: DEMO_NAMES[i % DEMO_NAMES.length],
        description: DEMO_DESCRIPTIONS[i % DEMO_DESCRIPTIONS.length],
        image_url: null, // Will show placeholder
        rarity,
        message_count: Math.floor(Math.random() * 50000),
        follower_count: Math.floor(Math.random() * 10000)
      })
    }

    return items
  }, [personas])

  // Generate hero carousel items (mix of real + demo)
  const carouselItems = useMemo(() => {
    const featured = personas.filter(p => p.is_featured)
    const items = featured.length > 0 ? featured : personas.slice(0, 3)

    // Add demo items to reach 8 total
    const demoCount = Math.max(8 - items.length, 0)
    for (let i = 0; i < demoCount; i++) {
      items.push({
        id: `demo-carousel-${i}`,
        name: DEMO_NAMES[(i + 10) % DEMO_NAMES.length],
        description: DEMO_DESCRIPTIONS[(i + 3) % DEMO_DESCRIPTIONS.length],
        image_url: null,
        rarity: i === 0 ? "legendary" as const : i < 2 ? "epic" as const : "rare" as const,
        is_featured: true,
        message_count: Math.floor(Math.random() * 100000),
        follower_count: Math.floor(Math.random() * 50000)
      })
    }

    return items.slice(0, 8)
  }, [personas])

  const handlePersonaClick = (persona: { id: string }) => {
    // Only navigate for real personas (not demo)
    if (persona.id.startsWith("demo-")) {
      // Demo persona - could show a modal or redirect to signup
      if (!isLoggedIn) {
        router.push("/login")
      } else {
        router.push("/studio")
      }
      return
    }

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

  const handleToggleSidebar = () => {
    const newValue = !showSidebar
    setShowSidebar(newValue)
    localStorage.setItem("showSidebar", String(newValue))
  }

  if (loading) {
    return (
      <div className="bg-rp-base flex min-h-screen items-center justify-center">
        <IconLoader2 className="text-rp-rose size-12 animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-rp-base flex size-full">
      {/* Sidebar - Only for logged in users */}
      {isLoggedIn && (
        <div
          className={cn(
            "duration-200 dark:border-none",
            showSidebar ? "border-r border-white/10" : ""
          )}
          style={{
            minWidth: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px",
            maxWidth: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px",
            width: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px"
          }}
        >
          {showSidebar && (
            <Tabs
              className="flex h-full bg-[#201d2f]"
              value={contentType}
              onValueChange={tabValue => setContentType(tabValue as ContentType)}
            >
              <SidebarSwitcher onContentTypeChange={setContentType} />
              <Sidebar contentType={contentType} showSidebar={showSidebar} />
            </Tabs>
          )}
        </div>
      )}

      {/* Main Content - normal page scroll */}
      <div className="relative min-h-screen flex-1 overflow-y-auto text-white">
        {/* Sidebar Toggle */}
        {isLoggedIn && (
          <Button
            className="fixed left-[4px] top-[50%] z-50 size-[32px]"
            style={{
              marginLeft: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px",
              transform: showSidebar ? "rotate(180deg)" : "rotate(0deg)",
              transition: "margin 200ms, transform 200ms"
            }}
            variant="ghost"
            size="icon"
            onClick={handleToggleSidebar}
          >
            <IconChevronCompactRight size={24} />
          </Button>
        )}

        {/* Ethereal background */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-0 size-[600px] rounded-full bg-purple-500/5 blur-[120px]" />
          <div className="absolute right-1/4 top-1/3 size-[500px] rounded-full bg-pink-500/5 blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-amber-500/5 blur-[150px]" />
        </div>

        {/* Header */}
        <header className="glass-dark relative z-50 flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.svg"
              alt="Remrin"
              width={128}
              height={128}
              className="drop-shadow-[0_0_12px_rgba(235,188,186,0.4)] transition-transform duration-300 ease-out hover:rotate-[-5deg] hover:scale-105"
            />
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/summon"
              className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-4 py-2 text-amber-400 transition-colors hover:bg-amber-500/30"
            >
              <IconDiamond size={18} />
              <span className="text-sm font-medium">Soul Summons</span>
            </Link>
            {!isLoggedIn && (
              <Link
                href="/login"
                className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-500 hover:to-pink-500"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Hero Section with Carousel */}
        <section className="relative z-10 mt-8">
          <div className="mb-4 px-6 text-center">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-white/80">
              <IconSparkles size={20} className="text-amber-400" />
              Featured Souls
            </h2>
          </div>
          <HeroCarousel
            items={carouselItems.map(p => ({
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

        {/* Main Gallery */}
        <section className="relative z-10 mt-8">
          <div className="mb-4 flex flex-col items-center gap-2 px-6">
            <h2 className="text-lg font-semibold text-white/80">
              Explore Souls
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

        {/* Quick Actions Footer */}
        <section className="glass-dark relative z-10 mt-8 py-12">
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 px-6 md:grid-cols-3">
            <Link
              href="/summon"
              className="group rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 transition-colors hover:border-amber-500/40"
            >
              <IconDiamond size={32} className="mb-4 text-amber-400" />
              <h3 className="mb-2 font-semibold text-white transition-colors group-hover:text-amber-400">
                Soul Summons
              </h3>
              <p className="text-sm text-white/50">
                Try your luck to summon rare and legendary Souls
              </p>
            </Link>

            <Link
              href="/studio"
              className="group rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 transition-colors hover:border-purple-500/40"
            >
              <IconSparkles size={32} className="mb-4 text-purple-400" />
              <h3 className="mb-2 font-semibold text-white transition-colors group-hover:text-purple-400">
                Soul Studio
              </h3>
              <p className="text-sm text-white/50">
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
              <h3 className="mb-2 font-semibold text-white transition-colors group-hover:text-cyan-400">
                Soul Bazaar
              </h3>
              <p className="text-sm text-white/50">
                Buy and sell Souls from the community
              </p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
