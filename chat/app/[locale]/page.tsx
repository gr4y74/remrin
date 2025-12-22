"use client"

import { ChatbotUISVG } from "@/components/icons/chatbotui-svg"
import { IconArrowRight, IconHeart, IconSparkles } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface FeaturedPersona {
  id: string
  name: string
  description: string | null
  image_url: string | null
  category: string | null
}

export default function HomePage() {
  const { theme } = useTheme()
  const [featuredPersonas, setFeaturedPersonas] = useState<FeaturedPersona[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("personas")
          .select("id, name, description, image_url, category")
          .eq("is_featured", true)
          .eq("visibility", "PUBLIC")
          .limit(6)

        setFeaturedPersonas(data || [])
      } catch (error) {
        console.error("Error fetching featured personas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeatured()
  }, [])

  return (
    <div className="flex size-full flex-col items-center overflow-auto bg-gradient-to-b from-background to-background/50">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div>
          <ChatbotUISVG theme={theme === "dark" ? "dark" : "light"} scale={0.3} />
        </div>

        <div className="mt-2 text-4xl font-bold">Remrin</div>
        <p className="mt-2 max-w-md text-muted-foreground">
          Talk to AI characters with unique personalities
        </p>

        <Link
          className="mt-6 flex w-[200px] items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 p-3 font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-500 hover:to-cyan-400"
          href="/login"
        >
          Start Chatting
          <IconArrowRight className="ml-2" size={20} />
        </Link>
      </div>

      {/* Featured Souls Section */}
      {!loading && featuredPersonas.length > 0 && (
        <div className="w-full max-w-5xl px-6 pb-16">
          <div className="mb-8 flex items-center gap-3">
            <IconSparkles className="text-yellow-400" size={24} />
            <h2 className="text-2xl font-bold">Featured Souls</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPersonas.map((persona) => (
              <Link
                key={persona.id}
                href={`/character/${persona.id}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/30 hover:bg-white/10 hover:shadow-xl hover:shadow-purple-500/10"
              >
                {/* Persona Image */}
                <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-purple-900/50 to-cyan-900/50">
                  {persona.image_url ? (
                    <Image
                      src={persona.image_url}
                      alt={persona.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <IconHeart size={48} className="text-pink-400 opacity-50" />
                    </div>
                  )}
                </div>

                {/* Persona Info */}
                <h3 className="mb-1 text-lg font-bold text-foreground group-hover:text-purple-400 transition-colors">
                  {persona.name}
                </h3>
                {persona.category && (
                  <span className="mb-2 inline-block rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
                    {persona.category}
                  </span>
                )}
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {persona.description || "Start a conversation..."}
                </p>
              </Link>
            ))}
          </div>

          {/* View All Link */}
          <div className="mt-8 text-center">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 text-purple-400 transition-colors hover:text-purple-300"
            >
              Discover more Souls
              <IconArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-16">
          <div className="size-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
        </div>
      )}
    </div>
  )
}
