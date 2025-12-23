"use client"

import { useEffect, useState, useContext, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { HeroCarousel, DraggableGallery } from "@/components/discovery"
import { SidebarSwitcher } from "@/components/sidebar/sidebar-switcher"
import { Sidebar } from "@/components/sidebar/sidebar"
import { Tabs } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChatbotUIContext } from "@/context/context"
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
  const { workspaces, profile } = useContext(ChatbotUIContext)
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
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <IconLoader2 className="h-12 w-12 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="flex size-full bg-[#0a0a0f]">
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
              className="flex h-full"
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
      <div className="relative flex-1 min-h-screen text-white overflow-y-auto">
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
            {!isLoggedIn && (
              <Link
                href="/login"
                className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Hero Section with Carousel */}
        <section className="relative z-10 mt-8">
          <div className="px-6 mb-4 text-center">
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
          <div className="px-6 mb-4 flex flex-col items-center gap-2">
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
    </div>
  )
}
