import HeaderLeft from "./left-side";
import HeaderRight from "./right-side";
import { UserButton } from "@/components/auth/UserButton";

export default function Header() {
  return (
    <div className="mx-3 flex items-center justify-between py-4">
      <HeaderLeft />
      <div className="flex items-center gap-4">
        <HeaderRight />
        <UserButton />
      </div>
    </div>
  );
}
