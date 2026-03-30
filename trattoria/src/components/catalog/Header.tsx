// Server Component base del header — sin Firebase, sin estado.
// El botón de usuario se renderiza desde un componente cliente por separado.
import Link from "next/link";
import { Suspense } from "react";
import { UserNavButton } from "./UserNavButton";

export function CatalogHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#E30909] shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">

        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/" className="flex-shrink-0">
            <img
              src="/tratologo.png"
              alt="Trattoria"
              className="h-10 md:h-14 w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-200"
            />
          </Link>
        </div>

        {/* Right: User button (cliente liviano) */}
        <div className="flex-shrink-0">
          <Suspense fallback={
            <div className="h-12 w-12 rounded-full bg-white/20 animate-pulse" />
          }>
            <UserNavButton />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
