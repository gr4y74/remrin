"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChatbotUIContext } from "@/context/context"
import { claimPersona } from "@/db/personas"
import { IconLink } from "@tabler/icons-react"
import { FC, useContext, useState } from "react"
import { toast } from "sonner"

interface ClaimPersonaDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export const ClaimPersonaDialog: FC<ClaimPersonaDialogProps> = ({
    isOpen,
    onOpenChange
}) => {
    const { profile, personas, setPersonas } = useContext(ChatbotUIContext)
    const [soulId, setSoulId] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleClaim = async () => {
        if (!soulId.trim()) {
            toast.error("Please enter a Soul ID")
            return
        }

        if (!profile?.user_id) {
            toast.error("You must be logged in to claim a soul")
            return
        }

        setIsLoading(true)

        try {
            const claimedPersona = await claimPersona(soulId.trim())

            if (claimedPersona) {
                // Add the claimed persona to the list
                console.log("📋 Adding persona to list:", claimedPersona)
                console.log("📋 Current personas count:", personas.length)
                const newList = [claimedPersona, ...personas]
                console.log("📋 New personas count:", newList.length)
                setPersonas(newList)
                toast.success(`Successfully claimed "${claimedPersona.name}"!`)
                setSoulId("")
                onOpenChange(false)
            } else {
                toast.error("Could not claim this soul. It may not exist or is already claimed.")
            }
        } catch (error: any) {
            console.error("Claim error:", error)
            toast.error(error.message || "Failed to claim soul")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <IconLink size={20} />
                        Link Existing Soul
                    </DialogTitle>
                    <DialogDescription>
                        Enter the Soul ID (UUID) to claim a soul that was created in the
                        Forge but not automatically linked to your account.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="soul-id">Soul ID</Label>
                        <Input
                            id="soul-id"
                            placeholder="e.g., a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                            value={soulId}
                            onChange={e => setSoulId(e.target.value)}
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            You can find this ID in your confirmation email or the Forge
                            completion screen.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleClaim} disabled={isLoading || !soulId.trim()}>
                        {isLoading ? "Claiming..." : "Claim Soul"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
