"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brand } from "@/components/ui/brand"
import { login } from "./actions"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"

import { Eye, EyeOff, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"

export default function LoginForm() {
    const [passwordVisible, setPasswordVisible] = useState(false)
    const [loading, setLoading] = useState(false)
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get("redirect") || undefined

    const handleLogin = async (formData: FormData) => {
        setLoading(true)
        try {
            const result = await login(formData, redirectTo)
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
                            aria-label={passwordVisible ? "Hide password" : "Show password"}
                        >
                            {passwordVisible ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
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

            <GoogleSignInButton />

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
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Sign In
        </Button>
    )
}
