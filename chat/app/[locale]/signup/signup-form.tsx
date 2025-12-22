"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Brand } from "@/components/ui/brand"
import { signup } from "./actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export default function SignupForm() {
    const [passwordVisible, setPasswordVisible] = useState(false)
    const [loading, setLoading] = useState(false)
    const [password, setPassword] = useState("")
    const router = useRouter()
    const supabase = createClient()

    // Password Strength Logic
    const hasMinLength = password.length >= 8
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const hasNumber = /\d/.test(password)

    const strengthScore = [hasMinLength, hasSpecialChar, hasNumber].filter(Boolean).length

    const handleSignup = async (formData: FormData) => {
        setLoading(true)
        try {
            const result = await signup(formData)
            if (result?.error) {
                toast.error(result.error)
            } else if (result?.message) {
                toast.success(result.message)
                // Optionally redirect to login or show a success state
                // router.push("/login") 
            } else {
                // If immediate login happened (no verification required)
                router.push("/setup")
            }
        } catch (e) {
            toast.error("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignup = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        })

        if (error) {
            toast.error(error.message)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card/30 border-border/50 flex w-full flex-col justify-center gap-6 rounded-2xl border p-8 shadow-xl backdrop-blur-xl sm:max-w-md"
        >
            <div className="flex flex-col items-center gap-2 text-center">
                <Brand />
                <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
                <p className="text-muted-foreground text-sm">
                    Enter your details to get started
                </p>
            </div>

            <form action={handleSignup} className="flex flex-col gap-4">
                <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                        id="displayName"
                        name="displayName"
                        placeholder="John Doe"
                        required
                        className="bg-background/50 border-input/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        placeholder="name@example.com"
                        required
                        type="email"
                        className="bg-background/50 border-input/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            required
                            type={passwordVisible ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-background/50 border-input/50 focus:border-primary/50 focus:ring-primary/20 pr-10 transition-all duration-200"
                        />
                        <button
                            type="button"
                            onClick={() => setPasswordVisible(!passwordVisible)}
                            className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        >
                            {passwordVisible ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                        <div className="space-y-2 pt-1 transition-all">
                            <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
                                <div
                                    className={`h-full transition-all duration-500 ${strengthScore === 0 ? "w-0" :
                                            strengthScore === 1 ? "w-1/3 bg-red-500" :
                                                strengthScore === 2 ? "w-2/3 bg-yellow-500" :
                                                    "w-full bg-green-500"
                                        }`}
                                />
                            </div>
                            <ul className="text-muted-foreground space-y-1 text-xs">
                                <li className={`flex items-center gap-1 ${hasMinLength ? "text-green-500" : ""}`}>
                                    {hasMinLength ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border" />}
                                    At least 8 characters
                                </li>
                                <li className={`flex items-center gap-1 ${hasNumber ? "text-green-500" : ""}`}>
                                    {hasNumber ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border" />}
                                    Contains a number
                                </li>
                                <li className={`flex items-center gap-1 ${hasSpecialChar ? "text-green-500" : ""}`}>
                                    {hasSpecialChar ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border" />}
                                    Contains a special character
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-2 py-2">
                    <Checkbox id="terms" required />
                    <label
                        htmlFor="terms"
                        className="text-muted-foreground text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        I agree to the{" "}
                        <Link href="/terms" className="text-primary hover:underline">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-primary hover:underline">
                            Privacy Policy
                        </Link>
                    </label>
                </div>

                <SubmitButton loading={loading} />
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background text-muted-foreground px-2">
                        Or sign up with
                    </span>
                </div>
            </div>

            <Button
                variant="outline"
                type="button"
                onClick={handleGoogleSignup}
                className="bg-background/50 border-input/50 hover:bg-accent/50"
            >
                <svg
                    className="mr-2 h-4 w-4"
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fab"
                    data-icon="google"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 488 512"
                >
                    <path
                        fill="currentColor"
                        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                    ></path>
                </svg>
                Google
            </Button>

            <div className="text-muted-foreground text-center text-sm">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="text-primary hover:text-primary/80 font-medium hover:underline"
                >
                    Sign in
                </Link>
            </div>
        </motion.div>
    )
}

function SubmitButton({ loading }: { loading: boolean }) {
    const { pending } = useFormStatus()
    const isLoading = loading || pending

    return (
        <Button
            className="bg-primary hover:bg-primary/90 w-full font-bold text-white transition-all duration-200"
            type="submit"
            disabled={isLoading}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
        </Button>
    )
}
