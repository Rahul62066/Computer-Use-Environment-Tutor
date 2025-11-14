"use client"

import { Button } from "@/components/ui/button"
import { handleSignOut } from "@/app/actions/auth-actions"

export function SignOutButton() {
  return (
    <form action={handleSignOut}>
      <Button type="submit" variant="ghost">
        Sign out
      </Button>
    </form>
  )
}
