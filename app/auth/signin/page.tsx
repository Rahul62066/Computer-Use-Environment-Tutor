import { SignInButton } from "@/components/auth/SignInButton"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function SignInPage() {
  const session = await auth()

  if (session?.user) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Google Calendar Clone</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to manage your events and schedule
          </p>
        </div>
        <div className="mt-8">
          <SignInButton />
        </div>
      </div>
    </div>
  )
}
