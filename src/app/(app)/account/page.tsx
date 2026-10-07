import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { logout } from "@/actions/auth";
import { DeleteAccount, PasswordForm, ProfileForm } from "@/components/auth/account-forms";
import { Button, Card, CardHeader, PageHeader, Skeleton } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Account" description="Manage your profile, password and data." />
      <Suspense fallback={<Skeleton className="h-[640px]" />}>
        <AccountSettings />
      </Suspense>
    </div>
  );
}

async function AccountSettings() {
  const user = await requireUser();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Profile" description={`Signed in as ${user.email}`} />
        <div className="px-5 pb-6 pt-4 sm:px-6">
          <ProfileForm name={user.name} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Password" />
        <div className="px-5 pb-6 pt-4 sm:px-6">
          <PasswordForm />
        </div>
      </Card>

      <Card>
        <CardHeader title="Session" description="Sign out of PrepDeck on this device." />
        <form action={logout} className="px-5 pb-6 pt-4 sm:px-6">
          <Button type="submit" variant="secondary">
            <LogOut />
            Sign out
          </Button>
        </form>
      </Card>

      <Card className="border-danger/30">
        <CardHeader title="Danger zone" description="Permanently delete your account and everything in it." />
        <div className="px-5 pb-6 pt-4 sm:px-6">
          <DeleteAccount />
        </div>
      </Card>
    </div>
  );
}
