import Link from "next/link";
import { AUTH_ASSETS } from "../auth-config";

export function AuthBrand() {
  return (
    <Link href="/" className="inline-flex items-center" aria-label="Octalve Workspace">
      <img
        src={AUTH_ASSETS.logo}
        alt="Octalve"
        className="h-auto w-[150px] object-contain"
      />
    </Link>
  );
}
