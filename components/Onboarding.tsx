"use client";

import Link from "next/link";
import { useState } from "react";
import { StickyNote } from "@/components/StickyNote";

const PAGES = [
  {
    title: "seu cantinho de leitura",
    body: "Aqui você registra o que lê, no seu ritmo: começa, comenta o que sentiu ao longo do caminho e termina com nota e resenha.",
    href: "/search",
    cta: "Procurar o primeiro livro",
    note: "só você vê tudo isso",
  },
  {
    title: "já tem histórico no Goodreads?",
    body: "Exporte sua biblioteca em CSV e traga tudo de uma vez: leituras, notas, resenhas e prateleiras.",
    href: "/library/importar",
    cta: "Importar do Goodreads",
    note: "leva uns minutinhos",
  },
  {
    title: "organize do seu jeito",
    body: "Crie estantes personalizadas e maratonas, os desafios só seus, e veja tudo aparecer na vitrine.",
    href: "/maratonas",
    cta: "Criar uma maratona",
    note: "sem cobrança de metas",
  },
];

export function Onboarding() {
  const [page, setPage] = useState(0);
  const current = PAGES[page];

  return (
    <section
      aria-label="Primeiros passos"
      className="relative rounded-lg border border-dust-line bg-paper-raised px-6 py-10 text-center sm:px-16"
    >
      <button
        type="button"
        aria-label="Página anterior"
        disabled={page === 0}
        onClick={() => setPage(page - 1)}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg border border-dust-line px-2 py-1 text-ink-soft hover:text-ink disabled:opacity-30"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Próxima página"
        disabled={page === PAGES.length - 1}
        onClick={() => setPage(page + 1)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-dust-line px-2 py-1 text-ink-soft hover:text-ink disabled:opacity-30"
      >
        ›
      </button>

      <div className="mx-auto max-w-lg space-y-4">
        <h2 className="font-serif text-2xl font-semibold italic text-ink">{current.title}</h2>
        <p className="text-sm text-ink-soft">{current.body}</p>
        <div>
          <StickyNote tilt={page % 2 === 0 ? "-rotate-2" : "rotate-2"}>{current.note}</StickyNote>
        </div>
        <Link
          href={current.href}
          className="inline-block rounded-lg bg-cover px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-cover-dark"
        >
          {current.cta}
        </Link>
      </div>

      <p className="mt-6 text-xs italic text-ink-soft">
        pág. {page + 1} de {PAGES.length}
      </p>
      <div className="mt-2 flex justify-center gap-1.5">
        {PAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ir para a página ${i + 1}`}
            aria-current={i === page ? "true" : undefined}
            onClick={() => setPage(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === page ? "w-6 bg-marigold" : "w-1.5 bg-dust-line"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
