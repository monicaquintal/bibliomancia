import { DiscoverForm } from "@/components/DiscoverForm";

export default function DiscoverPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">Descobrir</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Diga o que você quer ler agora e a gente sugere pelo menos 5 livros em português do
          Google Books, de fora da sua estante.
        </p>
      </div>
      <DiscoverForm />
    </div>
  );
}
