"use client"

import { useEffect, useState, useContext, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  FeaturedCarousel,
  DraggableGallery,
  TrendingSoulsList,
  FeaturedPremiumRow,
  CategorySection
} from "@/components/discovery"
import { RotatingBanner, Banner } from "@/components/discovery/RotatingBanner"
import { PageTemplate, Footer, FrontPageHeader } from "@/components/layout"
import { RemrinContext } from "@/context/context"
import { IconSparkles, IconDiamond, IconArrowRight } from "@tabler/icons-react"
import { WaveBackground } from "@/components/backgrounds/WaveBackground"
import { LottieLoader } from "@/components/ui/lottie-loader"
import { Skeleton } from "@/components/ui/skeleton"
import { OnboardingModal } from "@/components/onboarding/OnboardingModal"
import { useOnboarding } from "@/hooks/useOnboarding"


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

interface ContentSection {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  age_rating: string
  personas: Persona[]
}

const SIDEBAR_WIDTH = 350

// Demo content removed


export default function HomePage() {
  const router = useRouter()
  const { workspaces, profile } = useContext(RemrinContext)
  const { resolvedTheme } = useTheme()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [contentSections, setContentSections] = useState<ContentSection[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [defaultWorkspaceId, setDefaultWorkspaceId] = useState<string | null>(null)

  // Onboarding logic
  const { hasCompletedOnboarding, isLoading: onboardingLoading, completeOnboarding } = useOnboarding()

  // Show modal only if:
  // 1. Not loading auth or onboarding state
  // 2. User is logged in
  // 3. User hasn't completed onboarding
  const showOnboarding = !loading && !onboardingLoading && isLoggedIn && !hasCompletedOnboarding

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

    const fetchBanners = async () => {
      try {
        const supabase = createClient()
        const { data: bannersData, error } = await supabase
          .from("banners")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })

        if (error) {
          console.error("Error fetching banners:", error)
        } else {
          setBanners(bannersData ?? [])
        }
      } catch (error) {
        console.error("Error fetching banners:", error)
      }
    }

    fetchPersonas()
    fetchBanners()
    fetchContentSections()
  }, [])

  const fetchContentSections = async () => {
    try {
      const response = await fetch("/api/discovery/sections")
      const data = await response.json()
      if (data.sections) {
        setContentSections(data.sections)
      }
    } catch (error) {
      console.error("Error fetching content sections:", error)
    }
  }

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
  // Return only real featured personas, or fallback to demo content if database is empty/loading
  const carouselItems = useMemo(() => {
    const dbFeatured = personas.filter(p => p.is_featured)

    if (dbFeatured.length > 0) {
      return dbFeatured.slice(0, 8)
    }

    // Fallback to hardcoded featured characters if no DB results
    return featuredCharacters.map(char => ({
      ...char,
      description: null,
      is_featured: true,
      rarity: "legendary" as const
    }))
  }, [personas, featuredCharacters])

  const handlePersonaClick = (persona: { id: string } | string) => {
    const personaId = typeof persona === "string" ? persona : persona.id

    // Navigate to chat with proper workspace
    if (defaultWorkspaceId) {
      router.push(`/${defaultWorkspaceId}/chat?persona=${personaId}`)
    } else if (isLoggedIn) {
      // User is logged in but we don't have workspace yet, redirect to setup
      router.push("/setup")
    } else {
      // Not logged in, redirect to login
      router.push("/login")
    }
  }



  // if (loading) {
  //   return (
  //     <div className="bg-rp-base flex min-h-screen items-center justify-center">
  //       <LottieLoader size={64} className="text-rp-rose" />
  //     </div>
  //   )
  // }

  return (
    <PageTemplate
      showHeader={false}
      showFooter={false}
      fullBleed
      className="!bg-transparent text-rp-text relative isolate"
    >
      {/* Animated Wave Background - positioned below all content */}
      <WaveBackground
        className="absolute inset-0 pointer-events-none"
        colorScheme="purple"
        style={{ zIndex: -1 }}
      />

      {/* Main Content Wrapper - ensures all content stacks above waves */}
      <div className="relative" style={{ zIndex: 1, transformStyle: 'flat' }}>
        {/* Section 2: Header with Extension Banner, Search, Categories, Auth Buttons */}
        <FrontPageHeader
          onSearchResultClick={handlePersonaClick}
        />

        {/* Rotating Promotional Banners */}
        {banners.length > 0 && (
          <div className="container w-full mx-auto px-4 md:px-6 lg:px-8 pt-20 sm:pt-24 md:pt-28">
            <RotatingBanner banners={banners} />
          </div>
        )}

        {/* Onboarding Modal */}
        <OnboardingModal
          open={showOnboarding}
          onClose={completeOnboarding}
        />

        {/* Section 3: Featured Souls with 3D Carousel - Dynamic data */}
        <section className="relative mt-6 md:mt-8 overflow-hidden">
          <div className="mb-4 px-4 md:px-6 text-center">
            <h2 className="font-tiempos-headline inline-flex items-center gap-2 font-semibold text-2xl md:text-4xl" style={{ color: headingColor }}>
              <IconSparkles size={20} className="text-amber-400 md:hidden" />
              <IconSparkles size={24} className="text-amber-400 hidden md:inline" />
              Featured Souls
              <IconSparkles size={20} className="text-amber-400 md:hidden" />
              <IconSparkles size={24} className="text-amber-400 hidden md:inline" />
            </h2>
          </div>

          {loading ? (
            <div className="px-6 flex justify-center">
              <Skeleton className="w-[300px] h-[400px] md:w-[600px] md:h-[500px] rounded-3xl" />
            </div>
          ) : (
            <FeaturedCarousel
              characters={carouselItems.map(p => ({
                id: p.id,
                name: p.name,
                imageUrl: p.image_url,
                isFeatured: true
              }))}
              onCharacterClick={handlePersonaClick}
            />
          )}
        </section>

        {/* Section 4: Trending Souls - NEW */}
        <TrendingSoulsList onPersonaClick={handlePersonaClick} />

        {/* Section 5: Featured Premium - NEW */}
        <FeaturedPremiumRow onPersonaClick={handlePersonaClick} />

        {/* Section 5.5: Dynamic Content Sections (Kids, Gaming, etc.) - NEW */}
        {/* Section 5.5: Dynamic Content Sections (Kids, Gaming, etc.) - NEW */}
        {contentSections.map(section => (
          <div key={section.id} id={section.slug} className="scroll-mt-24">
            <CategorySection
              section={section}
              personas={section.personas}
              onPersonaClick={handlePersonaClick}
            />
          </div>
        ))}

        {/* Section 6: Explore All Souls - Updated with gacha-style cards */}
        <section id="explore-souls" className="relative mt-6 md:mt-8" data-section="explore-souls">
          <div className="mb-4 flex flex-col items-center gap-2 px-4 md:px-6">
            <h2 className="font-tiempos-headline font-semibold inline-flex items-center gap-2 text-2xl md:text-4xl" style={{ color: headingColor }}>
              <IconSparkles size={20} className="text-purple-400 md:hidden" />
              <IconSparkles size={24} className="text-purple-400 hidden md:inline" />
              Explore Souls
              <IconSparkles size={20} className="text-purple-400 md:hidden" />
              <IconSparkles size={24} className="text-purple-400 hidden md:inline" />
            </h2>
            <Link
              href="#explore-souls"
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
        <section className="relative mt-6 md:mt-8 border-t border-rp-iris/20 py-8 md:py-12">
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


        {/* Section 7: Footer - KEEP AS IS */}
        <Footer />
      </div>
    </PageTemplate>
  )
}
