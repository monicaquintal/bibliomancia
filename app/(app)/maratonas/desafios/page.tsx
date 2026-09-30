import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ConfirmButton } from "@/components/ConfirmButton";
import { createChallenge, deleteChallenge } from "@/actions/marathons";

export default async function ChallengeLibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: mine }, { data: catalog }] = await Promise.all([
    supabase
      .from("challenges")
      .select("id, title")
      .eq("user_id", user!.id)
      .order("title", { ascending: true }),
    supabase
      .from("catalog_marathons")
      .select("key, name, catalog_marathon_challenges(position, challenges(title))")
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/maratonas" className="text-sm text-ink-soft hover:text-ink">
          ← Maratonas
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">Biblioteca de desafios</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Desafios não pertencem a uma maratona: você guarda aqui e coloca em quantas quiser. Os
          seus aparecem primeiro; os do catálogo vêm prontos.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold text-ink">Meus desafios</h2>
        <form action={createChallenge} className="flex flex-wrap items-center gap-2">
          <input
            name="title"
            required
            maxLength={120}
            aria-label="Novo desafio"
            placeholder="Ex: livro que você ganhou de presente"
            className="w-full max-w-sm rounded-lg border border-dust-line bg-paper px-2.5 py-1.5 text-sm focus:border-cover focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg border border-dust-line px-2.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink-soft hover:text-ink"
          >
            Criar desafio
          </button>
        </form>

        {(mine ?? []).length === 0 ? (
          <p className="text-sm text-ink-soft">Você ainda não criou nenhum desafio.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {mine!.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-dust-line bg-paper-raised px-3 py-2 text-sm text-ink"
              >
                <span>{c.title}</span>
                <form action={deleteChallenge}>
                  <input type="hidden" name="challengeId" value={c.id} />
                  <ConfirmButton
                    confirmMessage={`Excluir o desafio "${c.title}"? Ele continua nas maratonas onde já foi usado.`}
                    className="px-1 text-lg leading-none text-ink-soft hover:text-berry"
                  >
                    ×
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold text-ink">Do catálogo</h2>
        {(catalog ?? []).map((c) => {
          const items = [...c.catalog_marathon_challenges].sort((a, b) => a.position - b.position);
          return (
            <details key={c.key} className="rounded-lg border border-dust-line bg-paper-raised p-3">
              <summary className="cursor-pointer text-sm font-medium text-ink">
                {c.name} <span className="font-normal text-ink-soft">({items.length})</span>
              </summary>
              <ul className="mt-3 grid gap-x-6 gap-y-1 text-sm text-ink-soft sm:grid-cols-2">
                {items.map((item) => (
                  <li key={item.position}>{item.challenges?.title}</li>
                ))}
              </ul>
            </details>
          );
        })}
      </section>
    </div>
  );
}
