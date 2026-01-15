"use client"

import { RemrinContext } from "@/context/context"
import { getProfileByUserId, updateProfile } from "@/db/profile"
import {
  getHomeWorkspaceByUserId,
  getWorkspacesByUserId
} from "@/db/workspaces"
import {
  fetchHostedModels,
  fetchOpenRouterModels
} from "@/lib/models/fetch-models"
import { supabase } from "@/lib/supabase/browser-client"
import { TablesUpdate } from "@/supabase/types"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useState } from "react"
import { ProfileStep } from "../../../components/setup/profile-step"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  IconUser,
  IconMessageCircle,
  IconSparkles,
  IconArrowRight
} from "@tabler/icons-react"

export default function SetupPage() {
  const {
    profile,
    setProfile,
    setWorkspaces,
    setSelectedWorkspace,
    setEnvKeyMap,
    setAvailableHostedModels,
    setAvailableOpenRouterModels
  } = useContext(RemrinContext)

  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  // Profile Step
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState(profile?.username || "")
  const [usernameAvailable, setUsernameAvailable] = useState(true)

  useEffect(() => {
    ; (async () => {
      const session = (await supabase.auth.getSession()).data.session

      if (!session) {
        return router.push("/login")
      } else {
        const user = session.user

        const profile = await getProfileByUserId(user.id)

        if (!profile) {
          return router.push("/login")
        }

        setProfile(profile as any)
        setUsername(profile.username || "")

        if (!profile.has_onboarded) {
          setLoading(false)
        } else {
          const data = await fetchHostedModels(profile)

          if (!data) return

          setEnvKeyMap(data.envKeyMap)
          setAvailableHostedModels(data.hostedModels)

          if (profile["openrouter_api_key"] || data.envKeyMap["openrouter"]) {
            const openRouterModels = await fetchOpenRouterModels()
            if (!openRouterModels) return
            setAvailableOpenRouterModels(openRouterModels)
          }

          const homeWorkspaceId = await getHomeWorkspaceByUserId(
            session.user.id
          )
          return router.push(`/${homeWorkspaceId}/chat`)
        }
      }
    })()
  }, [router, setAvailableHostedModels, setAvailableOpenRouterModels, setEnvKeyMap, setProfile])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const session = (await supabase.auth.getSession()).data.session
      if (!session) {
        return router.push("/login")
      }

      const user = session.user
      const profile = await getProfileByUserId(user.id)

      if (!profile) {
        return router.push("/login")
      }

      const updateProfilePayload: TablesUpdate<"profiles"> = {
        has_onboarded: true,
        display_name: displayName,
        username
      }

      const updatedProfile = await updateProfile(profile.id, updateProfilePayload)
      setProfile(updatedProfile as any)

      const workspaces = await getWorkspacesByUserId(profile.user_id!)
      const homeWorkspace = workspaces.find(w => w.is_home)

      if (homeWorkspace) {
        setSelectedWorkspace(homeWorkspace)
        setWorkspaces(workspaces)
      }

      // Move to step 2 (choose path)
      setCurrentStep(2)
    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleNavigate = async (destination: "profile" | "discover" | "mother") => {
    const session = (await supabase.auth.getSession()).data.session
    if (!session) return router.push("/login")

    const homeWorkspaceId = await getHomeWorkspaceByUserId(session.user.id)

    switch (destination) {
      case "profile":
        router.push(`/profile/${session.user.id}`)
        break
      case "discover":
        router.push("/")
        break
      case "mother":
        // Navigate to Mother of Souls chat
        router.push(`/${homeWorkspaceId}/chat?persona=mother-of-souls`)
        break
    }
  }

  if (loading) {
    return null
  }

  // Step 1: Profile Setup
  if (currentStep === 1) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-[500px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconSparkles className="text-rp-iris" size={24} />
              Welcome to Remrin.ai
            </CardTitle>
            <CardDescription>Let's set up your profile</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <ProfileStep
              username={username}
              usernameAvailable={usernameAvailable}
              displayName={displayName}
              onUsernameAvailableChange={setUsernameAvailable}
              onUsernameChange={setUsername}
              onDisplayNameChange={setDisplayName}
            />

            <Button
              className="w-full bg-gradient-to-r from-rp-iris to-rp-rose hover:from-rp-iris/90 hover:to-rp-rose/90"
              disabled={!username || !usernameAvailable || saving}
              onClick={handleSaveProfile}
            >
              {saving ? "Saving..." : "Continue"}
              <IconArrowRight size={16} className="ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 2: Choose Your Path
  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-[550px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            Welcome{displayName ? `, ${displayName.split(" ")[0]}` : ""}! 🎉
          </CardTitle>
          <CardDescription className="text-base">
            What would you like to do first?
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Option 1: Setup Profile */}
          <button
            onClick={() => handleNavigate("profile")}
            className="group w-full rounded-xl border border-rp-highlight-med bg-rp-surface/50 p-4 text-left transition-all hover:border-rp-iris hover:bg-rp-surface"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <IconUser size={24} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-rp-text group-hover:text-rp-iris">
                  Customize Your Profile
                </h3>
                <p className="text-sm text-rp-muted">
                  Upload an avatar, add a bio, and personalize your page
                </p>
              </div>
              <IconArrowRight size={20} className="text-rp-muted transition-transform group-hover:translate-x-1 group-hover:text-rp-iris" />
            </div>
          </button>

          {/* Option 2: Start Chatting */}
          <button
            onClick={() => handleNavigate("discover")}
            className="group w-full rounded-xl border border-rp-highlight-med bg-rp-surface/50 p-4 text-left transition-all hover:border-rp-foam hover:bg-rp-surface"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                <IconMessageCircle size={24} className="text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-rp-text group-hover:text-rp-foam">
                  Start Chatting
                </h3>
                <p className="text-sm text-rp-muted">
                  Explore and chat with featured Souls from the community
                </p>
              </div>
              <IconArrowRight size={20} className="text-rp-muted transition-transform group-hover:translate-x-1 group-hover:text-rp-foam" />
            </div>
          </button>

          {/* Option 3: Mother of Souls */}
          <button
            onClick={() => handleNavigate("mother")}
            className="group w-full rounded-xl border border-rp-highlight-med bg-gradient-to-r from-amber-500/5 to-orange-500/5 p-4 text-left transition-all hover:border-amber-500 hover:from-amber-500/10 hover:to-orange-500/10"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30">
                <IconSparkles size={24} className="text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-rp-text group-hover:text-amber-400">
                  Create Your Own Soul
                </h3>
                <p className="text-sm text-rp-muted">
                  Speak with the Mother of Souls to craft your own AI companion
                </p>
              </div>
              <IconArrowRight size={20} className="text-rp-muted transition-transform group-hover:translate-x-1 group-hover:text-amber-400" />
            </div>
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
