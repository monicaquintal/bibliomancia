import Link from "next/link";
import { GoodreadsImport } from "@/components/GoodreadsImport";

// Cada lote faz várias buscas no Google Books (com retentativas); o padrão de 10s não basta.
export const maxDuration = 60;

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/library" className="text-sm text-ink-soft hover:text-ink">
          ← Minha estante
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">Importar do Goodreads</h1>
        <p className="mt-1 text-sm text-ink-soft">
          No Goodreads, abra <em>My Books → Import and export → Export Library</em> e baixe o
          arquivo CSV. Cada livro é buscado no Google Books e, se não estiver lá, na Open Library; se nenhuma tiver, ele é cadastrado com os dados do próprio CSV (sem capa). Livros que já estão na sua estante são ignorados, então dá para importar
          mais de uma vez sem duplicar.
        </p>
      </div>
      <GoodreadsImport />
    </div>
  );
}
