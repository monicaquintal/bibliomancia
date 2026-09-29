import Link from "next/link";
import { ManualBookForm } from "@/components/ManualBookForm";

export default function NewBookPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/library" className="text-sm text-ink-soft hover:text-ink">
          ← Minha estante
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">Cadastrar livro</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Para livros que não estão no Google Books: edições raras, volumes de mangá, zines,
          livros de amigos. Só o título é obrigatório. Antes de cadastrar, vale{" "}
          <Link href="/search" className="font-medium text-cover underline">
            procurar no catálogo
          </Link>
          .
        </p>
      </div>
      <ManualBookForm />
    </div>
  );
}
