import { auth } from "@/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SignOutButton } from "./SignOutButton"

export async function UserButton() {
  const session = await auth()

  if (!session?.user) return null

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
          <AvatarFallback>
            {session.user.name?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{session.user.name}</span>
          <span className="text-xs text-muted-foreground">{session.user.email}</span>
        </div>
      </div>
      <SignOutButton />
    </div>
  )
}
