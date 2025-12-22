import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChatbotUIContext } from "@/context/context"
import { updateProfile } from "@/db/profile"
import { cn } from "@/lib/utils"
import { FC, useContext, useEffect, useState } from "react"
import { toast } from "sonner"

interface WelcomeModalProps { }

export const WelcomeModal: FC<WelcomeModalProps> = () => {
    const { profile, setProfile } = useContext(ChatbotUIContext)
    const [isOpen, setIsOpen] = useState(false)
    const [displayName, setDisplayName] = useState("")
    const [ageBracket, setAgeBracket] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (profile && !profile.onboarding_complete) {
            setIsOpen(true)
            setDisplayName(profile.display_name || "")
        }
    }, [profile]) // Rely on profile state

    const handleSubmit = async () => {
        if (!profile) return

        if (!displayName.trim()) {
            toast.error("Please enter a display name")
            return
        }

        if (!ageBracket) {
            toast.error("Please select an age group")
            return
        }

        setLoading(true)

        try {
            const updatedProfile = await updateProfile(profile.id, {
                ...profile,
                display_name: displayName,
                age_bracket: ageBracket,
                onboarding_complete: true
            })

            setProfile(updatedProfile)
            setIsOpen(false)
            toast.success("Welcome to Remrin!")
        } catch (error) {
            toast.error("Failed to update profile. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    // Prevent closing by clicking outside
    const handleOpenChange = (open: boolean) => {
        if (!open && (!profile?.onboarding_complete)) {
            // Do not allow closing if onboarding is not complete
            return
        }
        setIsOpen(open)
    }

    if (!profile) return null

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="glassmorphism-dark sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Welcome to Remrin</DialogTitle>
                    <DialogDescription className="text-gray-300">
                        Before we begin, please tell us a bit about yourself so we can customize your experience.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-right">
                            What should we call you?
                        </Label>
                        <Input
                            id="name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your display name"
                            className="bg-black/20 border-white/10"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-right">Age Group</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: "Under 13", value: "under_13" },
                                { label: "13 - 17", value: "13_17" },
                                { label: "18 - 24", value: "18_24" },
                                { label: "25+", value: "25_plus" }
                            ].map((option) => (
                                <Button
                                    key={option.value}
                                    variant={ageBracket === option.value ? "default" : "outline"}
                                    className={cn(
                                        "w-full",
                                        ageBracket === option.value
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                            : "bg-transparent hover:bg-white/5 border-white/10"
                                    )}
                                    onClick={() => setAgeBracket(option.value)}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                        {ageBracket === "under_13" && (
                            <p className="text-xs text-yellow-500 mt-1">
                                Note: Remrin provides a family-friendly experience for all ages.
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                    >
                        {loading ? "Entering..." : "Enter Remrin"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
