import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { FcGoogle } from "react-icons/fc"

export function SignInButton() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("google", { redirectTo: "/" })
      }}
    >
      <Button type="submit" variant="outline" size="lg" className="w-full">
        <FcGoogle className="mr-2 h-5 w-5" />
        Sign in with Google
      </Button>
    </form>
  )
}
