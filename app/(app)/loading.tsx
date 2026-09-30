// Esqueleto exibido enquanto qualquer página de (app) carrega.
export default function Loading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Carregando">
      <div className="space-y-2">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-dust-line" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-dust-line" />
      </div>
      <div className="h-32 animate-pulse rounded-lg border border-dust-line bg-paper-raised" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg border border-dust-line bg-paper-raised"
          />
        ))}
      </div>
    </div>
  );
}
