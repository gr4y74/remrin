import { NextResponse } from "next/server"

// POST: Validate admin password
export async function POST(request: Request) {
    try {
        const { password } = await request.json()

        // Check against environment variable
        const adminPassword = process.env.ADMIN_PASSWORD

        if (!adminPassword) {
            console.error("ADMIN_PASSWORD not set in environment")
            return NextResponse.json(
                { error: "Admin access not configured" },
                { status: 500 }
            )
        }

        if (password === adminPassword) {
            return NextResponse.json({
                success: true,
                message: "Authentication successful"
            })
        } else {
            return NextResponse.json(
                { error: "Invalid password" },
                { status: 401 }
            )
        }
    } catch (error) {
        console.error("Admin auth error:", error)
        return NextResponse.json(
            { error: "Authentication failed" },
            { status: 500 }
        )
    }
}
