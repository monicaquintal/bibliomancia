import Link from "next/link";
import { signOut } from "@/actions/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

function BookmarkMark() {
  return (
    <svg viewBox="0 0 24 28" className="h-6 w-5" aria-hidden>
      <path
        className="text-cover"
        fill="currentColor"
        d="M2 1h20a1 1 0 0 1 1 1v24.2a1 1 0 0 1-1.55.83L12 20.5l-9.45 6.53A1 1 0 0 1 1 26.2V2a1 1 0 0 1 1-1z"
      />
      <path
        className="text-marigold"
        fill="currentColor"
        d="M19 3 L19.9 5.1 L22 6 L19.9 6.9 L19 9 L18.1 6.9 L16 6 L18.1 5.1 Z"
      />
    </svg>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-dust-line bg-paper-raised">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/library" className="flex items-center gap-2">
              <BookmarkMark />
              <span className="font-serif text-lg font-semibold text-ink">
                Bibliomancia
              </span>
            </Link>
            <nav className="hidden items-center gap-5 text-sm font-medium text-ink-soft sm:flex">
              <Link href="/library" className="transition-colors hover:text-ink">
                Estante
              </Link>
              <Link href="/vitrine" className="transition-colors hover:text-ink">
                Vitrine
              </Link>
              <Link href="/maratonas" className="transition-colors hover:text-ink">
                Maratonas
              </Link>
              <Link href="/estatisticas" className="transition-colors hover:text-ink">
                Estatísticas
              </Link>
              <Link href="/descobrir" className="transition-colors hover:text-ink">
                Descobrir
              </Link>
              <Link href="/search" className="transition-colors hover:text-ink">
                Pesquisar
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-ink-soft transition-colors hover:text-ink"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
        <nav className="flex items-center gap-4 border-t border-dust-line px-4 py-2 text-sm font-medium text-ink-soft sm:hidden">
          <Link href="/library" className="hover:text-ink">
            Estante
          </Link>
          <Link href="/vitrine" className="hover:text-ink">
            Vitrine
          </Link>
          <Link href="/maratonas" className="hover:text-ink">
            Maratonas
          </Link>
          <Link href="/estatisticas" className="hover:text-ink">
            Estatísticas
          </Link>
          <Link href="/descobrir" className="hover:text-ink">
            Descobrir
          </Link>
          <Link href="/search" className="hover:text-ink">
            Pesquisar
          </Link>
        </nav>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}
