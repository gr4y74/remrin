import { UserProfileSettings } from "@/components/settings/UserProfileSettings"
import { PageTemplate } from "@/components/layout"

export default function ProfilePage() {
    return (
        <PageTemplate
            showHeader={true}
            showFooter={false}
        >
            <UserProfileSettings />
        </PageTemplate>
    )
}
