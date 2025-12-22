"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brand } from "@/components/ui/brand"
import { login } from "./actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export default function LoginForm() {
    const [passwordVisible, setPasswordVisible] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (formData: FormData) => {
        setLoading(true)
        try {
            const result = await login(formData)
            if (result?.error) {
                toast.error(result.error)
            } else if (result?.redirect) {
                toast.success("Welcome back!")
                router.push(result.redirect)
            }
        } catch (e) {
            toast.error("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
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
                <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                <p className="text-muted-foreground text-sm">
                    Enter your email to sign in to your account
                </p>
            </div>

            <form action={handleLogin} className="flex flex-col gap-4">
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
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link
                            href="/login/password"
                            className="text-primary hover:text-primary/80 text-xs hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            required
                            type={passwordVisible ? "text" : "password"}
                            placeholder="••••••••"
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
                </div>

                <SubmitButton loading={loading} />
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background text-muted-foreground px-2">
                        Or continue with
                    </span>
                </div>
            </div>

            <Button
                variant="outline"
                type="button"
                onClick={handleGoogleLogin}
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
                Don&apos;t have an account?{" "}
                <Link
                    href="/signup"
                    className="text-primary hover:text-primary/80 font-medium hover:underline"
                >
                    Sign up
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
            Sign In
        </Button>
    )
}
