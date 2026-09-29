import { createClient } from "@/lib/supabase/server";
import { SearchClient } from "@/components/SearchClient";
import { ManualBookForm } from "@/components/ManualBookForm";

export default async function SearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("library_entries")
    .select("books(google_volume_id)")
    .eq("user_id", user!.id);

  const existingVolumeIds = (entries ?? [])
    .map((entry) => entry.books?.google_volume_id)
    .filter((id): id is string => Boolean(id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">Pesquisar livros</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Busque por título, autor ou ISBN no Google Books e adicione à sua estante.
        </p>
      </div>
      <SearchClient existingVolumeIds={existingVolumeIds} />
      <ManualBookForm collapsible />
    </div>
  );
}
