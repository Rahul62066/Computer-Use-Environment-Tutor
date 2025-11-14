import { HiOutlineUsers } from "react-icons/hi";
import { Input } from "../ui/input";

export default function SearchUsers() {
  return (
    <div className="relative">
      <HiOutlineUsers className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search for people"
        className="w-full rounded-lg border-0 bg-muted pl-7 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0"
      />
    </div>
  );
}
