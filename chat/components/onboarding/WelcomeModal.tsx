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
import { RemrinContext } from "@/context/context"
import { updateProfile } from "@/db/profile"
import { cn } from "@/lib/utils"
import { FC, useContext, useEffect, useState } from "react"
import { toast } from "sonner"

interface WelcomeModalProps { }

export const WelcomeModal: FC<WelcomeModalProps> = () => {
    const { profile, setProfile } = useContext(RemrinContext)
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
            <DialogContent className="border-rp-muted/20 bg-rp-surface sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-rp-text text-2xl font-bold">Welcome to Remrin</DialogTitle>
                    <DialogDescription className="text-rp-subtle">
                        Before we begin, please tell us a bit about yourself so we can customize your experience.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-rp-text/80 text-right">
                            What should we call you?
                        </Label>
                        <Input
                            id="name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your display name"
                            className="bg-rp-base border-rp-muted/20 text-rp-text placeholder:text-rp-muted"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-rp-text/80 text-right">Age Group</Label>
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
                                        "w-full transition-all",
                                        ageBracket === option.value
                                            ? "bg-rp-iris text-rp-base hover:bg-rp-iris/90 border-0"
                                            : "hover:bg-rp-highlight-low border-rp-muted/20 text-rp-text bg-transparent"
                                    )}
                                    onClick={() => setAgeBracket(option.value)}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                        {ageBracket === "under_13" && (
                            <p className="text-rp-gold mt-1 text-xs">
                                Note: Remrin provides a family-friendly experience for all ages.
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="from-rp-pine to-rp-iris text-rp-base w-full border-0 bg-gradient-to-r font-bold hover:opacity-90"
                    >
                        {loading ? "Entering..." : "Enter Remrin"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
