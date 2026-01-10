import { redirect } from "next/navigation"

export default function ProfileRedirect({ params }: { params: { userId: string } }) {
    // Redirect to default locale (en) profile page
    redirect(`/en/profile/${params.userId}`)
}
