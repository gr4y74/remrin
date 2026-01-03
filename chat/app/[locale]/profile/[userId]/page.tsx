import { PublicProfile } from "@/components/profile/PublicProfile"
import { PageTemplate } from "@/components/layout"

export default function ProfilePage() {
    return (
        <PageTemplate
            showHeader={true}
            showFooter={false}
            showSidebar={true}
        >
            <PublicProfile />
        </PageTemplate>
    )
}
